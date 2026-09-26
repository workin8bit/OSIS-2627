/**
 * Ambil screenshot tiap route pada beberapa lebar layar.
 *
 * Jalankan dev server dulu, lalu:
 *   node scripts/screenshot.mjs                 -> localhost:3000
 *   node scripts/screenshot.mjs https://...     -> URL lain (mis. produksi)
 *
 * Hasil: .screenshots/<viewport>/<route>.png
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", ".screenshots");

const ROUTES = [
  { path: "/", name: "beranda" },
  { path: "/candidates", name: "kandidat" },
  { path: "/login", name: "login" },
  { path: "/results", name: "hasil" },
  { path: "/vote", name: "bilik-suara" },
  { path: "/admin", name: "admin" },
  { path: "/tidak-ada", name: "404" },
];

// 320 = iPhone SE generasi 1 (paling sempit), 1440 = laptop.
const VIEWPORTS = [
  { name: "320-small", width: 320, height: 900, dsf: 2, mobile: true },
  { name: "390-phone", width: 390, height: 844, dsf: 2, mobile: true },
  { name: "768-tablet", width: 768, height: 1024, dsf: 2, mobile: true },
  { name: "1440-desktop", width: 1440, height: 900, dsf: 1, mobile: false },
];

const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
});

const report = [];

for (const vp of VIEWPORTS) {
  const dir = join(OUT, vp.name);
  await mkdir(dir, { recursive: true });

  for (const r of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });

    const errors = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 200));
    });
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

    let status = "?";
    let overflow = null;
    try {
      const resp = await page.goto(BASE + r.path, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      status = resp?.status() ?? "?";
      await new Promise((res) => setTimeout(res, 700));

      // Deteksi overflow horizontal: penyebab utama layout rusak di ponsel.
      overflow = await page.evaluate(() => {
        const de = document.documentElement;
        const over = de.scrollWidth - de.clientWidth;
        if (over <= 1) return null;
        const guilty = [];
        for (const el of document.querySelectorAll("*")) {
          const rect = el.getBoundingClientRect();
          if (rect.right > de.clientWidth + 1 && rect.width > 0) {
            guilty.push(
              `${el.tagName.toLowerCase()}.${String(el.className || "")
                .split(/\s+/)
                .slice(0, 2)
                .join(".")} (right=${Math.round(rect.right)})`
            );
          }
        }
        return { over, guilty: guilty.slice(0, 5) };
      });

      await page.screenshot({
        path: join(dir, `${r.name}.png`),
        fullPage: true,
      });
    } catch (e) {
      errors.push(String(e).slice(0, 200));
    }

    await page.close();

    report.push({
      viewport: vp.name,
      route: r.path,
      status,
      overflow,
      errors,
    });

    const flag = overflow ? ` OVERFLOW +${overflow.over}px` : "";
    const err = errors.length ? ` ERROR(${errors.length})` : "";
    console.log(
      `  ${vp.name.padEnd(13)} ${r.path.padEnd(14)} ${String(status).padEnd(4)}${flag}${err}`
    );
  }
}

await browser.close();
await writeFile(join(OUT, "report.json"), JSON.stringify(report, null, 2));

const problems = report.filter((r) => r.overflow || r.errors.length);
console.log(`\nSelesai -> ${OUT}`);
if (problems.length === 0) {
  console.log("Tidak ada overflow horizontal atau error konsol.");
} else {
  console.log(`${problems.length} temuan perlu dilihat:`);
  for (const p of problems) {
    console.log(`  ${p.viewport} ${p.route}`);
    if (p.overflow) {
      console.log(`    overflow +${p.overflow.over}px:`);
      for (const g of p.overflow.guilty) console.log(`      ${g}`);
    }
    for (const e of p.errors) console.log(`    error: ${e}`);
  }
}
