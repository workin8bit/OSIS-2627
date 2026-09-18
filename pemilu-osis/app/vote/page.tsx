"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/backend";
import type { Candidate, Status, VoterSession } from "@/lib/types";

const SESSION_KEY = "osis_session";

export default function VotePage() {
  const router = useRouter();
  const [session, setSession] = useState<VoterSession | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [votedNow, setVotedNow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace("/login");
      return;
    }
    const s: VoterSession = JSON.parse(raw);
    setSession(s);
    api.getStatus().then(setStatus).catch(() => {});
    api
      .listCandidates()
      .then((cs) => setCandidates(cs.filter((c) => c.is_active)))
      .catch(() => {});

    const pw = sessionStorage.getItem("osis_pw");
    if (pw) {
      api
        .checkVoter(s.nis, pw)
        .then((info) => {
          if (info) {
            const next = { ...s, has_voted: info.has_voted };
            setSession(next);
            localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          }
        })
        .catch(() => {});
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;
  if (!session) return null;

  const voted = votedNow || session.has_voted;
  const notOpen = status ? !status.is_open : false;
  const chosen = candidates.find((c) => c.id === selected) ?? null;

  const submit = async () => {
    if (!selected) return;
    const pw = sessionStorage.getItem("osis_pw");
    if (!pw) {
      setError("Sesi telah habis. Silakan login kembali untuk validasi suara.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await api.castVote(session.nis, pw, selected);
      if (res === "ok") {
        const next = { ...session, has_voted: true };
        setSession(next);
        localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        sessionStorage.removeItem("osis_pw");
        setVotedNow(true);
        setConfirmOpen(false);
      } else {
        setError(res.replace(/^error:/, ""));
        setConfirmOpen(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirimkan suara.");
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // SUDAH MEMILIH
  if (voted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="fade-up w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-950 font-mono text-xl font-black text-white">
            OK
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-neutral-950">
            Hak Suara Berhasil Disalurkan
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600">
            Terima kasih, <span className="font-bold text-neutral-900">{session.name}</span> ({session.class_name}). Suaramu telah tercatat dalam tabulasi terenkripsi dan tidak dapat diubah kembali.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-2">
            <Link
              href="/results"
              className="rounded-xl bg-neutral-950 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              Lihat Quick Count
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-neutral-300 px-5 py-3 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900"
            >
              Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Voter Profile Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-950 font-mono text-sm font-bold text-white">
            {session.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-sm">{session.name}</div>
            <div className="font-mono text-xs text-neutral-500">
              {session.class_name} · NIS {session.nis}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider rounded-md bg-neutral-100 px-2.5 py-1 text-neutral-700 border border-neutral-200">
            1 Hak Suara Aktif
          </span>
          <button
            onClick={() => {
              localStorage.removeItem(SESSION_KEY);
              sessionStorage.removeItem("osis_pw");
              router.push("/login");
            }}
            className="font-mono text-[11px] text-neutral-500 hover:text-neutral-900 underline"
          >
            Keluar Sesi
          </button>
        </div>
      </div>

      {notOpen && (
        <div className="mt-4 rounded-xl border border-neutral-300 bg-neutral-100 p-4 font-mono text-xs text-neutral-700">
          * Bilik suara sedang dinonaktifkan oleh panitia pemilihan.
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 border-b border-neutral-200/80 pb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">
          Surat Suara Digital
        </span>
        <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
          Tentukan Pasangan Calon Pilihanmu
        </h1>
        <p className="mt-1 text-xs text-neutral-500">
          Pilih salah satu nomor urut di bawah, lalu klik konfirmasi untuk mengunci suara.
        </p>
      </div>

      {/* Ballot Cards Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {candidates.map((c) => {
          const isSel = selected === c.id;
          return (
            <div
              key={c.id}
              onClick={() => !notOpen && setSelected(c.id)}
              className={`cursor-pointer rounded-2xl border p-6 transition-all ${
                isSel
                  ? "border-neutral-950 bg-white ring-2 ring-neutral-950 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-400"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-950 font-mono text-xl font-black text-white">
                  {String(c.number).padStart(2, "0")}
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold border ${
                    isSel
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-300 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </div>

              <div className="mt-4">
                <div className="font-bold text-neutral-950 text-lg">{c.name}</div>
                <div className="font-mono text-xs text-neutral-500">{c.class_name}</div>
              </div>

              {c.slogan && (
                <p className="mt-3 text-xs italic text-neutral-600 line-clamp-2">
                  “{c.slogan}”
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between font-mono text-[11px]">
                <span className="text-neutral-400">Nomor {c.number}</span>
                <span className={isSel ? "font-bold text-neutral-950" : "text-neutral-400"}>
                  {isSel ? "Terpilih" : "Klik untuk memilih"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-neutral-300 bg-neutral-50 p-4 text-xs font-mono text-neutral-900">
          {error}
        </div>
      )}

      {/* Sticky Bottom Confirmation Bar */}
      <div className="sticky bottom-4 mt-8">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl border border-neutral-300 bg-white/95 p-4 shadow-lg backdrop-blur-md">
          <div className="min-w-0">
            {chosen ? (
              <div className="text-xs">
                <span className="text-neutral-500 font-mono">Pilihan: </span>
                <span className="font-bold text-neutral-950">
                  {chosen.name} (No. {chosen.number})
                </span>
              </div>
            ) : (
              <span className="font-mono text-xs text-neutral-400">
                Belum ada nomor yang dipilih
              </span>
            )}
          </div>

          <button
            disabled={!chosen || notOpen}
            onClick={() => setConfirmOpen(true)}
            className="rounded-xl bg-neutral-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800 disabled:opacity-40"
          >
            Kunci &amp; Coblos Suara →
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && chosen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-xs"
          onClick={() => !submitting && setConfirmOpen(false)}
        >
          <div
            className="fade-up w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
              Konfirmasi Pilihan Final
            </div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-950">
              Kirimkan Surat Suara?
            </h2>
            <p className="mt-2 text-xs text-neutral-500">
              Kamu akan memberikan 1 suara sah kepada:
            </p>

            <div className="mt-4 flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 font-mono text-base font-bold text-white">
                {chosen.number}
              </span>
              <div>
                <div className="font-bold text-neutral-950 text-sm">{chosen.name}</div>
                <div className="font-mono text-xs text-neutral-500">{chosen.class_name}</div>
              </div>
            </div>

            <p className="mt-4 font-mono text-[11px] leading-relaxed text-neutral-500">
              * Suara yang sudah terkirim tidak dapat ditarik atau diganti dengan alasan apa pun.
            </p>

            <div className="mt-6 flex gap-2">
              <button
                disabled={submitting}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-900 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={submitting}
                onClick={submit}
                className="flex-1 rounded-xl bg-neutral-950 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {submitting ? "Mengunci..." : "Ya, Coblos ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
