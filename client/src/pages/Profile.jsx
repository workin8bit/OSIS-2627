import { Eye, Mail, MapPin, Phone, Quote, Target, ArrowRight } from 'lucide-react';
import { useSettings, useQuery } from '../lib/context';
import { getStructure } from '../lib/data';
import { Avatar, Icon, PageHeader, SectionTitle, Card, Badge } from '../components/ui';

export default function Profile() {
  const { settings: s } = useSettings();
  const { data: structure } = useQuery(getStructure);
  const divisions = structure?.divisions;
  const chair = structure?.core?.[0];

  return (
    <>
      <PageHeader 
        eyebrow="Profil Organisasi" 
        title={s.org_name} 
        desc={`${s.cabinet_name || ''} · Periode ${s.period || ''}`} 
      />

      <section className="section-py bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 sm:p-8">
              <div className="mb-4 flex items-center gap-2 text-brand-600">
                <Eye className="h-5 w-5" /> <h3 className="font-bold text-ink-900">Tentang OSIS</h3>
              </div>
              <p className="leading-relaxed text-ink-600">{s.about}</p>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center gap-2 text-brand-600">
                  <Target className="h-5 w-5" /> <h3 className="font-bold text-ink-900">Visi</h3>
                </div>
                <p className="text-justify leading-relaxed font-medium text-ink-800">{s.vision}</p>
              </Card>
              <Card className="p-6 md:col-span-2">
                <div className="mb-4 flex items-center gap-2 text-brand-600">
                  <Target className="h-5 w-5" /> <h3 className="font-bold text-ink-900">Misi</h3>
                </div>
                <ol className="space-y-4">
                  {(s.missions || []).map((m, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{i + 1}</span>
                      <span className="text-ink-700 leading-relaxed">{m}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
              <Quote className="absolute top-4 right-4 h-12 w-12 text-white/10" />
              <p className="text-xs font-bold tracking-widest text-gold-300 uppercase">Sambutan Ketua</p>
              <p className="mt-3 text-justify text-sm leading-relaxed text-pretty text-ink-100">“{s.chairman_message}”</p>
              {chair && (
                <div className="mt-5 flex items-center gap-3">
                  <Avatar name={chair.name} src={chair.photo} className="h-12 w-12 text-base ring-2 ring-gold-400" />
                  <div>
                    <p className="font-bold">{chair.name}</p>
                    <p className="text-xs text-ink-200">{chair.position}</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="space-y-4 p-6">
              <p className="font-bold text-ink-900">Sekretariat</p>
              <div className="space-y-3 text-sm">
                <p className="flex gap-2 text-ink-600">
                  <MapPin className="h-4 w-4 shrink-0 text-brand-600" /> {s.address}
                </p>
                {s.phone && (
                  <p className="flex gap-2 text-ink-600">
                    <Phone className="h-4 w-4 shrink-0 text-brand-600" /> {s.phone}
                  </p>
                )}
                {s.email && (
                  <p className="flex gap-2 text-ink-600">
                    <Mail className="h-4 w-4 shrink-0 text-brand-600" /> {s.email}
                  </p>
                )}
              </div>
            </Card>

            {s.instagram && (
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 p-3 text-white">
                  <InstagramIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium text-ink-900">Instagram OSIS</p>
                  <p className="text-sm text-ink-500">@{s.instagram}</p>
                </div>
                <ArrowRight className="ml-auto h-5 w-5 text-ink-400" />
              </a>
            )}
          </aside>
        </div>
      </section>

      <section className="section-py bg-ink-50">
        <div className="container-x">
          <SectionTitle 
            eyebrow="Seksi Bidang" 
            title="10 Sekbid OSIS" 
            desc="Setiap seksi bidang memiliki fokus pembinaan sesuai Permendiknas No. 39 Tahun 2008 tentang Pembinaan Kesiswaan." 
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {(divisions || []).map((d) => (
              <Card key={d.id} className="p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 inline-flex rounded-xl bg-brand-100 p-3 text-brand-700">
                  <Icon name={d.icon} className="h-6 w-6" />
                </div>
                <Badge variant="gold" className="mb-2">{d.short}</Badge>
                <h3 className="text-sm font-bold text-ink-900">{d.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">{d.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {s.maps_embed && (
        <section className="section-py bg-white">
          <div className="container-x">
            <SectionTitle eyebrow="Lokasi" title="Temukan Kami" />
            <div className="overflow-hidden rounded-2xl border border-ink-200 shadow-sm">
              <iframe 
                title="Peta lokasi SMA Negeri 3 Rembang" 
                src={s.maps_embed} 
                className="h-96 w-full" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade" 
              />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function InstagramIcon({ className = 'h-5 w-5', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}