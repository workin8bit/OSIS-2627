import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

// Konversi oklch() -> sRGB harus di dalam browser (butuh canvas).
const toRgb = (css) => {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#ff00ff";
  ctx.fillStyle = css;
  if (ctx.fillStyle === "#ff00ff") return null;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
};
const lum = ([r, g, b]) => {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

for (const width of [320, 390, 768, 1440]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000 });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 800));

  const r = await page.evaluate(() => {
    const card = document.querySelector("article");
    if (!card) return null;
    // Blok visi/misi = container yang memuat label "Visi:"
    const visiLabel = [...card.querySelectorAll("span")].find((s) =>
      s.textContent.trim().startsWith("Visi:")
    );
    const box = visiLabel?.closest("div")?.parentElement;
    if (!box) return null;
    const cs = getComputedStyle(box);
    const inner = visiLabel.nextElementSibling;
    const innerCs = inner ? getComputedStyle(inner) : null;
    const text = (inner?.textContent || "").trim();
    const r2 = inner?.getBoundingClientRect();
    const chPerLine = r2 ? Math.round(r2.width / (parseFloat(innerCs.fontSize) * 0.52)) : 0;
    // Konversi warna di dalam browser.
    const rgbOf = (css) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      ctx.fillStyle = "#ff00ff";
      ctx.fillStyle = css;
      if (ctx.fillStyle === "#ff00ff") return null;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };
    // Latar effective: kartu putih.
    return {
      fontSize: cs.fontSize,
      rgb: rgbOf(cs.color),
      lineHeight: cs.lineHeight,
      align: cs.textAlign,
      innerSize: innerCs?.fontSize,
      innerRgb: rgbOf(innerCs?.color ?? cs.color),
      labelSize: visiLabel ? getComputedStyle(visiLabel).fontSize : null,
      labelRgb: rgbOf(getComputedStyle(visiLabel).color),
      widthPx: r2 ? Math.round(r2.width) : null,
      chPerLine,
      sample: text.slice(0, 40),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  if (!r) {
    console.log(`  ${width}px  data belum siap`);
    await page.close();
    continue;
  }
  const bg = [255, 255, 255];
  const cInner = r.innerRgb ? ratio(r.innerRgb, bg) : NaN;
  const cLabel = r.labelRgb ? ratio(r.labelRgb, bg) : NaN;
  console.log(
    `  ${String(width).padStart(4)}px  visi-box=${r.fontSize} isi=${r.innerSize} label=${r.labelSize} ` +
      `lh=${r.lineHeight} align=${r.align} lebar=${r.widthPx}px ~${r.chPerLine} huruf/baris`
  );
  console.log(
    `         kontras isi=${cInner.toFixed(1)}:1  label="Visi:"=${cLabel.toFixed(1)}:1  ` +
      `(wajib >=4.5)  ovf=${r.overflow}`
  );
  console.log(`         contoh: "${r.sample}"`);
  await page.close();
}

await browser.close();
