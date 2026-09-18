"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, isDemoMode } from "@/lib/backend";
import {
  fmtDateTime,
  fromLocalInput,
  pct,
  toLocalInput,
} from "@/lib/format";
import type {
  AdminStats,
  Candidate,
  CandidateInput,
  ResultRow,
  SettingsPatch,
  Status,
  VoterRow,
} from "@/lib/types";

const ADMIN_KEY = "osis_admin_key";

type Tab = "dashboard" | "candidates" | "voters" | "settings" | "danger";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "candidates", label: "Kandidat", icon: "👤" },
  { id: "voters", label: "Pemilih", icon: "🧑‍" },
  { id: "settings", label: "Pengaturan", icon: "⚙️" },
  { id: "danger", label: "Zona Bahaya", icon: "⚠️" },
];

// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_KEY)) setUnlocked(true);
  }, []);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 4000);
  }, []);

  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error ? e.message : String(e));
    window.setTimeout(() => setError(""), 6000);
  }, []);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setKeyError("");
    try {
      await api.adminStats(key);
      sessionStorage.setItem(ADMIN_KEY, key);
      setUnlocked(true);
      setKey("");
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Kunci salah.");
    } finally {
      setChecking(false);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(ADMIN_KEY);
    setUnlocked(false);
  };

  const adminKey =
    typeof window !== "undefined"
      ? (sessionStorage.getItem(ADMIN_KEY) ?? "")
      : "";

  if (!unlocked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="fade-up w-full max-w-sm">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl text-white">
              🔒
            </div>
            <h1 className="mt-5 text-center text-xl font-extrabold text-slate-900">
              Panel Administrator
            </h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              Masukkan kunci admin untuk mengelola pemilihan.
            </p>
            <form onSubmit={unlock} className="mt-6 space-y-4">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Kunci admin"
                autoFocus
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {keyError && (
                <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
                  {keyError}
                </div>
              )}
              <button
                disabled={checking}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                {checking ? "Memeriksa..." : "Buka Panel"}
              </button>
            </form>
            {isDemoMode && (
              <p className="mt-4 text-center text-xs text-amber-700">
                Mode demo: kunci admin <code>admin123</code>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Panel Admin
          </h1>
          <p className="text-sm text-slate-500">
            Kelola kandidat, pemilih, periode, dan hasil.
          </p>
        </div>
        <button
          onClick={lock}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Ganti Sesi
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl bg-rose-50 px-5 py-3.5 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-3.5 text-sm font-medium text-emerald-700">
          {notice}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "dashboard" && (
          <DashboardTab key_={adminKey} />
        )}
        {tab === "candidates" && (
          <CandidatesTab key_={adminKey} flash={flash} fail={fail} />
        )}
        {tab === "voters" && (
          <VotersTab key_={adminKey} flash={flash} fail={fail} />
        )}
        {tab === "settings" && (
          <SettingsTab
            key_={adminKey}
            flash={flash}
            fail={fail}
            onPasswordChanged={lock}
          />
        )}
        {tab === "danger" && (
          <DangerTab key_={adminKey} flash={flash} fail={fail} />
        )}
      </div>
    </div>
  );
}

// ------------------------------- DASHBOARD ---------------------------------

function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        tone === "accent"
          ? "border-indigo-200 bg-indigo-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`text-xs font-bold uppercase tracking-wide ${
          tone === "accent" ? "text-indigo-500" : "text-slate-400"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-3xl font-extrabold ${
          tone === "accent" ? "text-indigo-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs font-medium text-slate-500">{sub}</div>
      )}
    </div>
  );
}

