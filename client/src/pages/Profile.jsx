import { Mail, MapPin, Phone, Quote } from 'lucide-react';
import { useSettings, useQuery } from '../lib/context';
import { getStructure } from '../lib/data';
import { Avatar, Icon, PageHeader, SectionTitle, Skeleton } from '../components/ui';

export default function Profile() {
  const { settings: s } = useSettings();
  const { data: structure, loading } = useQuery(getStructure);
  const divisions = structure?.divisions;
  const chair = structure?.core?.[0];

  return (
    <div className="space-y-12 sm:space-y-16">
      <div>
        <PageHeader eyebrow="Profil organisasi" title={s.org_name} desc={`${s.cabinet_name ? `${s.cabinet_name} · ` : ''}Periode ${s.period || ''}`} />
        <section className="container-x grid gap-3 lg:grid-cols-3">
          {/* Tentang */}
          <div className="card p-5 sm:p-7 lg:col-span-2">
            <p className="eyebrow">Tentang OSIS</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-700 sm:text-base">{s.about}</p>
          </div>
          {/* Visi */}
          <div className="rounded-3xl bg-sun-400 p-5 text-ink-950 sm:p-7">
            <p className="text-xs font-extrabold tracking-[.14em] text-ink-800 uppercase">Visi</p>
            <p className="mt-3 text-xl leading-snug font-extrabold tracking-tight sm:text-2xl">{s.vision}</p>
          </div>
        </section>
      </div>

      {/* Misi */}
      <section className="container-x">
        <SectionTitle eyebrow="Langkah kami" title="Misi" />
        <ol className="grid gap-3 md:grid-cols-2">
          {(s.missions || []).map((m, i) => (
            <li key={i} className="flex gap-4 rounded-3xl border border-ink-200/70 bg-white p-4 sm:p-5">
              <span className="text-3xl leading-none font-extrabold tracking-tight text-ink-300 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="pt-0.5 text-[15px] leading-relaxed text-ink-800">{m}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Sambutan + sekretariat */}
      <section className="container-x grid gap-3 lg:grid-cols-5">
        <div className="rounded-4xl bg-ink-950 p-6 text-white sm:p-8 lg:col-span-3">
          <Quote className="h-8 w-8 text-sun-400" strokeWidth={2.5} />
          <p className="eyebrow mt-4 text-ink-400">Sambutan Ketua</p>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-100">{s.chairman_message}</p>
          {chair && (
            <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
              <Avatar name={chair.name} src={chair.photo} className="h-12 w-12 text-base ring-2 ring-sun-400" />
              <div>
                <p className="font-bold">{chair.name}</p>
                <p className="text-xs text-ink-400">{chair.position}</p>
              </div>
            </div>
          )}
        </div>
        <div className="card space-y-4 p-6 text-sm sm:p-8 lg:col-span-2">
          <p className="eyebrow">Sekretariat</p>
          <p className="flex gap-3 text-ink-700">
            <MapPin className="h-5 w-5 shrink-0 text-ink-400" /> {s.address}
          </p>
          {s.phone && (
            <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="flex gap-3 text-ink-700 hover:text-ink-950">
              <Phone className="h-5 w-5 shrink-0 text-ink-400" /> {s.phone}
            </a>
          )}
          {s.email && (
            <a href={`mailto:${s.email}`} className="flex gap-3 break-all text-ink-700 hover:text-ink-950">
              <Mail className="h-5 w-5 shrink-0 text-ink-400" /> {s.email}
            </a>
          )}
        </div>
      </section>

      {/* Sekbid */}
      <section className="container-x">
        <SectionTitle
          eyebrow="Seksi bidang"
          title={`${divisions?.length || 10} Sekbid OSIS`}
          desc="Fokus pembinaan setiap seksi bidang mengacu pada Permendiknas No. 39 Tahun 2008 tentang Pembinaan Kesiswaan."
        />
        {loading && <Skeleton className="h-64" />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(divisions || []).map((d) => (
            <div key={d.id} className="flex gap-4 rounded-3xl border border-ink-200/70 bg-white p-4 sm:flex-col sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-sun-400">
                <Icon name={d.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold tracking-wide text-ink-500 uppercase">{d.short}</p>
                <h3 className="mt-0.5 text-[15px] leading-snug font-bold text-ink-950">{d.name}</h3>
                {d.description && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{d.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {s.maps_embed && (
        <section className="container-x">
          <SectionTitle eyebrow="Lokasi" title="Temukan kami" />
          <div className="overflow-hidden rounded-4xl border border-ink-200/70">
            <iframe title="Peta lokasi SMA Negeri 3 Rembang" src={s.maps_embed} className="h-72 w-full grayscale-[.3] sm:h-96" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </section>
      )}
    </div>
  );
}
