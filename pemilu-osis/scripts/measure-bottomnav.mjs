import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const PAGES = ["/", "/candidates", "/results", "/vote"];

for (const width of [360, 390, 768, 1024]) {
  console.log(`\n  === ${width}px ===`);
  for (const path of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 780, isMobile: width < 768, hasTouch: width < 768 });
    await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle2", timeout: 120000 });
    await new Promise((r) => setTimeout(r, 700));

    const r = await page.evaluate(() => {
      const navs = [...document.querySelectorAll("nav")].filter((n) =>
        /Navigasi utama/.test(n.getAttribute("aria-label") || "")
      );
      const bottom = navs.find((n) => getComputedStyle(n).position === "fixed");
      const top = navs.find((n) => getComputedStyle(n).position !== "fixed");
      const bR = bottom?.getBoundingClientRect();
      const navH = bR ? Math.round(bR.height) : 0;
      const bodyPad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;

      // Elemen terakhir yang terlihat harus berada di atas bottom nav
      let obscured = false;
      if (bottom && bR) {
        const navTop = bR.top;
        const all = [...document.querySelectorAll("main *, body > div > div > *")].filter(
          (e) => e.getBoundingClientRect().height > 0
        );
        // scroll ke bawah penuh
        window.scrollTo(0, document.documentElement.scrollHeight);
        const last = all[all.length - 1];
        void last;
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await0();
      function await0() {}
      return { navH, bodyPad: Math.round(bodyPad), topNavVisible: top ? getComputedStyle(top).display !== "none" : false, obscured };
    });

    // Cek apakah ada konten tertutup setelah scroll penuh.
    // Elemen di dalam bottom nav itu sendiri harus dikecualikan, kalau tidak
    // link navigasinya sendiri terhitung sebagai "tertutup".
    const overlap = await page.evaluate(() => {
      const nav = [...document.querySelectorAll("nav")].find(
        (n) => getComputedStyle(n).position === "fixed"
      );
      if (!nav) return { count: 0, sample: [] };
      const nR = nav.getBoundingClientRect();
      const items = [...document.querySelectorAll("a, button, article, h1, h2, h3")].filter(
        (e) => {
          if (nav.contains(e)) return false; // abaikan isi nav itu sendiri
          const r = e.getBoundingClientRect();
          return r.height > 0 && r.width > 0 && r.top < window.innerHeight && r.bottom > 0;
        }
      );
      const hidden = items.filter((e) => {
        const r = e.getBoundingClientRect();
        return r.bottom > nR.top + 2 && r.top < nR.bottom;
      });
      return {
        count: hidden.length,
        sample: hidden.slice(0, 3).map((e) => `${e.tagName}:${(e.textContent || "").trim().slice(0, 24)}`),
      };
    });

    console.log(
      `  ${path.padEnd(12)} tinggiNav=${r.navH}px  bodyPadBottom=${r.bodyPad}px  ` +
        `navHeaderTampil=${r.topNavVisible}  itemTertutup=${overlap.count} ` +
        `${overlap.sample.length ? JSON.stringify(overlap.sample) : ""}`
    );
    await page.close();
  }
}

await browser.close();
