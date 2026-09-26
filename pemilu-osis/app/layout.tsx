import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "E-Pilketos — Pemilihan Ketua OSIS",
  description:
    "Portal pemilihan ketua & wakil ketua OSIS daring: transparan, tertib, dan 1 orang 1 suara.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col text-neutral-900 selection:bg-neutral-900 selection:text-white">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-200/80 bg-white py-8 text-neutral-500">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-neutral-900" />
              <span className="font-semibold tracking-tight text-neutral-900">
                E-Pilketos
              </span>
              <span>— Platform Pemilihan Suara Daring</span>
            </div>
            <div className="text-neutral-500 text-center sm:text-right">
              Prinsip Luber Jurdil · OSIS SMA 3 REMBANG 26/27
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
