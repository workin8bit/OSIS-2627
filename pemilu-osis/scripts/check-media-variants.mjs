import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto("http://localhost:3000/candidates", { waitUntil: "networkidle2", timeout: 120000 });
await new Promise((r) => setTimeout(r, 2000));

const jumlah = await page.evaluate(() => document.querySelectorAll("button[aria-pressed]").length);
for (let i = 0; i < jumlah; i++) {
  const info = await page.evaluate(async (idx) => {
    document.querySelectorAll("button[aria-pressed]")[idx].click();
    await new Promise((r) => setTimeout(r, 600));
    const card = document.querySelector("main article");
    return {
      tab: document.querySelectorAll("button[aria-pressed]")[idx].textContent.trim(),
      nama: card.querySelector("h2").textContent.trim(),
      adaBlokMedia: !!card.querySelector("iframe, video"),
      fotoHeader: !!card.querySelector("div.border-b img"),
      alignVisi: getComputedStyle(card.querySelector("p.whitespace-pre-line")).textAlign,
    };
  }, i);
  console.log(JSON.stringify(info));
}

await browser.close();
