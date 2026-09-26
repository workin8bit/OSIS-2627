import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WIDTHS = [390, 768, 1440];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 500));

  const rows = await page.evaluate(() => {
    // Wrapper konten = elemen pertama yang memuat "pt-6 pb-16".
    const main =
      document.querySelector("header + * > div") ??
      document.querySelector("header")?.nextElementSibling;
    if (!main) return [];
    // Blok langsung anak dari wrapper konten.
    const blocks = [...main.children];
    const out = [];
    let prevBottom = null;
    let prevLabel = "(atas halaman)";

    const describe = (el, i) => {
      const cls = (el.className || "").toString();
      if (i === 0) return "baris meta (status)";
      if (cls.includes("grid gap-8")) return "hero (2 kolom)";
      if (cls.includes("space-y-4")) return "kartu panduan + daftar kandidat";
      return `blok ${i}`;
    };

    for (const el of blocks) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const label = describe(el, blocks.indexOf(el));
      out.push({
        label,
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        marginTop: Math.round(parseFloat(cs.marginTop) || 0),
        paddingTop: Math.round(parseFloat(cs.paddingTop) || 0),
        gapAbove: prevBottom === null ? 0 : Math.round(r.top - prevBottom),
      });
      prevBottom = r.top + r.height;
    }
    return out;
  });

  console.log(`\n  === viewport ${width}px ===`);
  console.log("  elemen                                gap atas  tinggi  mt   pt");
  for (const r of rows) {
    console.log(
      `  ${r.label.padEnd(36)} ${String(r.gapAbove).padStart(7)} ${String(r.height).padStart(8)} ` +
        `${String(r.marginTop).padStart(5)} ${String(r.paddingTop).padStart(4)}`
    );
  }

  const hero = rows.find((r) => r.label.startsWith("hero"));
  console.log(`  -> header ke meta: ${rows[0]?.paddingTop ?? "?"}px | meta ke hero: ${hero?.gapAbove ?? "?"}px`);
  await page.close();
}

await browser.close();
