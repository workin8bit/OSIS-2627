import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const w of [390, 768, 1440]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3000/", {
    waitUntil: "networkidle2",
    timeout: 45000,
  });
  await new Promise((r) => setTimeout(r, 800));

  const d = await page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    const header = document.querySelector("header");
    const h1 = document.querySelector("h1");
    // baris meta = anak pertama dari wrapper max-w-6xl
    const wrapper = document.querySelector("main > div");
    const metaRow = wrapper?.firstElementChild;
    // tombol CTA utama
    const cta = Array.from(document.querySelectorAll("a")).find((a) =>
      a.textContent?.includes("Masuk Bilik Suara")
    );
    // kartu panduan = section[data-guide]
    const guide = document.querySelector("main section.surface");
    return {
      header: box(header),
      metaRow: box(metaRow),
      h1: box(h1),
      cta: box(cta),
      guide: box(guide),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const g = (a, b) => (a && b ? b.top - a.bottom : null);
  console.log(`\nviewport ${w}px   overflow: ${d.overflow}px`);
  console.log(`  header (h=${d.header.bottom}) -> meta     : ${g(d.header, d.metaRow)} px`);
  console.log(`  meta                          -> h1      : ${g(d.metaRow, d.h1)} px`);
  console.log(`  h1 (h=${d.h1.bottom - d.h1.top})                   -> CTA     : ${g(d.h1, d.cta)} px`);
  console.log(`  meta -> panduan (kolom kanan) : ${g(d.metaRow, d.guide)} px`);
  await page.close();
}

await browser.close();
