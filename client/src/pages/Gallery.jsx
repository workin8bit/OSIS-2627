import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getGallery } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Skeleton } from '../components/ui';

export default function Gallery() {
  const { data, loading, error } = useQuery(getGallery);
  const [album, setAlbum] = useState('');
  const [idx, setIdx] = useState(null);
  const touchX = useRef(null);
  const albums = [...new Set((data || []).map((g) => g.album).filter(Boolean))];
  const items = (data || []).filter((g) => !album || g.album === album);

  const next = () => setIdx((i) => (i + 1) % items.length);
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIdx(null);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [idx, items.length]);

  return (
    <>
      <PageHeader eyebrow="Dokumentasi" title="Galeri" highlight="kegiatan" desc="Momen kebersamaan dan kegiatan OSIS SMA Negeri 3 Rembang." />
      <section className="container-x">
        {albums.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {['', ...albums].map((a) => (
              <button key={a || 'all'} onClick={() => setAlbum(a)} className={`chip ${album === a ? 'chip-active' : ''}`} aria-pressed={album === a}>
                {a || 'Semua'}
              </button>
            ))}
          </div>
        )}
        {loading && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        )}
        {error && <ErrorBox message={error} />}
        {data && items.length === 0 && <Empty icon="Camera" title="Galeri masih kosong" desc="Foto kegiatan akan segera diunggah oleh pengurus." />}
        <div className="columns-2 gap-2 sm:gap-3 md:columns-3 lg:columns-4">
          {items.map((g, i) => (
            <button key={g.id} onClick={() => setIdx(i)} className="group relative mb-2 block w-full overflow-hidden rounded-2xl break-inside-avoid sm:mb-3 sm:rounded-3xl" aria-label={g.title || 'Buka foto'}>
              <img src={g.image} alt={g.title || ''} className="w-full transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
              {g.title && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-2.5 pt-8 text-left text-xs font-semibold text-white sm:text-sm sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                  {g.title}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {idx !== null && items[idx] && (
        <div
          className="fade-in fixed inset-0 z-[60] flex flex-col bg-ink-950"
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
            touchX.current = null;
          }}
        >
          <div className="flex items-center justify-between p-3 text-white">
            <span className="px-2 text-sm font-bold text-ink-400 tabular-nums">
              {idx + 1} / {items.length}
            </span>
            <button className="btn-icon bg-white/10 hover:bg-white/20" onClick={() => setIdx(null)} aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20">
            <img src={items[idx].image} alt={items[idx].title || ''} className="max-h-full max-w-full rounded-2xl object-contain" />
            {items.length > 1 && (
              <>
                <button className="btn-icon absolute left-4 hidden bg-white/10 text-white hover:bg-white/20 sm:inline-flex" onClick={prev} aria-label="Sebelumnya">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button className="btn-icon absolute right-4 hidden bg-white/10 text-white hover:bg-white/20 sm:inline-flex" onClick={next} aria-label="Berikutnya">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <div className="safe-bottom p-4 text-center">
            {items[idx].title && <p className="font-semibold text-white">{items[idx].title}</p>}
            {items[idx].album && <p className="mt-0.5 text-xs text-ink-400">{items[idx].album}</p>}
            {items.length > 1 && <p className="mt-2 text-[11px] text-ink-500 sm:hidden">Geser untuk foto lain</p>}
          </div>
        </div>
      )}
    </>
  );
}
