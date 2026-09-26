import type { NewVoter } from "@/lib/types";

/**
 * Import pemilih massal dari CSV / TSV / XLSX.
 *
 * Mendukung:
 *  - .csv  (koma, titik koma, tab, pipe)
 *  - .tsv  (tab)
 *  - .txt  (delimited)
 *  - .xlsx (OOXML, dibaca native: ZIP + XML)
 *
 * Tidak memakai library spreadsheet pihak ketiga.
 */

export interface ImportResult {
  rows: NewVoter[];
  errors: string[];
  /** Jumlah baris data yang ditemukan (tanpa baris header). */
  total: number;
  /** true bila file punya baris header yang dipetakan ke kolom. */
  hasHeader: boolean;
}

const DELIMITERS = [";", ",", "\t", "|"] as const;

/* -------------------------------------------------------------------------- */
/* Pem delimited text (RFC 4180)                                              */
/* -------------------------------------------------------------------------- */

function sniffDelimiter(sample: string): string {
  // Abaikan karakter di dalam tanda kutip saat menghitung kandidat delimiter.
  let best = ";";
  let bestScore = -1;
  for (const d of DELIMITERS) {
    const counts: number[] = [];
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < sample.length; i++) {
      const ch = sample[i];
      if (ch === '"') {
        if (inQuotes && sample[i + 1] === '"') i++;
        else inQuotes = !inQuotes;
      } else if (!inQuotes && ch === d) {
        count++;
      } else if (!inQuotes && ch === "\n") {
        counts.push(count);
        count = 0;
      }
    }
    if (sample.length && !sample.endsWith("\n")) counts.push(count);
    const lines = counts.filter((c) => c > 0);
    if (!lines.length) continue;
    // Skor = modus jumlah delimiter per baris, dikalikan konsistensi.
    const freq = new Map<number, number>();
    for (const c of lines) freq.set(c, (freq.get(c) ?? 0) + 1);
    let mode = 0;
    let modeHits = 0;
    for (const [c, hits] of freq) {
      if (hits > modeHits || (hits === modeHits && c > mode)) {
        mode = c;
        modeHits = hits;
      }
    }
    const score = mode * 1000 + modeHits;
    if (mode >= 1 && score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

/** Parser CSV/TSV yang menghormati tanda kutip, newline di dalam sel, dan BOM. */
export function parseDelimited(input: string, delimiter?: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // hapus BOM
  const d = delimiter ?? sniffDelimiter(text.slice(0, 64 * 1024));

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let touched = false;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    // Buang baris kosong sepenuhnya.
    if (row.length > 1 || row[0].trim() !== "") rows.push(row);
    row = [];
    touched = false;
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    touched = true;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === d) {
      endField();
    } else if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
    } else if (ch === "\n") {
      endRow();
    } else {
      field += ch;
    }
  }
  if (touched || field !== "" || row.length) endRow();
  return rows;
}

/* -------------------------------------------------------------------------- */
/* Pembaca .xlsx (OOXML) tanpa dependency                                     */
/* -------------------------------------------------------------------------- */

function u16(d: Uint8Array, o: number) {
  return d[o] | (d[o + 1] << 8);
}
function u32(d: Uint8Array, o: number) {
  return (
    (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0
  );
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "Browser tidak mendukung pembacaan .xlsx. Simpan file sebagai CSV lalu impor ulang."
    );
  }
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Baca seluruh entri ZIP dari sebuah .xlsx. */
async function readZip(buf: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);

  // Cari End of Central Directory (signature 0x06054b50) dari belakang.
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66_000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("File .xlsx rusak: direktori ZIP tidak ditemukan.");

  const count = u16(u8, eocd + 10);
  let ptr = u32(u8, eocd + 16);
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder("utf-8");

  for (let n = 0; n < count; n++) {
    if (u32(u8, ptr) !== 0x02014b50) break;
    const method = u16(u8, ptr + 10);
    const compSize = u32(u8, ptr + 20);
    const nameLen = u16(u8, ptr + 28);
    const extraLen = u16(u8, ptr + 30);
    const commentLen = u16(u8, ptr + 32);
    const localOff = u32(u8, ptr + 42);
    const name = dec.decode(u8.subarray(ptr + 46, ptr + 46 + nameLen));

    // Lokal header: nama + extra bisa berbeda panjang dari entri pusat.
    const lNameLen = u16(u8, localOff + 26);
    const lExtraLen = u16(u8, localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = u8.subarray(start, start + compSize);

    if (method === 0) out.set(name, raw);
    else if (method === 8) out.set(name, await inflateRaw(raw));
    // method lain (mis. 12/14) tidak dipakai oleh writer xlsx umum.

    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, "application/xml");
}

