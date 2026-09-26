"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/backend";
import { fmtDateTime, pct } from "@/lib/format";
import type { ResultRow, Status, Tally } from "@/lib/types";

export default function ResultsPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [tally, setTally] = useState<Tally | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [st, rs, tl] = await Promise.all([
          api.getStatus(),
          api.getResults(),
          api.getTally(),
        ]);
        if (!alive) return;
        setStatus(st);
        setRows(rs);
        setTally(tl);
      } catch {
        /* poll retry */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-mono text-xs text-neutral-500">
        Sinkronisasi tabulasi suara...
      </div>
    );
  }

  if (!status?.show_results) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="surface fade-up w-full max-w-md p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand font-mono text-base font-bold text-brand-ink">
            [x]
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-neutral-900">
            Tabulasi Belum Dibuka
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Sesuai regulasi, perolehan suara disembunyikan sampai penghitungan resmi dibuka oleh pihak panitia.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold tracking-normal text-brand-ink shadow-brand hover:bg-brand-hover"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const totalVotes = tally?.total_votes ?? rows.reduce((a, r) => a + r.total, 0);
  const totalVoters = tally?.total_voters ?? 0;
  const participation = totalVoters ? pct(totalVotes, totalVoters) : 0;
  const max = Math.max(...rows.map((r) => r.total), 1);
  const leader = rows.reduce<ResultRow | null>(
    (best, r) => (r.total > (best?.total ?? 0) ? r : best),
    null
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-brand/30 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs tracking-normal text-brand-deep">
              Tabulasi Resmi
            </span>
            {status.is_open && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold tracking-normal text-brand-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-ink animate-pulse" />
                Live Feed
              </span>
            )}
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-neutral-950">
            Hasil Perolehan Suara
          </h1>
        </div>
        <div className="font-mono text-xs text-neutral-600 text-left sm:text-right">
          Pembaruan otomatis tiap 5s
        </div>
      </div>

      {/* Rekap Angka Utama */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-brand/40 bg-brand-wash p-5">
          <div className="font-medium text-[11px] tracking-normal text-brand-deep">
            Suara Masuk
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-neutral-950 tabular-nums">
            {totalVotes}
          </div>
          <div className="mt-1 text-[11px] font-mono text-neutral-600">
            Terkonfirmasi valid
          </div>
        </div>

        <div className="rounded-2xl border border-brand/40 bg-brand-wash p-5">
          <div className="font-medium text-[11px] tracking-normal text-brand-deep">
            Daftar Pemilih Tetap (DPT)
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-neutral-950 tabular-nums">
            {totalVoters}
          </div>
          <div className="mt-1 text-[11px] font-mono text-neutral-600">
            Akun siswa terdaftar
          </div>
        </div>

        <div className="rounded-2xl border border-brand-dark bg-brand p-5 text-brand-ink">
          <div className="font-medium text-[11px] tracking-normal text-neutral-800">
            Tingkat Partisipasi
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-brand-ink tabular-nums">
            {participation}%
          </div>
          <div className="mt-1 text-[11px] font-mono text-neutral-800">
            {totalVoters - totalVotes} belum memilih
          </div>
        </div>
      </div>

      {/* Perolehan Suara per Paslon */}
      <div className="mt-8 space-y-3">
        {rows.map((r) => {
          const width = pct(r.total, max);
          const share = totalVotes > 0 ? pct(r.total, totalVotes) : 0;
          const isLeader = leader && leader.candidate_id === r.candidate_id && totalVotes > 0;

          return (
            <div
              key={r.candidate_id}
              className={`rounded-2xl border p-5 transition-all ${
                isLeader
                  ? "border-brand-dark bg-brand-wash"
                  : "border-brand/25 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-base font-bold ${
                      isLeader
                        ? "bg-brand text-brand-ink shadow-brand"
                        : "border border-brand/40 bg-brand-wash text-brand-ink"
                    }`}
                  >
                    {String(r.candidate_number).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-neutral-900 text-base">
                        {r.candidate_name}
                      </h3>
                      {isLeader && (
                        <span className="rounded-md bg-brand px-2 py-0.5 text-[9px] font-semibold tracking-normal text-brand-ink">
                          Suara Tertinggi
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-neutral-500">
                      Nomor Urut {String(r.candidate_number).padStart(2, "0")}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black tracking-tight text-neutral-950 tabular-nums">
                    {r.total}{" "}
                    <span className="text-xs font-normal text-neutral-500 font-mono">
                      suara
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-brand-deep">
                    {share}%
                  </div>
                </div>
              </div>

              {/* Progress bar: track kuning pucat, fill kuning pekat */}
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-brand/15">
                <div
                  className={`bar-anim h-full rounded-full transition-all duration-500 ${
                    isLeader ? "bg-brand-dark" : "bg-brand"
                  }`}
                  style={{ width: `${Math.max(width, r.total > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href="/"
          className="font-medium text-xs tracking-normal text-neutral-600 underline underline-offset-4 hover:text-brand-deep"
        >
          <span className="flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Kembali ke Halaman Utama
          </span>
        </Link>
      </div>
    </div>
  );
}
