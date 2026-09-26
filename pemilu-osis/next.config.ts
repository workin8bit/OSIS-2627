import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Explicit root: a parent lockfile otherwise makes Next guess the workspace
  // root and emit a warning on every dev start and build.
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
