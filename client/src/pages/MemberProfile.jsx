import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Quote } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getMember } from '../lib/data';
import { Avatar, Card, Empty, ErrorBox, InstagramIcon, PageHeader, Spinner } from '../components/ui';

/** Handle Instagram disimpan admin apa adanya, kadang dengan tanda @. */
const igHandle = (value = '') => value.trim().replace(/^@+/, '');

export default function MemberProfile() {
  const { id } = useParams();
  const { data: member, loading, error } = useQuery(() => getMember(id), [id]);

  useEffect(() => {
    if (member?.name) document.title = `${member.name} — OSIS SMA Negeri 3 Rembang`;
    return () => {
      document.title = 'OSIS SMA Negeri 3 Rembang 2026/2027';
    };
  }, [member]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  if (!member) {
    return (
      <>
        <PageHeader title="Profil Pengurus" desc="Data pengurus tidak ditemukan." />
        <section className="section-py bg-white">
          <div className="container-x text-center">
            <Empty icon="Users" title="Pengurus tidak ditemukan" desc="Anggota ini mungkin sudah tidak aktif." />
            <Link to="/struktur" className="btn-secondary mt-6">
              <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pengurus
            </Link>
          </div>
        </section>
      </>
    );
  }

  const instagram = igHandle(member.instagram);
  const kelasNama = (member.class_name ?? '').trim();

  return (
    <>
      <PageHeader
        eyebrow="Profil Pengurus"
        title={member.name}
        desc={member.position || undefined}
      />

      <section className="section-py bg-white">
        <div className="container-x">
          <Link
            to="/struktur"
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pengurus
          </Link>

          <Card className="mx-auto max-w-2xl p-8 text-center sm:p-10">
            <Avatar
              name={member.name}
              src={member.photo}
              className="mx-auto h-40 w-40 text-4xl ring-4 ring-gold-400"
            />

            <h2 className="mt-6 text-2xl font-extrabold text-ink-900">{member.name}</h2>

            {member.position && <p className="mt-1 font-semibold text-gold-600">{member.position}</p>}

            <div className="mt-5 flex flex-col items-center gap-2 text-sm text-ink-600">
              {kelasNama && (
                <p className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-ink-400" /> Kelas {kelasNama}
                </p>
              )}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-semibold text-rose-600 hover:underline"
                >
                  <InstagramIcon className="h-4 w-4" /> @{instagram}
                </a>
              )}
            </div>

            {member.quote && (
              <div className="mt-8 rounded-2xl bg-ink-50 px-6 py-6">
                <Quote className="mx-auto h-6 w-6 text-gold-500" />
                <p className="mt-3 text-base leading-relaxed text-ink-700 italic">“{member.quote}”</p>
              </div>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}