import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const URL = "http://localhost:3000/";
const WIDTHS = [320, 375, 414, 640, 768, 1024, 1440];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

console.log("  w     header  logo  nama  sub   sub-w  nav   overflow  terpotong");
for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 400));

  const m = await page.evaluate(() => {
    const header = document.querySelector("header");
    const nav = document.querySelector("header nav");
    const logo = document.querySelector('header img[src*="logo"]');
    // Span nama = anak langsung dari span pembungkus; span subtitle = anak
    // kedua dari pembungkus itu. Jangan pakai querySelectorAll("span") karena
    // itu ikut menangkap seluruh keturunan.
    const wrapper = logo?.parentElement?.querySelector(":scope > span:not(.sr-only)");
    const name = wrapper?.querySelector(":scope > span");
    const sub = wrapper?.querySelector(":scope > span + span");
    const cs = (el) => (el ? parseFloat(getComputedStyle(el).fontSize) : 0);
    return {
      headerH: header ? Math.round(header.getBoundingClientRect().height) : 0,
      logo: logo ? Math.round(logo.getBoundingClientRect().height) : 0,
      nameText: name?.textContent?.trim() ?? "-",
      subText: sub?.textContent?.trim() ?? "-",
      nameSize: cs(name),
      subSize: cs(sub),
      subW: sub ? Math.round(sub.getBoundingClientRect().width) : 0,
      subScroll: sub ? sub.scrollWidth : 0,
      subClipped: sub ? sub.scrollWidth > sub.clientWidth + 1 : false,
      navW: nav ? Math.round(nav.getBoundingClientRect().width) : 0,
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const fmt = (n) => String(Math.round(n * 10) / 10);
  console.log(
    `  ${String(width).padEnd(5)} h=${String(m.headerH).padEnd(4)} logo=${String(m.logo).padEnd(4)} ` +
      `nama=${fmt(m.nameSize).padEnd(5)} sub=${fmt(m.subSize).padEnd(5)} subW=${String(m.subW).padEnd(5)} ` +
      `nav=${String(m.navW).padEnd(5)} ovf=${String(m.docOverflow).padEnd(4)} ` +
      `potong=${m.subClipped ? "YA" : "tidak"}`
  );
  if (width === 1440) {
    console.log(`\n  teks nama : "${m.nameText}"`);
    console.log(`  teks sub  : "${m.subText}"`);
    console.log(`  sub scrollWidth=${m.subScroll} clientWidth=${m.subW} (sisa ${m.subScroll - m.subW}px)`);
  }
  await page.close();
}

await browser.close();
