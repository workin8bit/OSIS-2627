import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Grid, Camera, Expand } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getGallery } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Spinner, Card, TabButton } from '../components/ui';

export default function Gallery() {
  const { data, loading, error } = useQuery(getGallery);
  const [album, setAlbum] = useState('');
  const [idx, setIdx] = useState(null);
  const [view, setView] = useState('masonry'); // 'masonry' | 'grid'
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
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [idx, items.length]);

  return (
    <>
      <PageHeader 
        eyebrow="Dokumentasi" 
        title="Galeri Kegiatan" 
        desc="Momen-momen kebersamaan dan kegiatan OSIS SMA Negeri 3 Rembang." 
      />
      <section className="section-py bg-white">
        <div className="container-x">
          {albums.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {['', ...albums].map((a) => (
                <TabButton
                  key={a || 'all'}
                  active={album === a}
                  onClick={() => setAlbum(a)}
                >
                  {a || 'Semua'}
                </TabButton>
              ))}
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-2">
              <TabButton
                active={view === 'grid'}
                onClick={() => setView('grid')}
                aria-label="Tampilan grid"
              >
                <Grid className="h-4 w-4" />
              </TabButton>
              <TabButton
                active={view === 'masonry'}
                onClick={() => setView('masonry')}
                aria-label="Tampilan masonry"
              >
                <Camera className="h-4 w-4" />
              </TabButton>
            </div>
            <div className="text-sm text-ink-500">{items.length} foto</div>
          </div>

          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && items.length === 0 && (
            <Empty icon="Camera" title="Galeri masih kosong" desc="Foto kegiatan akan segera diunggah oleh pengurus." />
          )}

          {view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((g, i) => (
                <button key={g.id} onClick={() => setIdx(i)} className="group relative aspect-square overflow-hidden rounded-2xl break-inside-avoid">
                  <img src={g.image} alt={g.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  {g.title && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="text-sm font-medium text-white truncate">{g.title}</p>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-full bg-white/90 p-1.5 text-ink-600 hover:bg-white" aria-label="Lihat fullscreen">
                      <Expand className="h-4 w-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
              {items.map((g, i) => (
                <button key={g.id} onClick={() => setIdx(i)} className="group relative mb-4 block w-full overflow-hidden rounded-2xl break-inside-avoid">
                  <img src={g.image} alt={g.title} className="w-full transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  {g.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3 text-left text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {g.title}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {idx !== null && items[idx] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setIdx(null)}>
          <button className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors" aria-label="Tutup">
            <X className="h-7 w-7" />
          </button>
          <button className="absolute left-4 p-2 text-white sm:left-6" onClick={(e) => (e.stopPropagation(), setIdx((idx - 1 + items.length) % items.length))} aria-label="Sebelumnya">
            <ChevronLeft className="h-10 w-10" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={items[idx].image} alt={items[idx].title} className="max-h-[80vh] rounded-xl object-contain" />
            {items[idx].title && <figcaption className="mt-3 text-center text-white">{items[idx].title}</figcaption>}
            {items[idx].album && <p className="mt-1 text-center text-ink-400 text-sm">{items[idx].album}</p>}
          </figure>
          <button className="absolute right-4 p-2 text-white sm:right-6" onClick={(e) => (e.stopPropagation(), setIdx((idx + 1) % items.length))} aria-label="Berikutnya">
            <ChevronRight className="h-10 w-10" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 text-white/60 text-sm">
            {idx + 1} / {items.length}
          </div>
        </div>
      )}
    </>
  );
}