/**
 * Penampil isi berita untuk situs publik.
 *
 * Isi berita disimpan sebagai Markdown sederhana agar admin bisa memformat
 * teks lewat toolbar. Semua HTML di-escape lebih dulu, sehingga markup
 * apa pun yang diketik admin (atau tersisip tak sengaja) tidak pernah
 * dieksekusi sebagai HTML.
 */

const escapeHtml = (text = '') =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Batasi skema URL agar `javascript:` tidak pernah jadi tautan. */
function safeUrl(url = '') {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (/^(\/|\.\/|\.\.\/|#)/.test(trimmed)) return trimmed;
  return '#';
}

/** Format sebaris: kode, tebal, miring, lalu tautan. */
function renderInline(text = '') {
  let html = escapeHtml(text);

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  html = html.replace(/\[([^\]\n]+)\]\(([^()\n]*(?:\([^()\n]*\)[^()\n]*)*)\)/g, (_, label, url) =>
    `<a href="${safeUrl(url)}" target="_blank" rel="noreferrer noopener">${label}</a>`,
  );
  return html;
}

/**
 * Ubah satu blok Markdown menjadi HTML.
 * baris pertama boleh jadi subjudul; sisa baris lalu diproses sebagai blok
 * sendiri supaya `## Judul` diikuti paragraf tidak ikut tertelan heading.
 */
function renderBlock(block) {
  const lines = block.split('\n');

  const heading = block.match(/^(#{1,6})[ \t]+([^\n]+)\n?([\s\S]*)$/);
  if (heading) {
    // Hanya <h2> dan <h3> yang punya gaya di .prose-osis, jadi dibatasi di sana.
    const level = Math.min(Math.max(heading[1].length, 2), 3);
    const rest = heading[3].trim();
    const tag = `h${level}`;
    const html = `<${tag}>${renderInline(heading[2].trim())}</${tag}>`;
    return rest ? `${html}\n${renderBlock(rest)}` : html;
  }

  if (lines.every((l) => /^\s*>\s?/.test(l))) {
    const inner = lines.map((l) => l.replace(/^\s*>\s?/, '')).join('\n');
    return `<blockquote>${renderInline(inner)}</blockquote>`;
  }

  if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
    const items = lines.map((l) => `<li>${renderInline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('');
    return `<ul>${items}</ul>`;
  }

  if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
    const items = lines.map((l) => `<li>${renderInline(l.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('');
    return `<ol>${items}</ol>`;
  }

  return `<p>${renderInline(block).replace(/\n/g, '<br />')}</p>`;
}

/**
 * Ubah Markdown berita menjadi HTML untuk ditampilkan.
 * @param {string} text isi berita
 * @returns {string} HTML yang aman untuk `dangerouslySetInnerHTML`
 */
export function renderMarkdown(text = '') {
  const source = String(text ?? '').replace(/\r\n/g, '\n').trim();
  if (!source) return '';
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(renderBlock)
    .join('\n');
}