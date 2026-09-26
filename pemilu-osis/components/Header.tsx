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
  { href: "/", label: "Beranda", icon: HomeIcon },
  { href: "/candidates", label: "Paslon", icon: UsersIcon },
  { href: "/results", label: "Hasil Suara", icon: BarChartIcon },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          <img
            src="/logo-osis.jpg"
            alt="Logo OSIS"
            className="h-9 w-9 flex-shrink-0 object-contain rounded-lg border border-neutral-200 bg-neutral-50 p-1 transition-transform group-hover:scale-95"
          />
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight text-neutral-900">
              E-Pilketos
            </span>
            <span className="font-medium block text-[10px] tracking-normal text-neutral-500">
              Sistem Suara Siswa
            </span>
          </span>
        </Link>

        {/* Navigation — Icon-only Line Icons */}
        <nav className="flex items-center gap-1 rounded-xl bg-neutral-100/80 p-1">
          {links.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                aria-label={l.label}
                aria-current={active ? "page" : undefined}
                className={`press flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}

          <div className="mx-0.5 h-6 w-px bg-neutral-300" />

          <Link
            href="/vote"
            title="Masuk Bilik Suara"
            aria-label="Masuk Bilik Suara"
            className="press flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-ink transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
          >
            <VoteIcon className="h-5 w-5" />
          </Link>

          <Link
            href="/admin"
            title="Panel Penyelenggara"
            aria-label="Panel Penyelenggara"
            className="press flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
          >
            <AdminIcon className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}