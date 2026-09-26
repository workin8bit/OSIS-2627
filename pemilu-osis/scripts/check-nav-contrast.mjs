import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const parse = (rgb) => {
  const n = rgb.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return n.slice(0, 3);
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
const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

for (const path of ["/", "/candidates", "/results"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle2", timeout: 120000 });

  const items = await page.evaluate(() => {
    // Tailwind v4 memakai oklch(), yang tidak bisa diparse regex. Konversi ke
    // sRGB lewat canvas, lalu verifikasi hasilnya benar.
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const toRgb = (css) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#ff00ff"; // magenta: penanda "gagal parse"
      ctx.fillStyle = css;
      if (ctx.fillStyle === "#ff00ff") return null;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2]];
    };

    // Uji konversi lebih dulu: putih harus jadi [255,255,255].
    const probe = toRgb("rgb(255, 255, 255)");
    if (!probe || probe.join() !== "255,255,255") {
      return { conversionOk: false, probe: probe?.join() ?? "null" };
    }

    const nav = document.querySelector("header nav");
    return {
      conversionOk: true,
      items: [...nav.querySelectorAll("a")].map((a) => {
        const cs = getComputedStyle(a);
        const svg = a.querySelector("svg");
        return {
          label: a.getAttribute("aria-label"),
          active: a.getAttribute("aria-current") === "page",
          bg: toRgb(cs.backgroundColor),
          icon: toRgb(svg ? getComputedStyle(svg).color : cs.color),
        };
      }),
    };
  });

  if (!items.conversionOk) {
    console.log(`\n  ${path}  KONVERSI WARNA GAGAL (probe=${items.probe})`);
    await page.close();
    continue;
  }

  console.log(`\n  ${path}`);
  for (const it of items.items) {
    if (!it.bg || !it.icon) {
      console.log(`    ${(it.label ?? "?").padEnd(24)} bg/icon tidak terbaca`);
      continue;
    }
    const c = ratio(it.icon, it.bg);
    const mark = it.active ? "*" : " ";
    console.log(
      `    ${mark} ${(it.label ?? "?").padEnd(24)} bg=${hex(it.bg)} icon=${hex(it.icon)} kontras=${c.toFixed(1)}:1`
    );
  }
  await page.close();
}

await browser.close();
