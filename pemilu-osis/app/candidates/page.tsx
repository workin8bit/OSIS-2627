"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/backend";
import type { Candidate } from "@/lib/types";

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-neutral-500">
            Daftar Calon Pemimpin OSIS
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
            Profil &amp; Visi Misi Paslon
          </h1>
        </div>
        <Link
          href="/vote"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800"
        >
          Masuk Bilik Suara →
        </Link>
      </div>

      {/* Number Selector Tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {candidates.map((c) => {
          const isCurrent = (activeTab || candidates[0]?.id) === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-all ${
                isCurrent
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-xs"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold ${
                  isCurrent
                    ? "bg-white text-neutral-900"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {c.number}
              </span>
              <span className="text-xs font-semibold">{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Detailed Card */}
      {active && (
        <div className="fade-up mt-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between border-b border-neutral-100 pb-8">
            <div className="flex items-start gap-5">
              <span className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-neutral-950 font-mono text-3xl sm:text-4xl font-black text-white">
                {String(active.number).padStart(2, "0")}
              </span>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  Calon Ketua OSIS · Nomor Urut {active.number}
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
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  Slogan Perjuangan
                </span>
                <p className="mt-1 text-sm font-semibold italic text-neutral-800">
                  “{active.slogan}”
                </p>
              </div>
            )}
          </div>

          {/* Visi & Misi Grids */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900">
                  01 / VISI STRATEGIS
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-line">
                {active.vision || "Belum ada visi tercantum."}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-6">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black uppercase tracking-wider text-neutral-900">
                  02 / PROGRAM &amp; MISI
                </span>
              </div>
              <div className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-line font-normal">
                {active.mission || "Belum ada rincian misi tercantum."}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 pt-6">
            <span className="font-mono text-xs text-neutral-500">
              Yakin dengan kandidat ini? Gunakan hak suaramu di bilik.
            </span>
            <Link
              href="/vote"
              className="w-full sm:w-auto rounded-xl bg-neutral-950 px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800"
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
