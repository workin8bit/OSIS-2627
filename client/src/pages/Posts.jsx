import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Eye, Newspaper, Search, User, ChevronRight, ArrowRight } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getPost, getPosts } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Spinner, Card, Badge, TabButton } from '../components/ui';
import { formatDate } from '../lib/format';

export function PostCard({ post, large = false, className = '' }) {
  return (
    <Link to={`/berita/${post.slug}`} className={`card-hover flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
      <div className={`relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 ${large ? 'aspect-[16/9]' : 'aspect-video'}`}>
        {post.cover ? (
          <img src={post.cover} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-12 w-12 text-white/30" />
          </div>
        )}
        <Badge variant="gold" className="absolute top-3 left-3">{post.category}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1 text-xs text-ink-500">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.created_at)}
        </p>
        <h3 className={`mt-2 font-bold text-ink-900 group-hover:text-brand-600 transition-colors line-clamp-2 ${large ? 'text-xl' : ''}`}>{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-600">{post.excerpt}</p>
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-ink-100">
          <span className="text-xs text-ink-500">Baca selengkapnya</span>
          <ArrowRight className="h-4 w-4 text-ink-400 group-hover:text-brand-600 transition-colors" />
        </div>
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

  return (
    <>
      <PageHeader 
        eyebrow="Kabar Smaga" 
        title="Berita & Kegiatan" 
        desc="Informasi terbaru seputar kegiatan OSIS dan SMA Negeri 3 Rembang." 
      />
      <section className="section-py bg-white">
        <div className="container-x">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {['', ...(data?.categories || [])].map((c) => (
                <TabButton
                  key={c || 'all'}
                  active={category === c}
                  onClick={() => update({ kategori: c })}
                >
                  {c || 'Semua'}
                </TabButton>
              ))}
            </div>
            <form
              className="relative w-full sm:w-80"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: search });
              }}
            >
              <Search className="absolute top-3.5 left-3.5 h-5 w-5 text-ink-400" />
              <input className="input pl-11" placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
          </div>
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && data.items.length === 0 && <Empty icon="Inbox" title="Belum ada berita" desc="Berita dan kegiatan akan segera dipublikasikan." />}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          {data && data.pages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <TabButton
                  key={n}
                  active={n === page}
                  onClick={() => update({ page: n })}
                  className="h-10 w-10 px-0"
                >
                  {n}
                </TabButton>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function PostDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useQuery(() => getPost(slug), [slug]);
  useEffect(() => {
    if (data?.title) document.title = `${data.title} — OSIS SMAN 3 Rembang`;
    return () => {
      document.title = 'OSIS SMA Negeri 3 Rembang 2026/2027';
    };
  }, [data]);

  return (
    <>
      <div className="bg-brand-950 pt-20" />
      <article className="section-py bg-white">
        <div className="container-x max-w-3xl">
          <Link to="/berita" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Kembali ke berita
          </Link>
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && (
            <div className="slide-up">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="gold">{data.category}</Badge>
                {data.author && <Badge variant="primary">{data.author}</Badge>}
              </div>
              <h1 className="text-3xl leading-tight font-extrabold text-ink-950 sm:text-4xl">{data.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> {formatDate(data.created_at, { withDay: true })}
                </span>
                {data.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" /> {data.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> {data.views + 1}x dibaca
                </span>
              </div>
              {data.cover && (
                <img src={data.cover} alt={data.title} className="mt-8 w-full rounded-2xl object-cover shadow-lg" />
              )}
              <div className="prose-osis mt-8 text-lg">
                {(data.content || '').split(/\n\s*\n/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
              {data.related?.length > 0 && (
                <div className="mt-14 border-t border-ink-200 pt-8">
                  <h2 className="mb-5 text-xl font-bold text-ink-900">Berita Lainnya</h2>
                  <div className="grid gap-5 sm:grid-cols-3">
                    {data.related.map((r) => (
                      <PostCard key={r.id} post={{ ...r, category: 'Berita' }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </>
  );
}