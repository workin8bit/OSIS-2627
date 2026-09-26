/**
 * Teks kaya sederhana untuk misi kandidat.
 *
 * Hasil fungsi ini masuk ke dangerouslySetInnerHTML, jadi HTML dari input
 * wajib di-escape lebih dulu. Urutan penting: escape dahulu, baru bungkus
 * dengan tag <strong>/<em> milik kita.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** Escape HTML lalu terapkan markdown tebal/miring. Aman untuk innerHTML. */
export function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*/g, "$1<em>$2</em>");
}
