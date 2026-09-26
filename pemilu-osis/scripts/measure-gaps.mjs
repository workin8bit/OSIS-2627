import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WIDTHS = [390, 1440];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 400));

  const gaps = await page.evaluate(() => {
    const out = [];
    const walk = (el, depth) => {
      for (const c of el.children) {
        const r = c.getBoundingClientRect();
        if (r.height === 0) continue;
        const label =
          (c.textContent || "").trim().slice(0, 30).replace(/\s+/g, " ") || c.tagName.toLowerCase();
        if (depth <= 3) {
          out.push({
            depth,
            label,
            top: Math.round(r.top + window.scrollY),
            h: Math.round(r.height),
          });
        }
        walk(c, depth + 1);
      }
    };
    const root = document.querySelector("header + * > div") ?? document.body;
    walk(root, 0);
    return out;
  });

  console.log(`\n  === ${width}px: jarak vertikal antar blok ===`);
  let prev = null;
  const shown = [];
  for (const g of gaps) {
    if (prev && g.top > prev.top + prev.h) {
      const gap = g.top - (prev.top + prev.h);
      if (gap >= 24) shown.push({ gap, above: prev.label, below: g.label });
    }
    prev = g;
  }
  shown.sort((a, b) => b.gap - a.gap);
  for (const s of shown.slice(0, 12)) {
    console.log(`  ${String(s.gap).padStart(4)}px  "${s.above}"  ->  "${s.below}"`);
  }
  await page.close();
}

await browser.close();
