import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      // Output `npm run build:verify`; flat config tidak membaca .gitignore,
      // jadi harus diabaikan eksplisit agar tidak ikut di-lint.
      ".next-build/**",
      "node_modules/**",
      "out/**",
      ".agents/**",
      ".claude/**",
      ".kilo/**",
      "next-env.d.ts",
      // Skrip sekali pakai di root repo, tidak pernah ikut commit.
      "*.cjs",
      "fix*.js",
      "run_fix.js",
      "test_*.js",
      "cdp_*.js",
      "*.py",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Menangkap pola yang lolos sebelumnya, misalnya <div onClick> di bilik suara.
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "jsx-a11y": jsxA11y },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/scope": "error",
    },
  },

  // Hook React: exhaustive-deps diberi peringatan, bukan error, agar tidak
  // memblokir build untuk pola yang disengaja.
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
