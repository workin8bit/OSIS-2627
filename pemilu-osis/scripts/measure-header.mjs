import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const width of [320, 360, 390, 768, 1440]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 780, isMobile: width < 768, hasTouch: width < 768 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 700));

  const r = await page.evaluate(() => {
    const header = document.querySelector("header");
    const name = [...document.querySelectorAll("header span")].find(
      (s) => s.textContent.trim() === "E-Pilketos" && s.children.length === 0
    );
    const desc = [...document.querySelectorAll("header span")].find(
      (s) => s.textContent.trim() === "Platform Pemilihan Ketua OSIS"
    );
    const vis = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      return {
        display: cs.display,
        fontSize: cs.fontSize,
        w: Math.round(b.width),
        h: Math.round(b.height),
        truncated: el.scrollWidth > el.clientWidth + 1,
      };
    };
    return {
      headerH: Math.round(header.getBoundingClientRect().height),
      name: vis(name),
      desc: vis(desc),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  console.log(
    `${String(width).padStart(4)}px header=${r.headerH}px overflowX=${r.overflowX} ` +
      `name=${JSON.stringify(r.name)} desc=${JSON.stringify(r.desc)}`
  );
  await page.close();
}

await browser.close();
