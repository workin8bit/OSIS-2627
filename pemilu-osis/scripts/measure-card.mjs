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
  await new Promise((r) => setTimeout(r, 500));

  const r = await page.evaluate(() => {
    const card = document.querySelector("article");
    if (!card) return null;
    const cr = card.getBoundingClientRect();

    // Tombol "Buka Profil Lengkap"
    const link = card.querySelector('a[href^="/candidates?paslon="]');
    const lr = link?.getBoundingClientRect();
    const justify = getComputedStyle(link?.parentElement).justifyContent;

    // Badge kelas + info wakil. Badge nomor urut (h-12 w-12, font-black)
    // juga font-mono, jadi harus dikecualikan agar tidak tertangkap.
    const mono = [...card.querySelectorAll("span.font-mono")].filter(
      (s) => !s.className.includes("h-12")
    );
    const kelas = mono[0];
    const wakilClass = mono[1];
    const wakilLabel = [...card.querySelectorAll("span")].find(
      (s) => s.textContent.trim() === "Wakil:"
    );
    const wakilName = wakilLabel?.nextElementSibling;

    return {
      cardRight: Math.round(cr.right),
      linkRight: lr ? Math.round(lr.right) : null,
      linkLeft: lr ? Math.round(lr.left) : null,
      justify,
      kelasSize: kelas ? getComputedStyle(kelas).fontSize : null,
      kelasText: kelas?.textContent?.trim(),
      wakilClassSize: wakilClass ? getComputedStyle(wakilClass).fontSize : null,
      wakilClassText: wakilClass?.textContent?.trim(),
      wakilSize: wakilName ? getComputedStyle(wakilName).fontSize : null,
      wakilText: wakilName?.textContent?.trim(),
      labelSize: wakilLabel ? getComputedStyle(wakilLabel).fontSize : null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      cardOverflow: card.scrollWidth - card.clientWidth,
    };
  });

  if (!r) {
    console.log(`  ${width}px  card tidak ditemukan`);
    await page.close();
    continue;
  }
  const rightAligned = r.linkRight !== null && Math.abs(r.linkRight - r.cardRight) < 26;
  console.log(
    `  ${String(width).padStart(4)}px  link kanan=${rightAligned ? "YA" : "TIDAK"} (${r.justify})  ` +
      `kelas=${r.kelasSize}(${r.kelasText})  wakil=${r.wakilSize}(${r.wakilText}) ` +
      `ykelas=${r.wakilClassSize}(${r.wakilClassText}) label=${r.labelSize}  ` +
      `ovf=${r.overflow} cardOvf=${r.cardOverflow}`
  );
  await page.close();
}

await browser.close();
