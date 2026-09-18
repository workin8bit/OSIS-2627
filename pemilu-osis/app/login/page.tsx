"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, isDemoMode } from "@/lib/backend";
import type { VoterSession } from "@/lib/types";

const SESSION_KEY = "osis_session";

export default function LoginPage() {
  const router = useRouter();
  const [nis, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const info = await api.checkVoter(nis.trim(), password);
      if (!info) {
        setError("NIS atau kata sandi tidak cocok, atau belum terdaftar.");
        return;
      }
      const session: VoterSession = {
        nis: nis.trim(),
        name: info.name,
        class_name: info.class_name,
        has_voted: info.has_voted,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem("osis_pw", password);
      router.push("/vote");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kendala koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <div className="fade-up w-full max-w-sm">
        <div className="rounded-2xl border border-neutral-200 bg-white p-7 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                Akses Pemilih
              </span>
              <h1 className="text-xl font-black tracking-tight text-neutral-950">
                Masuk Bilik Suara
              </h1>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 font-mono text-xs font-bold text-white">
              NIS
            </span>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-neutral-600">
                Nomor Induk Siswa (NIS)
              </label>
              <input
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                required
                inputMode="numeric"
                placeholder="cth. 2025001"
                className="input font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-neutral-600">
                Kata Sandi Pemilih
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input font-mono"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-900">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-neutral-950 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : "Verifikasi & Masuk Bilik →"}
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
            <Link
              href="/"
              className="font-mono text-[11px] text-neutral-500 hover:text-neutral-900"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>

        {isDemoMode && (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3.5 text-center font-mono text-[11px] text-neutral-600">
            <span className="font-bold text-neutral-900">Info Akun Uji:</span> NIS{" "}
            <code className="bg-neutral-100 px-1 py-0.5 rounded">2025010</code> (belum memilih) · sandi{" "}
            <code className="bg-neutral-100 px-1 py-0.5 rounded">siswa123</code>
          </div>
        )}
      </div>
    </div>
  );
}