function DashboardTab({ key_ }: { key_: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [status, setStatus] = useState<Status | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, r, st] = await Promise.all([
        api.adminStats(key_),
        api.adminResults(key_),
        api.getStatus(),
      ]);
      setStats(s);
      setRows(r);
      setStatus(st);
    } catch {
      /* noop */
    }
  }, [key_]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const participation = stats
    ? pct(stats.voted, stats.total_voters)
    : 0;
  const max = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pemilih Terdaftar"
          value={String(stats?.total_voters ?? "—")}
        />
        <StatCard
          label="Suara Masuk"
          value={String(stats?.total_votes ?? "—")}
        />
        <StatCard
          label="Partisipasi"
          value={`${participation}%`}
          tone="accent"
          sub={stats ? `${stats.voted}/${stats.total_voters} pemilih` : undefined}
        />
        <StatCard
          label="Kandidat Aktif"
          value={String(stats?.candidates ?? "—")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Perolehan Suara</h3>
          <div className="mt-4 space-y-4">
            {rows.map((r) => (
              <div key={r.candidate_id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    {r.candidate_number}. {r.candidate_name}
                  </span>
                  <span className="font-bold text-slate-900">{r.total}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="bar-anim h-full rounded-full bg-indigo-500"
                    style={{ width: `${pct(r.total, max)}%` }}
                  />
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-sm text-slate-400">Belum ada kandidat.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Status Pemilihan</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Sekolah" value={status?.school_name ?? "—"} />
            <Row label="Nama Pemilihan" value={status?.election_name ?? "—"} />
            <Row label="Tahun Ajaran" value={status?.academic_year ?? "—"} />
            <Row label="Mulai" value={fmtDateTime(status?.start_at)} />
            <Row label="Selesai" value={fmtDateTime(status?.end_at)} />
            <Row
              label="Voting"
              value={
                status?.is_open ? "DIBUKA ✅" : "DITUTUP "
              }
            />
            <Row
              label="Halaman Hasil"
              value={
                status?.show_results ? "DIBUKA ✅" : "DITUTUP 🔒"
              }
            />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2.5 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

// ------------------------------- KANDIDAT ----------------------------------

const EMPTY_CAND: CandidateInput = {
  number: 0,
  name: "",
  class_name: "",
  photo_url: "",
  slogan: "",
  vision: "",
  mission: "",
  is_active: true,
};

function CandidatesTab({
  key_,
  flash,
  fail,
}: {
  key_: string;
  flash: (m: string) => void;
  fail: (e: unknown) => void;
}) {
  const [list, setList] = useState<Candidate[]>([]);
  const [editing, setEditing] = useState<CandidateInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    try {
      setList(await api.listCandidates());
    } catch (e) {
      fail(e);
    }
  }, [fail]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setFormError("Nama wajib diisi.");
      return;
    }
    if (!editing.number || editing.number < 1) {
      setFormError("Nomor urut minimal 1.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.adminUpsertCandidate(key_, {
        ...editing,
        name: editing.name.trim(),
      });
      flash(editing.id ? "Kandidat diperbarui." : "Kandidat ditambahkan.");
      setEditing(null);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const del = async (c: Candidate) => {
    if (
      !window.confirm(
        `Hapus kandidat ${c.name}? Semua suara untuk kandidat ini ikut terhapus.`
      )
    )
      return;
    try {
      await api.adminDeleteCandidate(key_, c.id);
      flash("Kandidat dihapus.");
      load();
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">
          Kandidat ({list.length})
        </h2>
        <button
          onClick={() => {
            setFormError("");
            setEditing({ ...EMPTY_CAND, number: list.length + 1 });
          }}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
        >
          + Tambah Kandidat
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kelas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-bold text-indigo-600">
                  {c.number}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {c.name}
                  {c.slogan && (
                    <div className="text-xs font-normal italic text-slate-400">
                      “{c.slogan}”
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{c.class_name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      c.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setFormError("");
                      setEditing({
                        id: c.id,
                        number: c.number,
                        name: c.name,
                        class_name: c.class_name,
                        photo_url: c.photo_url ?? "",
                        slogan: c.slogan ?? "",
                        vision: c.vision,
                        mission: c.mission,
                        is_active: c.is_active,
                      });
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => del(c)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Belum ada kandidat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit Kandidat" : "Tambah Kandidat"}
          onClose={() => !saving && setEditing(null)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor Urut">
              <input
                type="number"
                min={1}
                value={editing.number || ""}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    number: parseInt(e.target.value || "0", 10),
                  })
                }
                className="input"
              />
            </Field>
            <Field label="Kelas">
              <input
                value={editing.class_name}
                onChange={(e) =>
                  setEditing({ ...editing, class_name: e.target.value })
                }
                placeholder="XII IPA 1"
                className="input"
              />
            </Field>
          </div>
          <Field label="Nama Lengkap" className="mt-4">
            <input
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Slogan" className="mt-4">
            <input
              value={editing.slogan}
              onChange={(e) => setEditing({ ...editing, slogan: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="URL Foto (opsional)" className="mt-4">
            <input
              value={editing.photo_url}
              onChange={(e) =>
                setEditing({ ...editing, photo_url: e.target.value })
              }
              placeholder="https://..."
              className="input"
            />
          </Field>
          <Field label="Visi" className="mt-4">
            <textarea
              rows={3}
              value={editing.vision}
              onChange={(e) => setEditing({ ...editing, vision: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Misi" className="mt-4">
            <textarea
              rows={5}
              value={editing.mission}
              onChange={(e) =>
                setEditing({ ...editing, mission: e.target.value })
              }
              placeholder={"- Poin 1\n- Poin 2"}
              className="input"
            />
          </Field>
          <label className="mt-4 flex items-center gap-2.5 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(e) =>
                setEditing({ ...editing, is_active: e.target.checked })
              }
              className="h-4 w-4 accent-indigo-600"
            />
            Kandidat aktif (terlihat oleh pemilih)
          </label>

          {formError && (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              disabled={saving}
              onClick={() => setEditing(null)}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              disabled={saving}
              onClick={save}
              className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// -------------------------------- PEMILIH ----------------------------------

function parseVoterLines(text: string): {
  rows: { nis: string; name: string; class_name: string; password: string }[];
  errors: string[];
} {
  const rows: { nis: string; name: string; class_name: string; password: string }[] = [];
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  lines.forEach((line, i) => {
    const parts = line.split(/[;,\t]/).map((s) => s.trim());
    if (parts.length < 4) {
      errors.push(`Baris ${i + 1}: format NIS;Nama;Kelas;Password`);
      return;
    }
    const [nis, name, class_name, password] = parts;
    if (!/^\d+$/.test(nis)) errors.push(`Baris ${i + 1}: NIS harus angka.`);
    if (!name) errors.push(`Baris ${i + 1}: nama kosong.`);
    rows.push({ nis, name, class_name, password });
  });
  return { rows, errors };
}

function VotersTab({
  key_,
  flash,
  fail,
}: {
  key_: string;
  flash: (m: string) => void;
  fail: (e: unknown) => void;
}) {
  const [list, setList] = useState<VoterRow[]>([]);
  const [bulk, setBulk] = useState(
    "2025100;Contoh Nama;XII IPA 1;password123"
  );
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      setList(await api.adminListVoters(key_));
    } catch (e) {
      fail(e);
    }
  }, [key_, fail]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const { rows, errors } = parseVoterLines(bulk);
    setBulkErrors(errors);
    if (rows.length === 0) return;
    setAdding(true);
    try {
      const n = await api.adminAddVoters(key_, rows);
      flash(`${n} pemilih berhasil ditambahkan/diperbarui.`);
      setBulk("");
      setBulkErrors([]);
      load();
    } catch (e) {
      fail(e);
    } finally {
      setAdding(false);
    }
  };

  const resetVote = async (v: VoterRow) => {
    if (!window.confirm(`Reset status vote ${v.name} (${v.nis})?`)) return;
    try {
      await api.adminResetVote(key_, v.nis);
      flash("Status vote direset.");
      load();
    } catch (e) {
      fail(e);
    }
  };

  const remove = async (v: VoterRow) => {
    if (!window.confirm(`Hapus pemilih ${v.name} (${v.nis})?`)) return;
    try {
      await api.adminRemoveVoter(key_, v.nis);
      flash("Pemilih dihapus.");
      load();
    } catch (e) {
      fail(e);
    }
  };

  const filtered = useMemo(
    () =>
      list.filter(
        (v) =>
          v.nis.includes(q) ||
          v.name.toLowerCase().includes(q.toLowerCase()) ||
          v.class_name.toLowerCase().includes(q.toLowerCase())
      ),
    [list, q]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900">
          Tambah Pemilih Massal
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Satu baris per siswa, dipisah titik koma:{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
            NIS;Nama;Kelas;Password
          </code>{" "}
          — NIS yang sudah ada akan diperbarui password-nya.
        </p>
        <textarea
          rows={5}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          className="input mt-3 font-mono text-xs"
          placeholder={"2025100;Ahmad Fauzi;XII IPA 1;password123\n2025101;Dewi Lestari;XII IPA 2;password123"}
        />
        {bulkErrors.length > 0 && (
          <div className="mt-3 max-h-32 overflow-y-auto rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
            {bulkErrors.map((e, i) => (
              <div key={i}>⚠ {e}</div>
            ))}
          </div>
        )}
        <button
          onClick={add}
          disabled={adding}
          className="mt-3 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
        >
          {adding ? "Menambahkan..." : "＋ Simpan Pemilih"}
        </button>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900">
            Daftar Pemilih ({list.length})
          </h3>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari NIS / nama / kelas..."
            className="w-64 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="mt-3 max-h-[480px] overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">NIS</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.nis} className="border-t border-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-700">
                    {v.nis}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {v.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {v.class_name}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        v.has_voted
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {v.has_voted ? "Sudah vote" : "Belum vote"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {v.has_voted && (
                      <button
                        onClick={() => resetVote(v)}
                        className="rounded-lg px-2.5 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => remove(v)}
                      className="rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Tidak ada pemilih{q ? " yang cocok" : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ------------------------------- PENGATURAN --------------------------------

function SettingsTab({
  key_,
  flash,
  fail,
  onPasswordChanged,
}: {
  key_: string;
  flash: (m: string) => void;
  fail: (e: unknown) => void;
  onPasswordChanged: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [school, setSchool] = useState("");
  const [election, setElection] = useState("");
  const [year, setYear] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<"" | "ok" | "err">("");

  useEffect(() => {
    api
      .getStatus()
      .then((st) => {
        setStatus(st);
        setSchool(st.school_name);
        setElection(st.election_name);
        setYear(st.academic_year);
        setStart(toLocalInput(st.start_at));
        setEnd(toLocalInput(st.end_at));
        setIsOpen(st.is_open);
        setShowResults(st.show_results);
      })
      .catch(fail);
  }, [fail]);

  const save = async () => {
    setSaving(true);
    setFormError("");
    try {
      const patch: SettingsPatch = {
        school_name: school,
        election_name: election,
        academic_year: year,
        is_open: isOpen,
        show_results: showResults,
        // kosongkan periode jika field di-clear (sebelumnya terisi)
        start_at: !start
          ? status?.start_at
            ? "CLEAR"
            : undefined
          : fromLocalInput(start) ?? undefined,
        end_at: !end
          ? status?.end_at
            ? "CLEAR"
            : undefined
          : fromLocalInput(end) ?? undefined,
      };
      await api.adminSetSettings(key_, patch);
      flash("Pengaturan disimpan.");
      const st = await api.getStatus();
      setStatus(st);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    setPwSaving(true);
    setPwMsg("");
    try {
      await api.adminSetAdminPassword(key_, pwNew);
      setPwMsg("ok");
      setPwOld("");
      setPwNew("");
      setTimeout(onPasswordChanged, 1500);
    } catch (e) {
      setPwMsg("err");
      window.alert(
        e instanceof Error ? e.message : "Gagal mengganti password."
      );
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900">Informasi Pemilihan</h3>
        <div className="mt-4 space-y-4">
          <Field label="Nama Sekolah">
            <input value={school} onChange={(e) => setSchool(e.target.value)} className="input" />
          </Field>
          <Field label="Nama Pemilihan">
            <input value={election} onChange={(e) => setElection(e.target.value)} className="input" />
          </Field>
          <Field label="Tahun Ajaran">
            <input value={year} onChange={(e) => setYear(e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mulai Voting (WIB)">
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Selesai Voting (WIB)">
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="input"
              />
            </Field>
          </div>
          <p className="text-xs text-slate-400">
            Kosongkan field untuk tanpa batas waktu.
          </p>

          <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">
              Buka voting (siswa bisa memilih)
            </span>
            <Switch on={isOpen} onChange={setIsOpen} />
          </label>
          <label className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">
              Tampilkan hasil publik
            </span>
            <Switch on={showResults} onChange={setShowResults} />
          </label>

          {formError && (
            <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
              {formError}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900">Ganti Kunci Admin</h3>
        <p className="mt-1 text-xs text-slate-500">
          Gunakan password yang baru dan kuat. Kunci lama otomatis tidak
          berlaku.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Kunci Saat Ini">
            <input
              type="password"
              value={pwOld}
              onChange={(e) => setPwOld(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Kunci Baru (min. 4 karakter)">
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              className="input"
            />
          </Field>
          {pwMsg === "ok" && (
            <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              ✓ Kunci berhasil diganti — kamu akan di-logout sebentar lagi.
            </div>
          )}
          {pwMsg === "err" && (
            <div className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
              Gagal mengganti kunci.
            </div>
          )}
          <button
            onClick={changePw}
            disabled={pwSaving || !pwOld || pwNew.length < 4}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {pwSaving ? "Mengganti..." : "Ganti Kunci Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

// ------------------------------- ZONA BAHAYA -------------------------------

function DangerTab({
  key_,
  flash,
  fail,
}: {
  key_: string;
  flash: (m: string) => void;
  fail: (e: unknown) => void;
}) {
  const [confirmText, setConfirmText] = useState("");

  const resetAll = async () => {
    try {
      await api.adminResetVotes(key_);
      flash("Semua suara dihapus dan status pemilih direset.");
      setConfirmText("");
    } catch (e) {
      fail(e);
    }
  };

  const resetDemo = async () => {
    try {
      await api.resetDemo();
      flash("Data demo direset.");
      window.setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      fail(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/50 p-6">
        <h3 className="font-extrabold text-rose-700">
          Hapus Semua Suara
        </h3>
        <p className="mt-1 text-sm text-rose-600">
          Menghapus seluruh suara yang masuk dan mengembalikan semua pemilih ke
          status <b>belum vote</b>. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Ketik "RESET" untuk konfirmasi'
            className="flex-1 min-w-[220px] rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-500"
          />
          <button
            disabled={confirmText !== "RESET"}
            onClick={resetAll}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-200 hover:bg-rose-700 disabled:opacity-40"
          >
            Hapus Semua Suara
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-extrabold text-amber-700">Reset Data Demo</h3>
          <p className="mt-1 text-sm text-amber-700">
            Kembalikan seluruh data demo (kandidat, pemilih, suara, pengaturan)
            ke kondisi awal.
          </p>
          <button
            onClick={resetDemo}
            className="mt-4 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            Reset Data Demo
          </button>
        </div>
      )}
    </div>
  );
}

// ------------------------------- UTIL UI ------------------------------------

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="fade-up my-4 w-full max-w-2xl rounded-3xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

