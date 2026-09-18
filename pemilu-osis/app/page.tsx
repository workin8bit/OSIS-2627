"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/backend";
import { countdownParts, fmtDateTime } from "@/lib/format";
import type { Candidate, Status, Tally } from "@/lib/types";

export default function HomePage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tally, setTally] = useState<Tally | null>(null);
  const [now, setNow] = useState(Date.now());
  const [selectedPaslon, setSelectedPaslon] = useState<Candidate | null>(null);

  useEffect(() => {
    api.getStatus().then(setStatus).catch(() => {});
    api
      .listCandidates()
      .then((cs) => {
        const active = cs.filter((c) => c.is_active);
        setCandidates(active);
        if (active.length > 0) setSelectedPaslon(active[0]);
      })
      .catch(() => {});
    api.getTally().then(setTally).catch(() => {});
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let stateLabel = "Memuat...";
  let isLive = false;
  let detail = "";
  if (status) {
    const start = status.start_at ? new Date(status.start_at).getTime() : null;
    const end = status.end_at ? new Date(status.end_at).getTime() : null;
    if (!status.is_open) {
      stateLabel = "Bilik Ditutup";
      detail = "Menunggu arahan panitia.";
    } else if (start && now < start) {
      stateLabel = "Segera Dimulai";
      const c = countdownParts(status.start_at, now);
      detail = c ? `Mulai dalam ${c.text}` : "";
    } else if (end && now > end) {
      stateLabel = "Selesai";
      detail = `Ditutup ${fmtDateTime(status.end_at)}.`;
    } else {
      stateLabel = "Pemilihan Dibuka";
      isLive = true;
      detail = end ? `Ditutup ${fmtDateTime(status.end_at)}` : "Suara diterima langsung.";
    }
  }

  const schoolName = status?.school_name || "SMA Negeri 1 Rembangan";
  const electionName = status?.election_name || "Pemilihan Ketua & Wakil OSIS";
  const year = status?.academic_year || "2026/2027";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* TOP META BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-neutral-500">
            {schoolName} · Periode {year}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
              isLive
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 bg-neutral-100 text-neutral-700"
            }`}
          >
            {stateLabel}
          </span>
          {detail && (
            <span className="text-neutral-500 font-mono text-[11px] hidden sm:inline">
              · {detail}
            </span>
          )}
        </div>
      </div>

      {/* HERO SECTION — CANDIDATE-FIRST SHOWCASE */}
      <section className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Heading & Action */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="inline-block rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
            Kandidat Calon Pemimpin
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl lg:text-[42px] lg:leading-[1.1]">
            {electionName}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
            Kenali rekam jejak, visi, dan gagasan nyata setiap pasangan calon sebelum memberikan hak suaramu di bilik digital.
          </p>

          {/* Quick Metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-y border-neutral-200/80 py-4 font-mono">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                Total Paslon
              </div>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
                0{candidates.length}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500">
                Hak Suara
              </div>
              <div className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
                1 Siswa = 1
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/vote"
              className="group flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800 hover:shadow-md"
            >
              <span>Masuk Bilik Suara</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/results"
              className="flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors hover:border-neutral-900"
            >
              Live Quick Count
            </Link>
          </div>

          <div className="mt-5 text-[11px] font-mono text-neutral-400">
            * Memerlukan NIS &amp; sandi resmi panitia pemilihan OSIS.
          </div>
        </div>

        {/* Right Column: Candidate Showcase Cards */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-500">
            <span>Daftar Nomor Urut ({candidates.length})</span>
            <span className="hidden sm:inline">Pilih kartu untuk sorot detail</span>
          </div>

          <div className="space-y-3">
            {candidates.map((c) => {
              const isSelected = selectedPaslon?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedPaslon(c)}
                  className={`cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all ${
                    isSelected
                      ? "border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900"
                      : "border-neutral-200 bg-white/70 hover:border-neutral-400 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    {/* Number Badge */}
                    <div className="flex flex-col items-center">
                      <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-neutral-950 font-mono text-xl sm:text-2xl font-black text-white">
                        {String(c.number).padStart(2, "0")}
                      </span>
                      <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
                        Urut
                      </span>
                    </div>

                    {/* Candidate Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                          {c.name}
                        </h2>
                        <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600">
                          {c.class_name}
                        </span>
                      </div>

                      {c.slogan && (
                        <p className="mt-1 text-xs sm:text-sm font-medium italic text-neutral-600">
                          “{c.slogan}”
                        </p>
                      )}

                      {/* Vision / Mission snippet */}
                      <div className="mt-3.5 space-y-2 border-t border-neutral-100 pt-3 text-xs text-neutral-600">
                        <div>
                          <span className="font-mono text-[10px] uppercase font-bold text-neutral-900">
                            Visi:{" "}
                          </span>
                          <span className="line-clamp-2">{c.vision || "—"}</span>
                        </div>
                        {isSelected && c.mission && (
                          <div className="fade-up mt-2 pt-2 border-t border-neutral-100">
                            <span className="font-mono text-[10px] uppercase font-bold text-neutral-900">
                              Misi Prioritas:
                            </span>
                            <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-neutral-600">
                              {c.mission}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card footer CTA */}
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px]">
                    <span className="font-mono text-neutral-400">
                      {isSelected ? "Sedang aktif" : "Klik untuk membuka misi"}
                    </span>
                    <Link
                      href="/candidates"
                      className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
                    >
                      Buka Profil Lengkap →
                    </Link>
                  </div>
                </div>
              );
            })}

            {candidates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center font-mono text-xs text-neutral-500">
                Belum ada data kandidat tersimpan. Buka panel admin untuk mendaftarkan paslon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3-STEP FLOW: CLEAN & TYPOGRAPHIC */}
      <section className="mt-16 sm:mt-20 border-t border-neutral-200/80 pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Prosedur Resmi
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
              Alur Penggunaan Bilik Digital
            </h2>
          </div>
          <p className="text-xs text-neutral-500 max-w-sm">
            Proses pemilihan dirancang ringkas tanpa kehilangan asas kerahasiaan pilihan.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Otentikasi Identitas",
              desc: "Gunakan NIS resmi dan kata sandi sementara yang sudah dibagikan oleh panitia kelas.",
            },
            {
              step: "02",
              title: "Kaji Profil Paslon",
              desc: "Bandingkan visi misi tiap nomor urut di bilik sebelum menentukan pilihan final.",
            },
            {
              step: "03",
              title: "Kunci Pilihan",
              desc: "Kirim konfirmasi suara. Sistem mengunci 1 suara per akun siswa secara permanen.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-neutral-400"
            >
              <div className="font-mono text-2xl font-black text-neutral-950">
                {item.step}
              </div>
              <h3 className="mt-3 text-sm font-bold text-neutral-900">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PRINCIPLES BANNER */}
      <section className="mt-12 rounded-2xl border border-neutral-900 bg-neutral-950 p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              Jaminan Sistem
            </span>
            <h3 className="mt-1 text-lg sm:text-xl font-bold tracking-tight">
              Langsung, Umum, Bebas, Rahasia, Jujur &amp; Adil
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Pilihan suara dienkripsi dan diikat dengan proteksi Row-Level Security (RLS). Tidak ada pengurus atau guru yang dapat mengaitkan nama siswa dengan nomor paslon yang dicoblos.
            </p>
          </div>
          <Link
            href="/vote"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-950 transition-colors hover:bg-neutral-100"
          >
            Mulai Pilih Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}
