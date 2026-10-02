import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Quote,
  Target,
  Users,
} from 'lucide-react';
import { useQuery } from '../lib/context';
import { getMemberDetail } from '../lib/data';
import { Avatar, Badge, Card, Empty, ErrorBox, Icon, InstagramIcon, PageHeader, Spinner } from '../components/ui';
import { formatDate } from '../lib/format';

export default function MemberProfile() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(() => getMemberDetail(id), [id]);

  useEffect(() => {
    if (data?.member?.name) document.title = `${data.member.name} — OSIS SMAN 3 Rembang`;
    return () => {
      document.title = 'OSIS SMA Negeri 3 Rembang 2026/2027';
    };
  }, [data]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  if (!data?.member) {
    return (
      <>
        <div className="bg-brand-950 pt-20" />
        <section className="section-py bg-white">
          <div className="container-x">
            <Empty icon="Users" title="Pengurus tidak ditemukan" desc="Anggota ini mungkin sudah tidak aktif." />
            <Link to="/struktur" className="btn-secondary mt-6">
              <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pengurus
            </Link>
          </div>
        </section>
      </>
    );
  }

  const { member, division, programs, colleagues } = data;
  const isCore = Boolean(member.is_core);

  return (
    <>
      <PageHeader
        eyebrow={division ? division.short : 'Pengurus Inti'}
        title={member.name}
        desc={`${member.position}${member.class_name ? ` · Kelas ${member.class_name}` : ''}`}
      />

      <section className="section-py bg-white">
        <div className="container-x">
          <Link to="/struktur" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pengurus
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="p-6 text-center lg:col-span-1">
              <Avatar
                name={member.name}
                src={member.photo}
                className="mx-auto h-32 w-32 text-3xl ring-4 ring-gold-400"
              />
              <h2 className="mt-5 text-xl font-extrabold text-ink-900">{member.name}</h2>
              <p className="mt-1 font-semibold text-gold-600">{member.position}</p>
              {member.class_name && (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-ink-500">
                  <GraduationCap className="h-4 w-4" /> Kelas {member.class_name}
                </p>
              )}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {division ? (
                  <Badge variant="gold">
                    <Icon name={division.icon} className="h-3.5 w-3.5" /> {division.short}
                  </Badge>
                ) : (
                  <Badge variant="primary">Pengurus Inti</Badge>
                )}
                {member.instagram && (
                  <a
                    href={`https://instagram.com/${member.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Badge variant="info">
                      <InstagramIcon className="h-3.5 w-3.5" /> Instagram
                    </Badge>
                  </a>
                )}
              </div>

              {member.quote && (
                <div className="mt-6 rounded-xl bg-ink-50 p-4 text-left">
                  <Quote className="h-5 w-5 text-gold-500" />
                  <p className="mt-2 text-sm leading-relaxed text-ink-700 italic">“{member.quote}”</p>
                </div>
              )}
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {division && (
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-gold-600">
                    <Target className="h-5 w-5" />
                    <h3 className="font-bold text-ink-900">Tugas Seksi Bidang</h3>
                  </div>
                  <p className="font-bold text-ink-800">{division.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{division.description}</p>
                </Card>
              )}

              {isCore && (
                <Card className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-gold-600">
                    <Users className="h-5 w-5" />
                    <h3 className="font-bold text-ink-900">Peran dalam Kepengurusan</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-600">
                    {member.name} menjalankan tugas sebagai <strong className="text-ink-900">{member.position}</strong> dalam
                    kepengurusan OSIS periode ini, berada di puncak struktur pengurus inti.
                  </p>
                </Card>
              )}

              {programs.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="border-b border-ink-200 px-6 py-4">
                    <h3 className="flex items-center gap-2 font-bold text-ink-900">
                      <CalendarDays className="h-5 w-5 text-gold-600" /> Program {division?.short}
                    </h3>
                  </div>
                  <ul className="divide-y divide-ink-100">
                    {programs.map((p) => (
                      <li key={p.id} className="px-6 py-4">
                        <p className="font-semibold text-ink-900">{p.title}</p>
                        <p className="mt-0.5 text-sm text-ink-600">{p.description}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(p.start_date)}
                          {p.end_date && p.end_date !== p.start_date ? ` – ${formatDate(p.end_date)}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-ink-100 px-6 py-3">
                    <Link to="/program" className="text-sm font-semibold text-brand-600 hover:underline">
                      Lihat semua program kerja <ArrowRight className="inline h-4 w-4" />
                    </Link>
                  </div>
                </Card>
              )}

              {colleagues.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="border-b border-ink-200 px-6 py-4">
                    <h3 className="flex items-center gap-2 font-bold text-ink-900">
                      <Users className="h-5 w-5 text-gold-600" /> Rekan seksi {division?.short}
                    </h3>
                  </div>
                  <ul className="divide-y divide-ink-100">
                    {colleagues.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/pengurus/${c.id}`}
                          className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-ink-50"
                        >
                          <Avatar name={c.name} src={c.photo} className="h-10 w-10 text-sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-ink-900">{c.name}</p>
                            <p className="text-xs text-gold-600">
                              {c.position}
                              {c.class_name ? ` · Kelas ${c.class_name}` : ''}
                            </p>
                          </div>
                          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-300" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}