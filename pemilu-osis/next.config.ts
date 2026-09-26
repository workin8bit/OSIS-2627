import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Explicit root: a parent lockfile otherwise makes Next guess the workspace
  // root and emit a warning on every dev start and build.
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
  // `next dev` and `next build` both write to the same directory, so a build
  // while the dev server is running leaves manifests pointing at chunks that
  // were already overwritten ("Cannot find module './331.js'"). NEXT_DIST_DIR
  // lets a local verification build use a separate directory; production
  // builds on Vercel leave it unset and keep the default `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
