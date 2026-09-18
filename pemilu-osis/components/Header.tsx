"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/candidates", label: "Paslon" },
  { href: "/results", label: "Hasil Suara" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-xs font-black tracking-wider text-white transition-transform group-hover:scale-95">
            OS
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-neutral-900">
              E-Pilketos
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Sistem Suara Siswa
            </span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-tight transition-colors ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`}
              >
                {l.label}
              </Link>
            );
          })}

          <div className="mx-1 h-4 w-px bg-neutral-200" />

          <Link
            href="/vote"
            className="rounded-lg border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-bold text-neutral-900 transition-all hover:border-neutral-900 hover:shadow-xs"
          >
            Masuk Bilik
          </Link>

          <Link
            href="/admin"
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-950"
            title="Panel Penyelenggara"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