const q = (el: Element, local: string) =>
  el.getElementsByTagNameNS("*", local);

/** Kolom A -> 0, "AA" -> 26. */
function colToIndex(ref: string): number {
  let n = 0;
  for (let i = 0; i < ref.length; i++) {
    const c = ref.charCodeAt(i);
    if (c < 65 || c > 90) break;
    n = n * 26 + (c - 64);
  }
  return n - 1;
}

/**
 * Urutan sheet sesuai workbook.xml, agar sheet pertama yang ditulis user
 * adalah yang dipakai.
 */
async function pickFirstSheet(
  zip: Map<string, Uint8Array>,
): Promise<string | null> {
  const workbook = zip.get("xl/workbook.xml");
  if (!workbook) return null;
  const doc = parseXml(new TextDecoder().decode(workbook));
  const sheets = q(doc.documentElement, "sheet");
  if (!sheets.length) return null;

  const first = sheets[0];
  const rid = first.getAttribute("r:id") || first.getAttributeNS(
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "id",
  );

  let target: string | null = null;
  if (rid && zip.has("xl/_rels/workbook.xml.rels")) {
    const rels = parseXml(new TextDecoder().decode(zip.get("xl/_rels/workbook.xml.rels")!));
    for (const rel of q(rels.documentElement, "Relationship")) {
      if (rel.getAttribute("Id") === rid) {
        target = rel.getAttribute("Target") || null;
        break;
      }
    }
  }

  const candidates = [
    target && target.startsWith("/")
      ? target.slice(1)
      : target
        ? `xl/${target.replace(/^\.\//, "")}`
        : null,
    "xl/worksheets/sheet1.xml",
  ].filter((x): x is string => !!x);

  for (const c of candidates) if (zip.has(c)) return c;
  for (const [name] of zip) if (/^xl\/worksheets\/.*\.xml$/.test(name)) return name;
  return null;
}

function readSharedStrings(zip: Map<string, Uint8Array>): string[] {
  const raw = zip.get("xl/sharedStrings.xml");
  if (!raw) return [];
  const doc = parseXml(new TextDecoder().decode(raw));
  const out: string[] = [];
  for (const si of q(doc.documentElement, "si")) {
    // Gabungkan seluruh run <t> (rich text).
    let s = "";
    for (const t of q(si, "t")) s += t.textContent ?? "";
    out.push(s);
  }
  return out;
}

