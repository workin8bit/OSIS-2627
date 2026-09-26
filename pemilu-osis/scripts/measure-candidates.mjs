import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const width of [320, 390, 768, 1024, 1440]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width < 768, hasTouch: width < 768 });
  await page.goto("http://localhost:3000/candidates", { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 900));

  const r = await page.evaluate(() => {
    const card = document.querySelector("main article");
    if (!card) return { error: "kartu tidak ditemukan" };

    const box = card.querySelector("div.overflow-hidden.rounded-2xl");
    const rows = box
      ? [...box.children].map((row) => {
          const b = row.getBoundingClientRect();
          return {
            label: (row.querySelector("h3")?.textContent || "").trim(),
            top: Math.round(b.top),
            w: Math.round(b.width),
            h: Math.round(b.height),
          };
        })
      : [];

    const headings = [...document.querySelectorAll("h3")].map((h) => h.textContent.trim());
    const body = document.body.textContent || "";
    const masihAdaNomor = body.includes("01 / VISI") || body.includes("02 / PROGRAM");

    const slogan = card.querySelector("blockquote");
    const ident = card.querySelector("dl")?.parentElement?.parentElement;
    let sloganTumpang = false;
    if (slogan && ident) {
      const a = slogan.getBoundingClientRect();
      const b = ident.getBoundingClientRect();
      sloganTumpang = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    }

    return {
      cardW: Math.round(card.getBoundingClientRect().width),
      cardH: Math.round(card.getBoundingClientRect().height),
      headings,
      barisVisiMisi: rows,
      masihAdaNomor,
      sloganTumpang,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      overflowCard: card.scrollWidth > card.clientWidth + 1,
    };
  });

  console.log(`${String(width).padStart(4)}px ${JSON.stringify(r)}`);
  await page.close();
}

await browser.close();
