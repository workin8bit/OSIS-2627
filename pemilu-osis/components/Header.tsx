"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  BarChartIcon,
  VoteIcon,
  AdminIcon,
} from "@/components/Icons";

const links = [
  { href: "/", label: "Beranda", short: "Beranda", icon: HomeIcon },
  { href: "/candidates", label: "Paslon", short: "Paslon", icon: UsersIcon },
  { href: "/results", label: "Hasil Suara", short: "Hasil", icon: BarChartIcon },
];

export default function Header() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const base =
    "press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
          >
            <img
              src="/logo-osis.jpg"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 flex-shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 object-contain p-1 transition-transform group-hover:scale-95"
            />
            {/* Nama dan deskripsi aplikasi tampil di semua lebar, termasuk
                mobile, supaya konteks aplikasi tidak hilang di layar kecil. */}
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base font-bold tracking-tight text-neutral-900 sm:text-xl">
                E-Pilketos
              </span>
              <span
                title="Platform Pemilihan Ketua OSIS"
                className="mt-0.5 block truncate text-[10px] font-medium tracking-normal text-neutral-500 sm:text-[11px] lg:text-xs"
              >
                Platform Pemilihan Ketua OSIS
              </span>
            </span>
          </Link>

          {/* Navigasi horizontal hanya tampil dari md ke atas; di bawah itu
              digantikan bottom nav. */}
          <nav
            aria-label="Navigasi utama"
            className="hidden min-w-0 items-center gap-0.5 rounded-2xl bg-neutral-100/80 p-1 md:flex"
          >
            {links.map((l) => {
              const active = isActive(l.href);
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  title={l.label}
                  aria-label={l.label}
                  aria-current={active ? "page" : undefined}
                  className={`${base} ${
                    active
                      ? "bg-brand text-brand-ink shadow-sm"
                      : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}

            <div
              aria-hidden
              className="mx-0.5 hidden h-6 w-px shrink-0 bg-neutral-300 sm:block"
            />

            <Link
              href="/vote"
              title="Masuk Bilik Suara"
              aria-label="Masuk Bilik Suara"
              className={`${base} border-2 border-brand bg-white text-brand-deep hover:bg-brand-wash`}
            >
              <VoteIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/admin"
              title="Panel Penyelenggara"
              aria-label="Panel Penyelenggara"
              className={`${base} text-neutral-500 hover:bg-white hover:text-neutral-900`}
            >
              <AdminIcon className="h-5 w-5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Bottom nav untuk layar kecil. Sengaja disembunyikan dari md ke atas
          agar tidak dobel dengan navigasi di header. */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
          {links.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <li key={l.href} className="flex-1">
                <Link
                  href={l.href}
                  aria-label={l.label}
                  aria-current={active ? "page" : undefined}
                  className="press flex flex-col items-center gap-1 rounded-lg px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                >
                  <span
                    className={`flex h-9 w-full max-w-[3.25rem] items-center justify-center rounded-lg transition-colors ${
                      active
                        ? "bg-brand text-brand-ink"
                        : "text-neutral-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={`text-[10px] leading-none ${
                      active
                        ? "font-semibold text-neutral-950"
                        : "text-neutral-500"
                    }`}
                  >
                    {l.short}
                  </span>
                </Link>
              </li>
            );
          })}

          <li className="flex-1">
            <Link
              href="/vote"
              aria-label="Masuk Bilik Suara"
              aria-current={pathname.startsWith("/vote") ? "page" : undefined}
              className="press flex flex-col items-center gap-1 rounded-lg px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              <span
                className={`flex h-9 w-full max-w-[3.25rem] items-center justify-center rounded-lg ${
                  pathname.startsWith("/vote")
                    ? "border-2 border-brand-dark bg-brand-wash text-brand-deep"
                    : "border-2 border-brand text-brand-deep"
                }`}
              >
                <VoteIcon className="h-5 w-5" />
              </span>
              <span
                className={`text-[10px] leading-none ${
                  pathname.startsWith("/vote")
                    ? "font-semibold text-neutral-950"
                    : "text-neutral-600"
                }`}
              >
                Vote
              </span>
            </Link>
          </li>

          <li className="flex-1">
            <Link
              href="/admin"
              aria-label="Panel Penyelenggara"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              className="press flex flex-col items-center gap-1 rounded-lg px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
            >
              <span
                className={`flex h-9 w-full max-w-[3.25rem] items-center justify-center rounded-lg transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-brand text-brand-ink"
                    : "text-neutral-500"
                }`}
              >
                <AdminIcon className="h-5 w-5" />
              </span>
              <span
                className={`text-[10px] leading-none ${
                  pathname.startsWith("/admin")
                    ? "font-semibold text-neutral-950"
                    : "text-neutral-500"
                }`}
              >
                Admin
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
