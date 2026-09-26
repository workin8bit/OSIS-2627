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
    if (!card) return { error: "kartu tidak ditemukan" };

    const head = card.querySelector("div.border-b");
    const thumb = head.querySelector("div.w-20, div.w-24");
    const thumbImg = thumb?.querySelector("img, div");
    const badge = [...head.querySelectorAll("span")].find((s) => /^\d{2}$/.test((s.textContent || "").trim()));
    const box = card.querySelector("div.overflow-hidden.rounded-2xl");
    const visiP = box?.querySelector("p.whitespace-pre-line");
    const misiUl = box?.querySelectorAll("ul")[0];
    const cta = [...card.querySelectorAll("span")].find((s) =>
      /Yakin dengan kandidat ini/.test(s.textContent || "")
    );
    const videoBlok = !!card.querySelector("iframe, video");

    return {
      adaFotoDiHeader: !!thumbImg,
      lebarFoto: thumb ? Math.round(thumb.getBoundingClientRect().width) : null,
      badgeNomurMasih: !!badge,
      alignVisi: visiP ? getComputedStyle(visiP).textAlign : null,
      alignMisi: misiUl ? getComputedStyle(misiUl).textAlign : null,
      alignMisiItem: misiUl?.firstElementChild
        ? getComputedStyle(misiUl.firstElementChild.querySelector("span:last-child") || misiUl.firstElementChild).textAlign
        : null,
      ctaTeks: (cta?.textContent || "").trim(),
      blokMediaBesar: videoBlok,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      cardOverflow: card.scrollWidth > card.clientWidth + 1,
    };
  });

  console.log(`${String(width).padStart(4)}px ${JSON.stringify(r)}`);
  await page.close();
}

await browser.close();
