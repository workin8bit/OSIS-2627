/**
 * Build terisolasi: `next build` memakai direktori sendiri, bukan `.next`.
 *
 * Latar belakang: `next dev` dan `next build` sama-sama menulis ke `.next`.
 * Kalau build dijalankan selagi dev server hidup, keduanya saling menimpa -
 * manifest menunjuk chunk yang sudah terhapus, dan hasilnya
 * "Cannot find module './331.js'" atau sejenisnya.
 *
 * Dipakai lewat `npm run build:verify`. Build produksi (Vercel / CI) tetap
 * memakai `.next` karena `distDir` di next.config.ts hanya berubah kalau
 * NEXT_DIST_DIR diset.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { createConnection } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = ".next-build";
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");

function devServerOnPort(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: "127.0.0.1" });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(700);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

// Bersihkan sisa build sebelumnya supaya tidak ada artefak basi yang terbawa.
const distPath = path.join(ROOT, DIST);
if (existsSync(distPath)) {
  console.log(`> membersihkan ${DIST}/`);
  for (const entry of readdirSync(distPath)) {
    rmSync(path.join(distPath, entry), { recursive: true, force: true });
  }
}

if (await devServerOnPort(3000)) {
  console.log(
    "> dev server jalan di :3000 - aman, karena build ini memakai " +
      `${DIST}/ dan tidak menyentuh .next/`
  );
}

console.log(`> next build -> ${DIST}/\n`);

const child = spawn(process.execPath, [NEXT_BIN, "build"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, NEXT_DIST_DIR: DIST },
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`\n> build dihentikan oleh signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
