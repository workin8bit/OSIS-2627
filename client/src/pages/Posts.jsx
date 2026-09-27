import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Eye, Newspaper, Search, User } from 'lucide-react';
import { useFetch } from '../lib/context';
import { Empty, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { formatDate } from '../lib/format';

export function PostCard({ post, large = false }) {
  return (
    <Link to={`/berita/${post.slug}`} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`relative overflow-hidden bg-gradient-to-br from-brand-700 to-brand-950 ${large ? 'aspect-[21/9]' : 'aspect-video'}`}>
        {post.cover ? (
          <img src={post.cover} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-12 w-12 text-white/30" />
          </div>
        )}
        <span className="badge absolute top-3 left-3 bg-gold-400 text-brand-950">{post.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.created_at)}
        </p>
        <h3 className={`mt-2 font-bold text-slate-900 group-hover:text-brand-700 ${large ? 'text-xl' : ''}`}>{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
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
  const { data, loading, error } = useFetch(`/posts?page=${page}&category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`);

  const update = (patch) => {
    const next = { page: 1, kategori: category, q, ...patch };
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v && v !== 1));
    setParams(clean);
  };

  return (
    <>
      <PageHeader eyebrow="Kabar Smaga" title="Berita & Kegiatan" desc="Informasi terbaru seputar kegiatan OSIS dan SMA Negeri 3 Rembang." />
      <section className="py-16">
        <div className="container-x">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {['', ...(data?.categories || [])].map((c) => (
                <button
                  key={c || 'all'}
                  onClick={() => update({ kategori: c })}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${category === c ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                >
                  {c || 'Semua'}
                </button>
              ))}
            </div>
            <form
              className="relative lg:w-80"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q: search });
              }}
            >
              <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <input className="input pl-9" placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
          </div>
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && data.items.length === 0 && <Empty icon="Inbox" title="Belum ada berita" />}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          {data && data.pages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => update({ page: n })} className={`h-10 w-10 rounded-xl text-sm font-semibold ${n === page ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
                  {n}
                </button>
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
  const { data, loading, error } = useFetch(`/posts/${slug}`);
  useEffect(() => {
    if (data?.title) document.title = `${data.title} — OSIS SMAN 3 Rembang`;
    return () => {
      document.title = 'OSIS SMA Negeri 3 Rembang 2026/2027';
    };
  }, [data]);

  return (
    <>
      <div className="bg-brand-950 pt-20" />
      <article className="py-12">
        <div className="container-x max-w-3xl">
          <Link to="/berita" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Kembali ke berita
          </Link>
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && (
            <div className="fade-in">
              <span className="badge bg-gold-400 text-brand-950">{data.category}</span>
              <h1 className="mt-3 text-3xl leading-tight font-extrabold text-brand-950 sm:text-4xl">{data.title}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
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
              {data.cover && <img src={data.cover} alt={data.title} className="mt-8 w-full rounded-2xl object-cover" />}
              <div className="prose-osis mt-8 text-[17px]">
                {(data.content || '').split(/\n\s*\n/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
              {data.related?.length > 0 && (
                <div className="mt-14 border-t border-slate-200 pt-8">
                  <h2 className="mb-5 text-xl font-bold text-brand-950">Berita Lainnya</h2>
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
