import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="fade-up w-full max-w-md text-center">
        <div className="text-[80px] font-semibold leading-none tracking-tighter text-brand">
          404
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          Halaman tidak ditemukan
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-neutral-600">
          Tautan yang Anda buka sudah berubah atau tidak pernah ada. Kembali ke
          beranda untuk melanjutkan.
        </p>
        <Link
          href="/"
          className="press mt-7 inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-ink transition-all hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
