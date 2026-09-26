import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const width of [320, 390, 768, 1280]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width < 768, hasTouch: width < 768 });
  await page.goto("http://localhost:3000/candidates", { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2000));

  const r = await page.evaluate(() => {
    const card = document.querySelector("main article");
    const head = card.querySelector("div.border-b");
    const grid = head.querySelector("div.grid");
    const h2 = head.querySelector("h2");
    const chip = head.querySelector("span.rounded-md");
    const slogan = [...head.querySelectorAll("p")].pop();
    const g = grid.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const h = h2.getBoundingClientRect();
    const s = slogan ? slogan.getBoundingClientRect() : null;

    return {
      adaLabelKetua: /Ketua/.test(head.textContent),
      namaKiri: Math.round(h.left),
      kelasKiri: Math.round(c.left),
      kelasDiSisiNama: c.left > h.left,
      kelasDiBawahNama: c.top > h.bottom - 1,
      urutanBaris: [...grid.children].map((x) => `${x.tagName}:${(x.textContent || "").trim().slice(0, 16)}`),
      sloganDiBawahVice: s ? g.bottom <= s.top + 2 : null,
      sloganTeks: (slogan?.textContent || "").trim().slice(0, 24),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      cardOverflow: card.scrollWidth > card.clientWidth + 1,
    };
  });

  console.log(`${String(width).padStart(4)}px ${JSON.stringify(r)}`);
  await page.close();
}

await browser.close();
