import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const width of [320, 390, 768, 1440]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
  await page.waitForSelector("article", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 600));

  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("article")];
    const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
    const c = cards[0];
    // Kolom foto = pembungkus CandidateMedia (w-20 / sm:w-24)
    const media = c.querySelector(".aspect-\\[3\\/4\\]");
    const mR = media?.getBoundingClientRect();
    // Baris flex yang memuat foto + visi = induk dari kolom foto.
    const col = c.querySelector(".w-20");
    const row = col?.parentElement;
    const rR = row?.getBoundingClientRect();
    // Blok Visi
    const visiHead = [...c.querySelectorAll("div")].find(
      (d) => d.children.length === 0 && d.textContent.trim() === "Visi"
    );
    const vR = visiHead?.getBoundingClientRect();
    const misiHead = [...c.querySelectorAll("div")].find(
      (d) => d.children.length === 0 && d.textContent.trim() === "Misi Prioritas"
    );
    // Yang dibandingkan adalah WADAH misi, bukan labelnya.
    const misiWrap = misiHead?.parentElement;
    const mR2 = misiWrap?.getBoundingClientRect();
    return {
      heights,
      avg: Math.round(heights.reduce((a, b) => a + b, 0) / heights.length),
      mediaW: mR ? Math.round(mR.width) : null,
      mediaH: mR ? Math.round(mR.height) : null,
      // Visi harus di kanan foto dan sejajar atas
      visiKananFoto: mR && vR ? vR.left >= mR.right - 2 : null,
      visiSejajarAtas: mR && vR ? Math.abs(vR.top - mR.top) < 24 : null,
      // Misi harus di bawah baris foto+visi, dan selebar baris itu
      misiDiBawah: rR && mR2 ? mR2.top >= rR.top + rR.height - 2 : null,
      misiLebarPenuh: rR && mR2 ? Math.abs(mR2.width - rR.width) < 2 : null,
      rowW: rR ? Math.round(rR.width) : null,
      misiW: mR2 ? Math.round(mR2.width) : null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cardOverflow: cards.map((x) => x.scrollWidth - x.clientWidth),
    };
  });

  console.log(
    `  ${String(width).padStart(4)}px  tinggiCard=${r.heights.join("/")} (rata2 ${r.avg}px)  foto=${r.mediaW}x${r.mediaH}`
  );
  console.log(
    `         visiKananFoto=${r.visiKananFoto ? "YA" : "TIDAK"}  visiSejajar=${r.visiSejajarAtas ? "YA" : "TIDAK"}  ` +
      `misiDiBawah=${r.misiDiBawah ? "YA" : "TIDAK"}  misiLebarPenuh=${r.misiLebarPenuh ? "YA" : "TIDAK"} ` +
      `(${r.misiW}/${r.rowW}px)  ovf=${r.overflow} cardOvf=${r.cardOverflow.join("/")}`
  );
  await page.close();
}

await browser.close();
