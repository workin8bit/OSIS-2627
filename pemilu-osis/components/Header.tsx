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

  const base =
    "press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          <img
            src="/logo-osis.jpg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 flex-shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 object-contain p-1 transition-transform group-hover:scale-95"
          />
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-bold tracking-tight text-neutral-900">
              E-Pilketos
            </span>
            <span className="block text-[10px] font-medium tracking-normal text-neutral-500">
              Sistem Suara Siswa
            </span>
          </span>
          <span className="sr-only sm:hidden">E-Pilketos</span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="-mx-1 flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-2xl bg-neutral-100/80 p-1"
        >
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
                className={`${base} ${
                  active
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                }`}
              >
                <Icon className="h-5 w-5" />
              </Link>
            );
          })}

          <div aria-hidden className="mx-0.5 hidden h-6 w-px shrink-0 bg-neutral-300 sm:block" />

          <Link
            href="/vote"
            title="Masuk Bilik Suara"
            aria-label="Masuk Bilik Suara"
            className={`${base} bg-brand text-brand-ink hover:bg-brand-hover`}
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
  );
}
