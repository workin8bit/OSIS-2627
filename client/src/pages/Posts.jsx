import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Newspaper, Search, Share2, User } from 'lucide-react';
import { useQuery, useToast } from '../lib/context';
import { getPost, getPosts } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Skeleton } from '../components/ui';
import { formatDate, relativeTime } from '../lib/format';

function Cover({ post, className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-ink-900 ${className}`}>
      {post.cover ? (
        <img src={post.cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Newspaper className="h-1/3 max-h-12 w-1/3 max-w-12 text-sun-400/70" />
        </div>
      )}
    </div>
  );
}

/** Kartu berita dengan gambar di atas. `large` = sorotan utama. */
export function PostCard({ post, large = false }) {
  return (
    <Link to={`/berita/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-200/70 bg-white transition active:scale-[.98]">
      <div className="relative">
        <Cover post={post} className={large ? 'aspect-[16/10]' : 'aspect-video'} />
        {post.category && <span className="badge absolute top-3 left-3 bg-sun-400 text-ink-950">{post.category}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-semibold text-ink-500">{formatDate(post.created_at)}</p>
        <h3 className={`mt-1.5 leading-snug font-extrabold tracking-tight text-ink-950 group-hover:underline group-hover:decoration-sun-400 group-hover:decoration-4 group-hover:underline-offset-4 ${large ? 'text-xl sm:text-2xl' : 'text-base'}`}>
          {post.title}
        </h3>
        {post.excerpt && <p className={`mt-2 text-sm leading-relaxed text-ink-600 ${large ? 'line-clamp-3' : 'line-clamp-2'}`}>{post.excerpt}</p>}
      </div>
    </Link>
  );
}

/** Baris berita ringkas (thumbnail kiri) — pola daftar yang padat untuk HP. */
export function PostRow({ post }) {
  return (
    <Link to={`/berita/${post.slug}`} className="group flex items-center gap-3.5 py-3.5 transition active:opacity-70">
      <Cover post={post} className="h-[72px] w-[88px] shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-wide text-ink-500 uppercase">
          {post.category ? `${post.category} · ` : ''}
          {relativeTime(post.created_at)}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] leading-snug font-bold text-ink-950 group-hover:underline group-hover:decoration-sun-400 group-hover:decoration-2">{post.title}</h3>
      </div>
    </Link>
  );
}

export function PostList() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const category = params.get('kategori') || '';
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const { data, loading, error } = useQuery(() => getPosts({ page, category, q }), [page, category, q]);

  const update = (patch) => {
    const next = { page: 1, kategori: category, q, ...patch };
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v && v !== 1));
    setParams(clean);
  };

  const [first, ...rest] = data?.items || [];
  const featured = page === 1 && !q && first;

  return (
    <>
      <PageHeader eyebrow="Kabar Smaga" title="Berita &" highlight="Kegiatan" desc="Informasi terbaru seputar kegiatan OSIS dan SMA Negeri 3 Rembang." />
      <section className="container-x">
        <form
          className="relative"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search.trim() });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-400" />
          <input className="input rounded-full pr-4 pl-12" type="search" placeholder="Cari berita…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari berita" />
        </form>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {['', ...(data?.categories || [])].map((c) => (
            <button key={c || 'all'} onClick={() => update({ kategori: c })} className={`chip ${category === c ? 'chip-active' : ''}`} aria-pressed={category === c}>
              {c || 'Semua'}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="aspect-[4/3]" />
              <Skeleton className="hidden aspect-[4/3] sm:block" />
              <Skeleton className="hidden aspect-[4/3] lg:block" />
            </div>
          )}
          {error && <ErrorBox message={error} />}
          {data && data.items.length === 0 && <Empty icon="Inbox" title={q ? `Tidak ada hasil untuk “${q}”` : 'Belum ada berita'} />}
          {data && data.items.length > 0 && (
            <div className="fade-in grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <PostCard post={first} large />
                </div>
              )}
              {/* HP: daftar baris; tablet ke atas: kartu */}
              <div className="divide-y divide-ink-200/70 rounded-3xl border border-ink-200/70 bg-white px-4 sm:hidden">
                {(featured ? rest : data.items).map((p) => (
                  <PostRow key={p.id} post={p} />
                ))}
              </div>
              {(featured ? rest : data.items).map((p) => (
                <div key={p.id} className="hidden sm:block">
                  <PostCard post={p} />
                </div>
              ))}
            </div>
          )}
          {data && data.pages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Halaman">
              <button className="btn-icon border border-ink-200 bg-white" disabled={page <= 1} onClick={() => update({ page: page - 1 })} aria-label="Sebelumnya">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-3 text-sm font-bold text-ink-700">
                {page} / {data.pages}
              </span>
              <button className="btn-icon border border-ink-200 bg-white" disabled={page >= data.pages} onClick={() => update({ page: page + 1 })} aria-label="Berikutnya">
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </>
  );
}

export function PostDetail() {
  const { slug } = useParams();
  const toast = useToast();
  const { data, loading, error } = useQuery(() => getPost(slug), [slug]);
  useEffect(() => {
    if (data?.title) document.title = `${data.title} — OSIS SMAN 3 Rembang`;
    return () => {
      document.title = 'OSIS SMA Negeri 3 Rembang 2026/2027';
    };
  }, [data]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: data.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Tautan disalin');
      }
    } catch {
      /* dibatalkan pengguna */
    }
  };

  return (
    <article className="container-x max-w-3xl pt-3 sm:pt-8">
      <div className="mb-5 flex items-center justify-between">
        <Link to="/berita" className="btn-ghost -ml-3 px-3">
          <ArrowLeft className="h-4 w-4" /> Berita
        </Link>
        {data && (
          <button onClick={share} className="btn-icon text-ink-700 hover:bg-ink-100" aria-label="Bagikan">
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-20" />
          <Skeleton className="aspect-video" />
        </div>
      )}
      {error && <ErrorBox message={error} />}
      {data && (
        <div className="fade-in">
          <span className="badge bg-sun-400 text-ink-950">{data.category}</span>
          <h1 className="mt-3 text-[1.85rem] leading-[1.15] font-extrabold tracking-tight text-ink-950 sm:text-5xl">{data.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500">
            <span>{formatDate(data.created_at, { withDay: true })}</span>
            {data.author && (
              <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4" /> {data.author}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" /> {data.views + 1}× dibaca
            </span>
          </div>
          {data.cover && <img src={data.cover} alt={data.title} className="-mx-4 mt-6 w-[calc(100%+2rem)] max-w-none object-cover sm:mx-0 sm:w-full sm:rounded-4xl" />}
          <div className="prose-osis mt-7 text-[17px]">
            {(data.content || '').split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
          {data.related?.length > 0 && (
            <div className="mt-12 border-t border-ink-200 pt-8">
              <h2 className="mb-2 text-xl font-extrabold text-ink-950">Berita lainnya</h2>
              <div className="divide-y divide-ink-200/70">
                {data.related.map((r) => (
                  <PostRow key={r.id} post={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
