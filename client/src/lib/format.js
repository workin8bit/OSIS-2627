const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const BULAN_S = BULAN.map((b) => b.slice(0, 3));
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function parse(d) {
  if (!d) return null;
  const s = String(d);
  // "YYYY-MM-DD" -> tanggal lokal, "YYYY-MM-DD HH:MM:SS" (UTC dari SQLite)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(s.replace(' ', 'T') + (s.includes('Z') || s.includes('+') ? '' : 'Z'));
}

export function formatDate(d, { withDay = false } = {}) {
  const dt = parse(d);
  if (!dt || isNaN(dt)) return '-';
  const base = `${dt.getDate()} ${BULAN[dt.getMonth()]} ${dt.getFullYear()}`;
  return withDay ? `${HARI[dt.getDay()]}, ${base}` : base;
}

export function dateParts(d) {
  const dt = parse(d);
  if (!dt || isNaN(dt)) return { day: '-', month: '-', year: '' };
  return { day: dt.getDate(), month: BULAN_S[dt.getMonth()], monthFull: BULAN[dt.getMonth()], year: dt.getFullYear(), weekday: HARI[dt.getDay()] };
}

export function relativeTime(d) {
  const dt = parse(d);
  if (!dt) return '';
  const diff = (Date.now() - dt.getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} hari lalu`;
  return formatDate(d);
}

/** '07:00:00' -> '07.00' */
export function fmtTime(t) {
  return t ? String(t).slice(0, 5).replace(':', '.') : '-';
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export { BULAN, HARI };

export const STATUS_PROGRAM = {
  rencana: { label: 'Rencana', cls: 'bg-slate-100 text-slate-700' },
  berjalan: { label: 'Berjalan', cls: 'bg-blue-100 text-blue-700' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-700' },
  batal: { label: 'Dibatalkan', cls: 'bg-red-100 text-red-700' },
};

export const STATUS_ASPIRASI = {
  baru: { label: 'Baru', cls: 'bg-amber-100 text-amber-800' },
  diproses: { label: 'Diproses', cls: 'bg-blue-100 text-blue-700' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-700' },
  ditolak: { label: 'Tidak Dapat Diproses', cls: 'bg-red-100 text-red-700' },
};
