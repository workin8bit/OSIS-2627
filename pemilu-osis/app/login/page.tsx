"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/backend";
import type { VoterSession } from "@/lib/types";

const SESSION_KEY = "osis_session";

export default function LoginPage() {
  const router = useRouter();
  const [NISN, setNis] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const info = await api.checkVoter(NISN.trim(), password);
      if (!info) {
        setError("NISN/NIP atau kata sandi tidak cocok, atau belum terdaftar.");
        return;
      }
      const session: VoterSession = {
        NISN: NISN.trim(),
        name: info.name,
        class_name: info.class_name,
        has_voted: info.has_voted,
        // Disimpan supaya bilik suara bisa menulis NIP untuk guru dan
        // NISN untuk siswa. Kalau role belum ada, dianggap siswa.
        role: info.role,
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
        <div className="surface border-t-4 border-t-brand p-7 sm:p-8">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
            <div>
              <span className="font-medium text-[11px] tracking-normal text-neutral-500">
                Akses Pemilih
              </span>
              <h1 className="text-xl font-black tracking-tight text-neutral-950">
                Masuk Bilik Suara
              </h1>
            </div>
            <span className="flex h-9 items-center justify-center rounded-xl bg-brand px-3 font-mono text-xs font-bold text-brand-ink">
              NISN/NIP
            </span>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate={false}>
            <div>
              <label
                htmlFor="nisn"
                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
              >
                Nomor Induk Siswa (NISN) / Nomor Induk Pegawai (NIP)
              </label>
              <input
                id="nisn"
                name="nisn"
                autoComplete="username"
                value={NISN}
                onChange={(e) => setNis(e.target.value)}
                required
                /* Sebagian guru memakai ID non-numerik, jadi keyboard
                    numerik akan membuat mereka tidak bisa mengetik. */
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="cth. 2025001 atau 19850101"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                className="input font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-medium text-neutral-700"
              >
                Kata Sandi Pemilih
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  className="input pr-11 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                  }
                  aria-pressed={showPassword}
                  className="press absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-dark"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a17.6 17.6 0 0 1-2.55 3.66" />
                      <path d="M6.1 6.1A17.5 17.5 0 0 0 2 12s3 8 10 8a9 9 0 0 0 4.1-.96" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                      <line x1="3" y1="3" x2="21" y2="21" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                id="login-error"
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-800"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="press w-full rounded-full bg-brand py-3 text-sm font-semibold text-brand-ink transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark disabled:opacity-50"
            >
              {loading ? "Memverifikasi..." : (
                <span className="flex items-center justify-center gap-1.5">
                  Verifikasi &amp; Masuk Bilik
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
            <Link
              href="/"
              className="font-mono text-[11px] text-neutral-600 hover:text-brand-deep"
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
                Kembali ke Beranda
              </span>
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Siswa gunakan NISN, guru gunakan NIP.
        </p>
      </div>
    </div>
  );
}
