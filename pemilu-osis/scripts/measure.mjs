/**
 * Ukur jarak vertikal antar elemen di beranda.
 * Dipakai untuk menyetel ritme spasi tanpa perlu menebak.
 */
import puppeteer from "puppeteer-core";

const URL_ = process.argv[2] || "http://localhost:3000/";
const WIDTH = Number(process.argv[3] || 1440);

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: 1 });
await page.goto(URL_, { waitUntil: "networkidle2", timeout: 45000 });
await new Promise((r) => setTimeout(r, 900));

const data = await page.evaluate(() => {
  const pick = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      height: Math.round(r.height),
      padTop: cs.paddingTop,
      padBottom: cs.paddingBottom,
      marginTop: cs.marginTop,
    };
  };

  const header = document.querySelector("header");
  const main = document.querySelector("main");
  const page1 = main?.firstElementChild; // wrapper max-w-6xl
  const metaRow = page1?.firstElementChild; // baris sekolah + status
  const section = page1?.querySelector("section"); // kartu panduan
  const h1 = document.querySelector("h1");

  return {
    header: pick(header),
    pageWrapper: pick(page1),
    metaRow: pick(metaRow),
    guideSection: pick(section),
    h1: pick(h1),
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  };
});

const gap = (a, b) => (a && b ? b.top - a.bottom : null);

console.log(`viewport: ${WIDTH}px\n`);
const rows = [
  ["header", data.header],
  ["wrapper", data.pageWrapper],
  ["metaRow", data.metaRow],
  ["guide", data.guideSection],
  ["h1", data.h1],
];
for (const [k, v] of rows) {
  if (!v) {
    console.log(`  ${k.padEnd(10)} (tidak ditemukan)`);
    continue;
  }
  console.log(
    `  ${k.padEnd(10)} top=${String(v.top).padEnd(5)} bottom=${String(v.bottom).padEnd(5)} h=${String(v.height).padEnd(4)} pad=${v.padTop}/${v.padBottom} mar=${v.marginTop}`
  );
}

console.log(`\n  header -> wrapper   : ${gap(data.header, data.pageWrapper)} px`);
console.log(`  wrapper -> metaRow  : ${gap(data.pageWrapper, data.metaRow)} px`);
console.log(`  metaRow -> guide    : ${gap(data.metaRow, data.guideSection)} px`);
console.log(`  guide -> h1         : ${gap(data.guideSection, data.h1)} px`);
console.log(`\n  overflow horizontal : ${data.scrollW - data.clientW} px`);
console.log(`  body font           : ${data.bodyFont.split(",")[0]}`);
console.log(`  body background     : ${data.bodyBg}`);

await browser.close();
