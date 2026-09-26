import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForSelector("article", { timeout: 30000 });
await new Promise((r) => setTimeout(r, 700));

const read = () =>
  page.evaluate(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const hex = (css) => {
      ctx.fillStyle = "#ff00ff";
      ctx.fillStyle = css;
      if (ctx.fillStyle === "#ff00ff") return "?";
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    };
    const c = document.querySelector("article");
    const cs = getComputedStyle(c);
    return { border: hex(cs.borderTopColor), shadow: cs.boxShadow.slice(0, 44) };
  });

const before = await read();
console.log(`  diam  : border=${before.border}`);
console.log(`          shadow=${before.shadow}`);

await page.hover("article");
await new Promise((r) => setTimeout(r, 600));
const after = await read();
console.log(`  hover : border=${after.border}`);
console.log(`          shadow=${after.shadow}`);

console.log(
  `\n  border berubah? ${before.border !== after.border ? "YA" : "TIDAK - utility kalah oleh .surface"}`
);

await browser.close();
