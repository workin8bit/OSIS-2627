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
        if (list.length > 0) setActiveTab(list[0].id);
      })
      .catch(() => {});
  }, []);

  const active = candidates.find((c) => c.id === activeTab) ?? candidates[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="font-medium text-xs tracking-normal text-neutral-500">
            Daftar Calon Ketua & Wakil OSIS
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
            Profil & Visi Misi Paslon
          </h1>
        </div>
        <Link
          href="/vote"
          className="press inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold tracking-normal text-brand-ink shadow-brand transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Masuk Bilik Suara &rarr;
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {candidates.map((c) => {
          const isCurrent = (activeTab || candidates[0]?.id) === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all ${
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
        <div className="surface fade-up mt-6 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between border-b border-neutral-100 pb-8">
            <div className="flex items-start gap-5">
              <span className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-neutral-950 font-mono text-3xl sm:text-4xl font-black text-white">
                {String(active.number).padStart(2, "0")}
              </span>
              <div>
                <span className="font-medium text-[11px] tracking-normal text-neutral-500">
                  Calon Ketua OSIS &middot; Nomor Urut {active.number}
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
                  {active.name}
                </h2>
                <div className="mt-1 text-xs font-mono text-neutral-600">
                  Kelas: {active.class_name}
                </div>
              </div>
            </div>

            {active.slogan && (
              <div className="max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <span className="font-medium text-[10px] tracking-normal text-neutral-500">
                  Slogan Perjuangan
                </span>
                <p className="mt-1 text-sm font-semibold italic text-neutral-800">
                  &ldquo;{active.slogan}&rdquo;
                </p>
              </div>
            )}

            {active.wakil_name && (
              <div className="max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <span className="font-medium text-[10px] tracking-normal text-neutral-500">
                  Calon Wakil Ketua OSIS
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-mono text-sm font-bold text-brand-ink">
                    {String(active.number).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      {active.wakil_name}
                    </p>
                    {active.wakil_class_name && (
                      <span className="font-mono text-[10px] text-neutral-500">
                        Kelas: {active.wakil_class_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <CandidateMedia candidate={active} />

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-normal text-neutral-900">
                  01 / VISI STRATEGIS
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                {active.vision || "Belum ada visi tercantum."}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-normal text-neutral-900">
                  02 / PROGRAM & MISI
                </span>
              </div>
              <div className="mt-3 text-sm leading-relaxed text-neutral-700 font-normal">
                {active.mission ? (
                  <MissionList text={active.mission} />
                ) : (
                  "Belum ada rincian misi tercantum."
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 pt-6">
            <span className="font-mono text-xs text-neutral-500">
              Yakin dengan kandidat ini? Gunakan hak suaramu di bilik.
            </span>
            <Link
              href="/vote"
              className="press w-full sm:w-auto rounded-full bg-brand px-6 py-3 text-center text-sm font-semibold tracking-normal text-brand-ink shadow-brand transition-all hover:bg-brand-hover"
            >
              Coblos Nomor {active.number} Sekarang
            </Link>
          </div>
        </div>
      )}

      {candidates.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 p-12 text-center font-mono text-xs text-neutral-500">
          Belum ada kandidat aktif.
        </div>
      )}
    </div>
  );
}