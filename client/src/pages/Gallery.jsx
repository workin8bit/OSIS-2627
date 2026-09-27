import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useFetch } from '../lib/context';
import { Empty, ErrorBox, PageHeader, Spinner } from '../components/ui';

export default function Gallery() {
  const { data, loading, error } = useFetch('/gallery');
  const [album, setAlbum] = useState('');
  const [idx, setIdx] = useState(null);
  const albums = [...new Set((data || []).map((g) => g.album))];
  const items = (data || []).filter((g) => !album || g.album === album);

  useEffect(() => {
    if (idx === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIdx(null);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx, items.length]);

  return (
    <>
      <PageHeader eyebrow="Dokumentasi" title="Galeri Kegiatan" desc="Momen-momen kebersamaan dan kegiatan OSIS SMA Negeri 3 Rembang." />
      <section className="py-16">
        <div className="container-x">
          {albums.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {['', ...albums].map((a) => (
                <button
                  key={a || 'all'}
                  onClick={() => setAlbum(a)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${album === a ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-200'}`}
                >
                  {a || 'Semua'}
                </button>
              ))}
            </div>
          )}
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && items.length === 0 && <Empty icon="Camera" title="Galeri masih kosong" desc="Foto kegiatan akan segera diunggah oleh pengurus." />}
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {items.map((g, i) => (
              <button key={g.id} onClick={() => setIdx(i)} className="group relative mb-4 block w-full overflow-hidden rounded-2xl break-inside-avoid">
                <img src={g.image} alt={g.title} className="w-full transition duration-500 group-hover:scale-105" loading="lazy" />
                {g.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3 text-left text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                    {g.title}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {idx !== null && items[idx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setIdx(null)}>
          <button className="absolute top-4 right-4 p-2 text-white" aria-label="Tutup">
            <X className="h-7 w-7" />
          </button>
          <button className="absolute left-2 p-2 text-white sm:left-6" onClick={(e) => (e.stopPropagation(), setIdx((idx - 1 + items.length) % items.length))} aria-label="Sebelumnya">
            <ChevronLeft className="h-9 w-9" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={items[idx].image} alt={items[idx].title} className="max-h-[80vh] rounded-xl object-contain" />
            {items[idx].title && <figcaption className="mt-3 text-center text-white">{items[idx].title}</figcaption>}
          </figure>
          <button className="absolute right-2 p-2 text-white sm:right-6" onClick={(e) => (e.stopPropagation(), setIdx((idx + 1) % items.length))} aria-label="Berikutnya">
            <ChevronRight className="h-9 w-9" />
          </button>
        </div>
      )}
    </>
  );
}
