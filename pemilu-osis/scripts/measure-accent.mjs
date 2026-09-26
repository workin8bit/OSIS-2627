import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const path of ["/", "/candidates", "/results", "/vote"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 400));

  const r = await page.evaluate(() => {
    const docH = document.documentElement.scrollHeight;
    const isYellow = (c) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      if (d[3] < 8) return 0;
      // #f0e60f dengan toleransi
      return Math.abs(d[0] - 240) < 26 && Math.abs(d[1] - 230) < 26 && Math.abs(d[2] - 15) < 60;
    };
    let area = 0;
    const blocks = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (!isYellow(cs.backgroundColor)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      area += rect.width * rect.height;
      if (rect.width * rect.height > 1500) {
        blocks.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || "").toString().slice(0, 46),
          px: Math.round(rect.width * rect.height),
        });
      }
    }
    return {
      docH,
      pct: (area / (document.documentElement.clientWidth * docH)) * 100,
      blocks,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  console.log(
    `  ${path.padEnd(12)} kuning=${r.pct.toFixed(2)}% halaman  ovf=${r.overflow}  bidang besar: ${r.blocks.length}`
  );
  for (const b of r.blocks) {
    console.log(`      - <${b.tag}> ${b.px}px  ${b.cls}`);
  }
  await page.close();
}

await browser.close();
