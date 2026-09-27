import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Layers, MapPin, MessageSquare, Quote, Target, Users, CheckCircle2 } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getHome, getSettings } from '../lib/data';
import { Avatar, ErrorBox, Progress, SectionTitle, Spinner } from '../components/ui';
import { dateParts, fmtTime } from '../lib/format';
import { PostCard } from './Posts';

export default function Home() {
  const { data, loading, error } = useQuery(async () => {
    const [home, settings] = await Promise.all([getHome(), getSettings()]);
    return { ...home, settings };
  });
  const s = data?.settings || {};

  return (
    <>
      {/* HERO */}
      <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-brand-950">
        <img src="/hero.jpg" alt="Siswa SMA Negeri 3 Rembang" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-900/30" />
        <div className="container-x fade-in py-32 text-white">
          <span className="badge mb-5 bg-gold-400/15 px-3 py-1 text-gold-300 ring-1 ring-gold-400/40">
            {s.cabinet_name || 'Kabinet'} · Periode {s.period || '2026/2027'}
          </span>
          <h1 className="max-w-3xl text-4xl leading-tight font-extrabold sm:text-6xl">
            OSIS <span className="text-gold-400">SMA Negeri 3</span> Rembang
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-100">{s.tagline || 'Bergerak Bersama, Berkarya untuk Smaga'}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/program" className="btn-gold px-6 py-3 text-base">
              Lihat Program Kerja <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/aspirasi" className="btn border border-white/30 px-6 py-3 text-base text-white hover:bg-white/10">
              <MessageSquare className="h-4 w-4" /> Kirim Aspirasi
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 -mt-16">
        <div className="container-x">
          <div className="card grid grid-cols-2 divide-slate-200 p-2 md:grid-cols-4 md:divide-x">
            {[
              { icon: Users, label: 'Pengurus', value: data?.stats.members },
              { icon: Layers, label: 'Seksi Bidang', value: data?.stats.divisions },
              { icon: Target, label: 'Program Kerja', value: data?.stats.programs },
              { icon: CheckCircle2, label: 'Aspirasi Ditindaklanjuti', value: data?.stats.aspirations_done },
            ].map((x) => (
              <div key={x.label} className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-700">
                  <x.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-brand-950">{x.value ?? '–'}</p>
                  <p className="text-xs text-slate-500">{x.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading && <Spinner />}
      {error && (
        <div className="container-x py-10">
          <ErrorBox message={error} />
        </div>
      )}

      {data && (
        <>
          {/* TENTANG + SAMBUTAN */}
          <section className="py-20">
            <div className="container-x grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-bold tracking-widest text-gold-500 uppercase">Tentang Kami</p>
                <h2 className="text-3xl font-extrabold text-brand-950 sm:text-4xl">Wadah Aspirasi & Kreasi Siswa Smaga</h2>
                <p className="mt-4 leading-relaxed text-slate-600">{s.about}</p>
                <div className="mt-6 rounded-2xl border-l-4 border-gold-400 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold tracking-wider text-brand-700 uppercase">Visi</p>
                  <p className="mt-1 text-slate-700">{s.vision}</p>
                </div>
                <Link to="/profil" className="btn-primary mt-6">
                  Selengkapnya <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-white shadow-xl">
                <Quote className="absolute top-6 right-6 h-14 w-14 text-white/10" />
                <p className="text-sm font-bold tracking-widest text-gold-400 uppercase">Sambutan Ketua OSIS</p>
                <p className="mt-4 leading-relaxed text-brand-100 italic">“{s.chairman_message}”</p>
                {data.core[0] && (
                  <div className="mt-6 flex items-center gap-4">
                    <Avatar name={data.core[0].name} src={data.core[0].photo} className="h-14 w-14 text-lg ring-2 ring-gold-400" />
                    <div>
                      <p className="font-bold">{data.core[0].name}</p>
                      <p className="text-sm text-brand-200">
                        {data.core[0].position} · Kelas {data.core[0].class_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* PROGRAM BERJALAN */}
          {data.programs.length > 0 && (
            <section className="bg-white py-20">
              <div className="container-x">
                <SectionTitle eyebrow="Program Kerja" title="Sedang Berjalan" desc="Program unggulan yang sedang dilaksanakan oleh pengurus OSIS." />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {data.programs.map((p) => (
                    <div key={p.id} className="card p-5 transition hover:-translate-y-1 hover:shadow-md">
                      <span className="badge bg-brand-50 text-brand-700">{p.division_short || 'Umum'}</span>
                      <h3 className="mt-3 font-bold text-slate-900">{p.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                        <span>Progres</span>
                        <span className="font-bold text-brand-700">{p.progress}%</span>
                      </div>
                      <div className="mt-1.5">
                        <Progress value={p.progress} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link to="/program" className="btn-outline">
                    Semua Program Kerja <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* BERITA + AGENDA */}
          <section className="py-20">
            <div className="container-x grid gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="mb-1 text-sm font-bold tracking-widest text-gold-500 uppercase">Kabar Smaga</p>
                    <h2 className="text-3xl font-extrabold text-brand-950">Berita Terbaru</h2>
                  </div>
                  <Link to="/berita" className="text-sm font-semibold text-brand-700 hover:underline">
                    Lihat semua →
                  </Link>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {data.posts.map((p, i) => (
                    <div key={p.id} className={i === 0 ? 'sm:col-span-2' : ''}>
                      <PostCard post={p} large={i === 0} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="mb-1 text-sm font-bold tracking-widest text-gold-500 uppercase">Jadwal</p>
                    <h2 className="text-3xl font-extrabold text-brand-950">Agenda</h2>
                  </div>
                  <Link to="/agenda" className="text-sm font-semibold text-brand-700 hover:underline">
                    Kalender →
                  </Link>
                </div>
                <div className="space-y-3">
                  {data.events.length === 0 && <p className="text-sm text-slate-500">Belum ada agenda mendatang.</p>}
                  {data.events.map((e) => {
                    const d = dateParts(e.date);
                    return (
                      <div key={e.id} className="card flex gap-4 p-4">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-700 text-white">
                          <span className="text-xl leading-none font-extrabold">{d.day}</span>
                          <span className="text-xs uppercase">{d.month}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{e.title}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" /> {fmtTime(e.time)} WIB
                          </p>
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5" /> {e.location || '-'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* CTA ASPIRASI */}
          <section className="pb-20">
            <div className="container-x">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-800 to-brand-950 px-8 py-12 text-white sm:px-12">
                <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-gold-400/20 blur-2xl" />
                <div className="relative grid items-center gap-6 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <h2 className="text-2xl font-extrabold sm:text-3xl">Punya ide, kritik, atau keluhan?</h2>
                    <p className="mt-2 text-brand-100">
                      Sampaikan lewat Kanal Aspirasi Digital — boleh anonim. Pantau tindak lanjutnya dengan kode tiket.
                    </p>
                  </div>
                  <div className="md:text-right">
                    <Link to="/aspirasi" className="btn-gold px-6 py-3 text-base">
                      <MessageSquare className="h-4 w-4" /> Sampaikan Sekarang
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}