/** Baca satu sheet .xlsx menjadi matriks string. */
export async function readXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const zip = await readZip(buf);
  const sheetPath = await pickFirstSheet(zip);
  if (!sheetPath) throw new Error("File .xlsx tidak berisi sheet yang bisa dibaca.");

  const shared = readSharedStrings(zip);
  const doc = parseXml(new TextDecoder().decode(zip.get(sheetPath)!));

  const rows: string[][] = [];
  for (const rowEl of q(doc.documentElement, "row")) {
    const cells: string[] = [];
    let cursor = 0;
    for (const c of q(rowEl, "c")) {
      const ref = c.getAttribute("r");
      const idx = ref ? colToIndex(ref) : cursor;
      while (cells.length < idx) cells.push("");

      const type = c.getAttribute("t");
      let value = "";
      if (type === "s") {
        const v = q(c, "v")[0];
        const n = v ? parseInt(v.textContent ?? "", 10) : -1;
        value = n >= 0 ? (shared[n] ?? "") : "";
      } else if (type === "inlineStr") {
        for (const t of q(c, "t")) value += t.textContent ?? "";
      } else {
        const v = q(c, "v")[0];
        value = v?.textContent ?? "";
      }
      cells[idx] = value.trim();
      cursor = idx + 1;
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

/* -------------------------------------------------------------------------- */
/* Pemetaan kolom -> NewVoter                                                 */
/* -------------------------------------------------------------------------- */

const HEADER_ALIASES: Record<string, RegExp> = {
  NISN: /^(nisn|nis|nomor\s*induk(\s*siswa)?|no\s*induk)$/i,
  name: /^(nama(\s*(siswa|peserta|pemilih|lengkap|calon))?|name)$/i,
  class_name: /^(kelas|rombel|romi|class|kelas\s*siswa)$/i,
  password: /^(password|pass|sandi|kata\s*sandi|sandi\s*pemilih)$/i,
  role: /^(role|peran|status|jenis)$/i,
  NIP: /^(nip|nipn|no\s*induk\s*pegawai)$/i,
};

/** Nama kolom kanonik untuk pesan error. */
const HEADER_LABELS: Record<keyof NewVoter, string> = {
  NISN: "NIS",
  name: "Nama",
  class_name: "Kelas",
  password: "Password",
  role: "Role",
  NIP: "NIP",
};

function normHeader(h: string) {
  return h.replace(/[_.]/g, " ").replace(/\s+/g, " ").trim();
}

function matchHeader(h: string): keyof NewVoter | null {
  const n = normHeader(h);
  for (const [key, re] of Object.entries(HEADER_ALIASES)) {
    if (re.test(n)) return key as keyof NewVoter;
  }
  return null;
}

function looksLikeHeaderRow(row: string[]): boolean {
  return row.some((cell) => matchHeader(cell) !== null);
}

/** Kolom yang dianggap "harus ada" bila header dipakai. */
const REQUIRED: (keyof NewVoter)[] = ["NISN", "name", "class_name", "password"];

export function buildVoters(matrix: string[][]): ImportResult {
  const rows = matrix.filter((r) => r.some((c) => c && c.trim() !== ""));
  if (!rows.length) {
    return { rows: [], errors: ["File tidak berisi data."], total: 0, hasHeader: false };
  }

  let hasHeader = false;
  let start = 0;
  let col: Record<string, number> = {};

  if (looksLikeHeaderRow(rows[0])) {
    hasHeader = true;
    start = 1;
    rows[0].forEach((h, i) => {
      const key = matchHeader(h);
      if (key && col[key] === undefined) col[key] = i;
    });
    const missing = REQUIRED.filter((k) => col[k] === undefined);
    if (missing.length) {
      const human = missing.map((k) => HEADER_LABELS[k]).join(", ");
      return {
        rows: [],
        errors: [
          `Header tidak lengkap. Kolom wajib belum ditemukan: ${human}.`,
          "Pola header yang dikenali: NIS/NISN, Nama, Kelas, Kata Sandi, Role, NIP.",
        ],
        total: 0,
        hasHeader: true,
      };
    }
  } else {
    // Tanpa header: urutan kolom tetap NIS;Nama;Kelas;Password[;Role][;NIP]
    col = { NISN: 0, name: 1, class_name: 2, password: 3, role: 4, NIP: 5 };
  }

  const out: NewVoter[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const lineNo = i + 1; // 1-based, termasuk header
    const get = (k: keyof NewVoter) => (col[k] === undefined ? "" : (r[col[k]] ?? "").trim());

    // NIS / NIP: kolom pertama dianggap identitas utama.
    let nisn = get("NISN");
    const nip = get("NIP");
    let role = (get("role") || "siswa").toLowerCase();

    if (role === "guru" || role === "guru/pegawai" || role === "teacher") {
      role = "guru";
      if (!nisn && nip) nisn = nip; // backend meng-key lewat NIP untuk guru
    } else {
      role = "siswa";
    }

    const name = get("name");
    const className = get("class_name");
    const password = get("password");

    if (!nisn) {
      errors.push(`Baris ${lineNo}: kolom NIS/NIP kosong.`);
      continue;
    }
    if (!/^\d+$/.test(nisn)) {
      errors.push(`Baris ${lineNo}: NIS "${nisn}" harus angka saja.`);
      continue;
    }
    if (!name) {
      errors.push(`Baris ${lineNo}: nama kosong.`);
      continue;
    }
    if (!className) {
      errors.push(`Baris ${lineNo}: kelas kosong.`);
      continue;
    }
    if (!password) {
      errors.push(`Baris ${lineNo}: password kosong.`);
      continue;
    }
    if (seen.has(nisn)) {
      errors.push(`Baris ${lineNo}: NIS ${nisn} duplikat di dalam file, dilewati.`);
      continue;
    }
    seen.add(nisn);

    out.push({
      NISN: nisn,
      name,
      class_name: className,
      password,
      role,
      NIP: role === "guru" ? (nip || nisn) : "",
    });
  }

  if (!out.length && !errors.length) {
    errors.push("Tidak ada baris valid untuk diimpor.");
  }

  return { rows: out, errors, total: rows.length - start, hasHeader };
}

/** Baca file yang dipilih user dan kembalikan matriks string. */
export async function readVoterFile(file: File): Promise<string[][]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "xlsx" || ext === "xlsm") {
    return readXlsx(await file.arrayBuffer());
  }
  if (ext === "xls") {
    throw new Error(
      "Format .xls lama belum didukung. Buka di Excel lalu simpan ulang sebagai .xlsx atau .csv."
    );
  }
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    return parseDelimited(await file.text());
  }
  throw new Error(
    `Format "${ext || "tidak dikenal"}" tidak didukung. Gunakan .csv, .tsv, atau .xlsx.`
  );
}

export const ACCEPTED_IMPORT = ".csv,.tsv,.txt,.xlsx";
