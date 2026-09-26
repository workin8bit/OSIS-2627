"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/backend";
import { countdownParts, fmtDateTime } from "@/lib/format";
import type { Candidate, Status } from "@/lib/types";
import { CandidateMedia, MissionList } from "@/components/CandidateMedia";
import {
  CheckIcon,
  ClockIcon,
  LockIcon,
  LockOpenIcon,
} from "@/components/Icons";

export default function HomePage() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api
      .getStatus()
      .then(setStatus)
      .catch(() => {});
    api
      .listCandidates()
      .then((cs) => setCandidates(cs.filter((c) => c.is_active)))
      .catch(() => {});
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  let stateLabel = "Memuat...";
  let isLive = false;
  let detail = "";
  let StateIcon: (p: { className?: string }) => React.ReactElement | null = ClockIcon;
  if (status) {
    const start = status.start_at ? new Date(status.start_at).getTime() : null;
    const end = status.end_at ? new Date(status.end_at).getTime() : null;
    if (!status.is_open) {
      stateLabel = "Bilik Ditutup";
      StateIcon = LockIcon;
      detail = "Menunggu arahan panitia.";
    } else if (start && now < start) {
      stateLabel = "Segera Dimulai";
      StateIcon = ClockIcon;
      const c = countdownParts(status.start_at, now);
      detail = c ? `Mulai dalam ${c.text}` : "";
    } else if (end && now > end) {
      stateLabel = "Selesai";
      StateIcon = CheckIcon;
      detail = `Ditutup ${fmtDateTime(status.end_at)}.`;
    } else {
      stateLabel = "Pemilihan Dibuka";
      isLive = true;
      StateIcon = LockOpenIcon;
      detail = end ? `Ditutup ${fmtDateTime(status.end_at)}` : "Suara diterima langsung.";
    }
  }

  const schoolName = status?.school_name || "SMA Negeri 3 Rembang";
  // Nilai sekolah berasal dari database, jadi awalan "OSIS" ditambahkan hanya
  // bila belum ada - supaya tidak menjadi "OSIS OSIS SMA Negeri 3 Rembang".
  const schoolLabel = /^\s*osis\b/i.test(schoolName)
    ? schoolName
    : `OSIS ${schoolName}`;
  const electionName = status?.election_name || "Pemilihan Ketua & Wakil OSIS";
  const year = status?.academic_year || "2026/2027";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 sm:pb-20">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col items-start gap-1.5">
          <span className="inline-flex w-fit items-center rounded-lg border border-brand/40 bg-brand-wash px-2.5 py-1 text-[13px] font-semibold text-neutral-950">
            Platform Pemilihan Ketua OSIS
          </span>
          <span className="text-[13px] text-neutral-500">
            {schoolLabel} &middot; Periode {year}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
              isLive
                ? "bg-brand text-brand-ink"
                : "border border-neutral-300 bg-white text-neutral-700"
            }`}
          >
            {!status ? (
              <span
                aria-hidden
                className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
              />
            ) : (
              <StateIcon className={`h-3.5 w-3.5 ${isLive ? "" : "opacity-80"}`} />
            )}
            {stateLabel}
          </span>
          {detail && (
            <span className="hidden text-[12px] text-neutral-500 sm:inline">
              {detail}
            </span>
          )}
        </div>
      </div>


      <section className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="inline-flex w-fit items-center rounded-lg border border-brand/40 bg-brand-wash px-2.5 py-1 text-[13px] font-semibold text-neutral-950">
            Kandidat Calon Ketua & Wakil OSIS
          </div>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-tight text-neutral-950 sm:text-[40px] lg:text-[44px]">
            {electionName}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-600 sm:text-base">
            Kenali rekam jejak, visi, dan gagasan nyata setiap pasangan calon sebelum memberikan hak suaramu di bilik digital.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-6 border-y border-neutral-200/80 py-4">
            <div>
              <div className="text-[12px] text-neutral-500">Total Paslon</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-neutral-950 tabular-nums">
                {candidates.length}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-neutral-500">Hak Suara</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">
                1 = 1 Suara
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/vote"
              className="press group flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold tracking-normal text-brand-ink transition-all hover:bg-brand-hover hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              <span>Masuk Bilik Suara</span>
              <span className="transition-transform group-hover:translate-x-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
            <Link
              href="/results"
              className="press flex items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-3.5 text-sm font-semibold tracking-normal text-neutral-800 transition-colors hover:border-brand-dark hover:bg-brand-wash"
            >
              Live Quick Count
            </Link>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-7">

        <section className="overflow-hidden rounded-[var(--radius-card)] border border-brand/35 bg-brand-wash">
        <button
          type="button"
          onClick={() => setGuideOpen((g) => !g)}
          aria-expanded={guideOpen}
          className="press flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-dark"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-ink">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4.5 w-4.5"
                aria-hidden
              >
                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                <path d="M21 3h-3a2 2 0 0 0-2 2v3" />
                <path d="M3 11v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
                <path d="M8 8h8" />
                <path d="M8 12h8" />
                <path d="M8 16h5" />
              </svg>
            </span>
            <div>
              <div className="text-[12px] text-neutral-500">Panduan</div>
              <h2 className="text-[15px] font-semibold tracking-tight text-neutral-950">
                Langkah-langkah Pengambilan Suara
              </h2>
            </div>
          </div>
          <span
            className={`text-neutral-500 transition-transform ${guideOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
        {guideOpen && (
          <div className="border-t border-brand/25 bg-white px-5 py-5">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-brand-ink">
                  1
                </span>
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Buka Bilik Suara
                  </p>
                  <p className="text-xs text-neutral-600">
                    Klik tombol{" "}
                    <span className="rounded border border-brand/40 bg-white px-1.5 py-0.5 font-mono text-neutral-700">
                      Masuk Bilik Suara
                    </span>{" "}
                    di bawah heading. Anda akan diarahkan ke halaman login.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-brand-ink">
                  2
                </span>
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Masukkan NISN & Sandi
                  </p>
                  <p className="text-xs text-neutral-600">
                    Gunakan NISN (hanya angka) dan sandi sementara yang sudah
                    dibagikan oleh panitia kelas. Klik{" "}
                    <span className="rounded border border-brand/40 bg-white px-1.5 py-0.5 font-mono text-neutral-700">
                      Masuk
                    </span>.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-brand-ink">
                  3
                </span>
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Pilih Nomor Urut
                  </p>
                  <p className="text-xs text-neutral-600">
                    Kenali tiap nomor urut di halaman utama: nomor, nama, kelas,
                    slogan, visi, dan misi sudah ditampilkan lengkap untuk setiap
                    paslon. Bandingkan satu per satu sebelum memilih.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-brand-ink">
                  4
                </span>
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Konfirmasi & Kunci Suara
                  </p>
                  <p className="text-xs text-neutral-600">
                    Setelah memilih, sistem meminta konfirmasi. Klik{" "}
                    <span className="rounded border border-brand/40 bg-white px-1.5 py-0.5 font-mono text-neutral-700">
                      Konfirmasi
                    </span>. Suara terkunci secara permanen &mdash; 1 akun = 1
                    suara, tidak dapat diubah.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-brand-ink">
                  5
                </span>
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Lihat Hasil (jika dibuka)
                  </p>
                  <p className="text-xs text-neutral-600">
                    Setelah panitia membuka hasil, Anda dapat melihat live
                    quick count di halaman{" "}
                    <span className="rounded border border-brand/40 bg-white px-1.5 py-0.5 font-mono text-neutral-700">
                      Hasil Suara
                    </span>. Suara dienkripsi dan diikat RLS &mdash; tidak ada yang
                    dapat mengaitkan nama siswa dengan pilihan Anda.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}
      </section>
          <div className="font-medium flex items-center justify-between text-xs tracking-normal text-neutral-500">
            <span>Daftar Nomor Urut ({candidates.length})</span>
            <span className="hidden sm:inline">Profil lengkap setiap paslon</span>
          </div>

          <div className="space-y-4">
            {candidates.map((c) => (
              <article
                key={c.id}
                className="surface surface-accent p-5 sm:p-6"
              >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand font-mono text-xl font-black text-brand-ink shadow-brand sm:h-14 sm:w-14 sm:text-2xl">
                      {String(c.number).padStart(2, "0")}
                    </span>
                      <span className="font-medium mt-1 text-[11px] tracking-normal text-neutral-500">
                        Urut
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2">
                        <h2 className="min-w-0 text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                          {c.name}
                        </h2>
                        <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-[13px] font-medium text-neutral-600">
                          {c.class_name}
                        </span>

                        {c.wakil_name && (
                          <>
                            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[15px] leading-snug sm:text-base">
                              <span className="text-sm font-semibold text-neutral-500">
                                Wakil:
                              </span>
                              <span className="min-w-0 font-semibold text-neutral-800">
                                {c.wakil_name}
                              </span>
                            </div>
                            {c.wakil_class_name && (
                              <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-[13px] text-neutral-500">
                                {c.wakil_class_name}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {c.slogan && (
                        <p className="mt-1 text-xs italic text-neutral-600 sm:text-sm">
                          <span className="font-medium">
                            &ldquo;{c.slogan}&rdquo;
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Foto kecil di kiri, visi di sebelahnya. Misi tetap
                      lebar penuh di bawah supaya card tidak memanjang. */}
                  <div className="mt-4 flex gap-4 border-t border-neutral-100 pt-4">
                    <div className="w-20 shrink-0 sm:w-24">
                      <CandidateMedia candidate={c} compact photoOnly />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-neutral-950">
                        Visi
                      </div>
                      <div className="mt-1 whitespace-pre-line text-left text-[13px] leading-relaxed text-neutral-700 sm:text-justify sm:text-sm">
                        {c.vision || "\u2014"}
                      </div>
                    </div>
                  </div>

                  {c.mission && (
                    <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
                      <div className="text-[13px] font-bold text-neutral-950">
                        Misi Prioritas
                      </div>
                      <MissionList text={c.mission} compact />
                    </div>
                  )}

                  <div className="mt-4 flex justify-end border-t border-neutral-100 pt-4">
                    <Link
                      href={`/candidates?paslon=${encodeURIComponent(c.id)}`}
                      className="press inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-brand/50 hover:bg-brand-wash hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                    >
                      Buka Profil Lengkap
                      <span className="transition-transform" aria-hidden>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </Link>
                  </div>
              </article>
            ))}

            {candidates.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center font-mono text-xs text-neutral-500">
                Belum ada data kandidat tersimpan. Buka panel admin untuk mendaftarkan paslon.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[var(--radius-card)] border border-brand/35 bg-brand-wash p-5 sm:mt-12 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="font-medium text-[11px] tracking-normal text-brand-deep">
              Prosedur Resmi
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950">
              Alur Penggunaan Bilik Digital
            </h2>
          </div>
          <p className="text-xs text-neutral-600 max-w-sm">
            Proses pemilihan dirancang ringkas tanpa kehilangan asas kerahasiaan pilihan.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Otentikasi Identitas",
              desc: "Gunakan NISN resmi dan kata sandi sementara yang sudah dibagikan oleh panitia kelas.",
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
              className="rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-brand/50"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand font-mono text-lg font-black text-brand-ink shadow-brand">
                {item.step}
              </div>
              <h3 className="mt-3 text-sm font-bold text-neutral-950">
                {item.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-700">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-neutral-950 p-6 sm:mt-10 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="font-medium text-[11px] tracking-normal text-brand">
              Jaminan Sistem
            </span>
            <h3 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white">
              Langsung, Umum, Bebas, Rahasia, Jujur &amp; Adil
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Pilihan suara dienkripsi dan diikat dengan proteksi Row-Level Security (RLS). Tidak ada pengurus atau panitia yang dapat mengaitkan nama siswa dengan nomor paslon yang dicoblos.
            </p>
          </div>
          <Link
            href="/vote"
            className="press inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold tracking-normal text-brand-ink transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Mulai Pilih Sekarang
          </Link>
        </div>
      </section>
    </div>
  );
}