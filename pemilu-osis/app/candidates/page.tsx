"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/backend";
import type { Candidate } from "@/lib/types";
import { CandidateMedia, MissionList } from "@/components/CandidateMedia";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCandidates()
      .then((cs) => {
        const list = cs.filter((c) => c.is_active);
        setCandidates(list);
        // Deep-link dari beranda: /candidates?paslon=<id>
        const wanted = new URLSearchParams(window.location.search).get("paslon");
        const match = list.find((c) => c.id === wanted);
        if (match) setActiveTab(match.id);
        else if (list.length > 0) setActiveTab(list[0].id);
      })
      .catch(() => {});
  }, []);

  // Jaga URL tetap sinkron dengan tab aktif supaya tautan bisa dibagikan.
  const selectTab = (id: string) => {
    setActiveTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("paslon", id);
    window.history.replaceState(null, "", url);
  };

  const active = candidates.find((c) => c.id === activeTab) ?? candidates[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-4 border-b border-neutral-200/80 pb-6 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-medium tracking-normal text-neutral-500">
            Daftar Calon Ketua & Wakil OSIS
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
            Profil &amp; Visi Misi Paslon
          </h1>
        </div>
        <Link
          href="/vote"
          className="press inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold tracking-normal text-brand-ink shadow-brand transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Masuk Bilik Suara &rarr;
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {candidates.map((c) => {
          const isCurrent = (activeTab || candidates[0]?.id) === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectTab(c.id)}
              aria-pressed={isCurrent}
              className={`press flex items-center gap-3 rounded-full border px-4 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark ${
                isCurrent
                  ? "border-brand-dark bg-brand text-brand-ink shadow-brand"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold ${
                  isCurrent ? "bg-brand-ink text-brand" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {c.number}
              </span>
              <span className="text-xs font-semibold">{c.name}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <article className="surface fade-up mt-6 overflow-hidden shadow-xs">
          {/* Identitas paslon: nomor urut, nama, kelas, dan wakil dibaca
              sebagai satu blok. Slogan ditolak ke kanan pada layar lebar
              supaya tidak memutus baris nama. */}
          <div className="flex flex-col gap-5 border-b border-neutral-100 p-6 sm:p-8 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 font-mono text-2xl font-black text-white sm:h-16 sm:w-16 sm:text-3xl">
                {String(active.number).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-medium tracking-normal text-neutral-500">
                  Calon Ketua OSIS &middot; Nomor Urut {active.number}
                </div>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
                  {active.name}
                </h2>

                <dl className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <dt className="text-neutral-500">Ketua</dt>
                    <dd className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-neutral-700">
                      {active.class_name}
                    </dd>
                  </div>

                  {active.wakil_name && (
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden className="h-4 w-px bg-neutral-200" />
                      <dt className="text-neutral-500">Wakil</dt>
                      <dd className="min-w-0 truncate font-semibold text-neutral-800">
                        {active.wakil_name}
                      </dd>
                      {active.wakil_class_name && (
                        <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-neutral-600">
                          {active.wakil_class_name}
                        </span>
                      )}
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {active.slogan && (
              <blockquote className="max-w-sm rounded-xl border-l-4 border-brand bg-brand-wash/70 px-4 py-3 md:shrink-0">
                <div className="text-[11px] font-medium tracking-normal text-neutral-500">
                  Slogan
                </div>
                <p className="mt-1 text-sm font-semibold italic leading-relaxed text-neutral-900">
                  &ldquo;{active.slogan}&rdquo;
                </p>
              </blockquote>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <CandidateMedia candidate={active} />

            {/* Visi dan misi dalam satu container dengan dua baris terpisah.
                Penomoran "01 / 02" dihapus karena tidak menambah informasi. */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50/60">
              <div className="p-5 sm:p-6">
                <h3 className="text-[12px] font-bold tracking-[0.08em] text-neutral-900 uppercase">
                  Visi Strategis
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed whitespace-pre-line text-neutral-700">
                  {active.vision || "Belum ada visi tercantum."}
                </p>
              </div>

              <div className="border-t border-neutral-200 p-5 sm:p-6">
                <h3 className="text-[12px] font-bold tracking-[0.08em] text-neutral-900 uppercase">
                  Program &amp; Misi
                </h3>
                {active.mission ? (
                  <MissionList
                    text={active.mission}
                    className="mt-2.5 text-[15px] leading-relaxed"
                  />
                ) : (
                  <p className="mt-2.5 text-[15px] leading-relaxed text-neutral-700">
                    Belum ada rincian misi tercantum.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-100 px-6 py-5 sm:flex-row sm:px-8">
            <span className="text-xs text-neutral-500">
              Yakin dengan kandidat ini? Gunakan hak suaramu di bilik.
            </span>
            <Link
              href="/vote"
              className="press w-full rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold tracking-normal text-brand-ink shadow-brand transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark sm:w-auto"
            >
              Coblos Nomor {active.number} Sekarang
            </Link>
          </div>
        </article>
      )}

      {candidates.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-neutral-800">
            Belum ada kandidat aktif
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-neutral-600">
            Halaman ini akan terisi begitu panitia menambahkan pasangan calon.
          </p>
        </div>
      )}
    </div>
  );
}
