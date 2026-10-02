import { useRef, useState } from 'react';
import { Bold, Code, Eye, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react';
import { renderMarkdown } from '../../lib/markdown';

const wrapSelection = (value, start, end, { before, after = before, placeholder }) => {
  const selected = value.slice(start, end);
  const inner = selected || placeholder;
  return {
    text: `${value.slice(0, start)}${before}${inner}${after}${value.slice(end)}`,
    caret: start + before.length + inner.length,
  };
};

const prefixLines = (value, start, end, prefix) => {
  const from = value.lastIndexOf('\n', start - 1) + 1;
  const block = value.slice(from, end) || 'Teks';
  const prefixed = block.replace(/^/gm, prefix);
  return { text: `${value.slice(0, from)}${prefixed}${value.slice(end)}`, caret: from + prefixed.length };
};

const TOOLS = [
  { key: 'bold', icon: Bold, title: 'Tebal (Ctrl+B)', run: (v, s, e) => wrapSelection(v, s, e, { before: '**', placeholder: 'tebal' }) },
  { key: 'italic', icon: Italic, title: 'Miring (Ctrl+I)', run: (v, s, e) => wrapSelection(v, s, e, { before: '*', placeholder: 'miring' }) },
  { key: 'code', icon: Code, title: 'Kode', run: (v, s, e) => wrapSelection(v, s, e, { before: '`', placeholder: 'kode' }) },
  { key: 'h2', icon: Heading2, title: 'Subjudul', run: (v, s, e) => prefixLines(v, s, e, '## ') },
  { key: 'h3', icon: Heading3, title: 'Sub-subjudul', run: (v, s, e) => prefixLines(v, s, e, '### ') },
  { key: 'ul', icon: List, title: 'Daftar poin', run: (v, s, e) => prefixLines(v, s, e, '- ') },
  { key: 'ol', icon: ListOrdered, title: 'Daftar nomor', run: (v, s, e) => prefixLines(v, s, e, '1. ') },
  { key: 'quote', icon: Quote, title: 'Kutipan', run: (v, s, e) => prefixLines(v, s, e, '> ') },
  {
    key: 'link',
    icon: Link2,
    title: 'Tautan',
    run: (v, s, e) => wrapSelection(v, s, e, { before: '[', after: '](https://)', placeholder: 'teks tautan' }),
  },
];

/**
 * Kolom isi berita: textarea dengan toolbar Markdown dan pratinjau langsung.
 * Penyimpanan tetap berupa Markdown, penampilannya dilakukan di sisi publik.
 */
export default function RichTextField({ value, onChange, required, rows = 12 }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(false);
  const text = value ?? '';

  const apply = (tool) => {
    const el = ref.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const { text: next, caret } = tool.run(text, start, end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  };

  const onKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    const tool = key === 'b' ? TOOLS[0] : key === 'i' ? TOOLS[1] : null;
    if (!tool) return;
    e.preventDefault();
    apply(tool);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.key}
              type="button"
              title={tool.title}
              aria-label={tool.title}
              onClick={() => apply(tool)}
              className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white hover:text-brand-700 hover:shadow-sm"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <button
          type="button"
          title={preview ? 'Kembali ke editor' : 'Lihat pratinjau'}
          onClick={() => setPreview((p) => !p)}
          className={`ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
            preview ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-white hover:text-brand-700'
          }`}
        >
          <Eye className="h-4 w-4" /> {preview ? 'Editor' : 'Pratinjau'}
        </button>
      </div>

      {preview ? (
        <div className="prose-osis min-h-40 px-4 py-3 text-base" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) || '<p class="text-slate-400">Belum ada isi.</p>' }} />
      ) : (
        <textarea
          ref={ref}
          className="w-full resize-y border-0 px-4 py-3 text-base focus:outline-none focus:ring-0"
          rows={rows}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          required={required}
          placeholder="Tulis isi berita. Format dengan toolbar di atas."
        />
      )}
    </div>
  );
}