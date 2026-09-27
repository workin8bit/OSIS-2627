import { Eye, Mail, MapPin, Phone, Quote, Target } from 'lucide-react';
import { useSettings, useFetch } from '../lib/context';
import { Avatar, Icon, PageHeader, SectionTitle } from '../components/ui';

export default function Profile() {
  const { settings: s } = useSettings();
  const { data: divisions } = useFetch('/divisions');
  const { data: structure } = useFetch('/structure');
  const chair = structure?.core?.[0];

  return (
    <>
      <PageHeader eyebrow="Profil Organisasi" title={s.org_name} desc={`${s.cabinet_name || ''} · Periode ${s.period || ''}`} />

      <section className="py-16">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-extrabold text-brand-950">Tentang OSIS</h2>
            <p className="mt-3 leading-relaxed text-slate-600">{s.about}</p>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="card p-6 md:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-brand-700">
                  <Eye className="h-5 w-5" /> <h3 className="font-bold">Visi</h3>
                </div>
                <p className="text-lg leading-relaxed font-medium text-slate-800">{s.vision}</p>
              </div>
              <div className="card p-6 md:col-span-2">
                <div className="mb-4 flex items-center gap-2 text-brand-700">
                  <Target className="h-5 w-5" /> <h3 className="font-bold">Misi</h3>
                </div>
                <ol className="space-y-3">
                  {(s.missions || []).map((m, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400 text-sm font-bold text-brand-950">{i + 1}</span>
                      <span className="text-slate-700">{m}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <aside className="space-y-5">
            <div className="relative rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white">
              <Quote className="absolute top-4 right-4 h-10 w-10 text-white/10" />
              <p className="text-xs font-bold tracking-widest text-gold-400 uppercase">Sambutan Ketua</p>
              <p className="mt-3 text-sm leading-relaxed text-brand-100 italic">“{s.chairman_message}”</p>
              {chair && (
                <div className="mt-5 flex items-center gap-3">
                  <Avatar name={chair.name} src={chair.photo} className="h-12 w-12 text-base ring-2 ring-gold-400" />
                  <div>
                    <p className="font-bold">{chair.name}</p>
                    <p className="text-xs text-brand-200">{chair.position}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="card space-y-3 p-6 text-sm">
              <p className="font-bold text-slate-900">Sekretariat</p>
              <p className="flex gap-2 text-slate-600">
                <MapPin className="h-4 w-4 shrink-0 text-brand-700" /> {s.address}
              </p>
              {s.phone && (
                <p className="flex gap-2 text-slate-600">
                  <Phone className="h-4 w-4 shrink-0 text-brand-700" /> {s.phone}
                </p>
              )}
              {s.email && (
                <p className="flex gap-2 text-slate-600">
                  <Mail className="h-4 w-4 shrink-0 text-brand-700" /> {s.email}
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x">
          <SectionTitle eyebrow="Seksi Bidang" title="10 Sekbid OSIS" desc="Setiap seksi bidang memiliki fokus pembinaan sesuai Permendiknas No. 39 Tahun 2008 tentang Pembinaan Kesiswaan." />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {(divisions || []).map((d) => (
              <div key={d.id} className="card p-5 transition hover:-translate-y-1 hover:shadow-md">
                <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-3 text-brand-700">
                  <Icon name={d.icon} className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-gold-500">{d.short}</p>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{d.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {s.maps_embed && (
        <section className="py-16">
          <div className="container-x">
            <SectionTitle eyebrow="Lokasi" title="Temukan Kami" />
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <iframe title="Peta lokasi" src={s.maps_embed} className="h-96 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

