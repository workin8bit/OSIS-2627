export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(v: string): string | null | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function countdownParts(target: string | null, now: number): {
  text: string;
  done: boolean;
} | null {
  if (!target) return null;
  const t = new Date(target).getTime();
  if (isNaN(t)) return null;
  const diff = t - now;
  if (diff <= 0) return { text: "selesai", done: true };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  let text = "";
  if (d > 0) text += `${d} hari `;
  if (h > 0 || d > 0) text += `${h} jam `;
  text += `${m} menit ${s} detik`;
  return { text, done: false };
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
