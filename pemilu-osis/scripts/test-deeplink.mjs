import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 120000 });
await new Promise((r) => setTimeout(r, 500));

// Kumpulkan link + nama kandidat dari tiap card di beranda.
const cards = await page.evaluate(() => {
  const out = [];
  for (const a of document.querySelectorAll('a[href^="/candidates?paslon="]')) {
    const card = a.closest("article");
    const heading = card?.querySelector("h2")?.textContent?.trim();
    const badge = card?.querySelector("span.font-mono")?.textContent?.trim();
    out.push({ href: a.getAttribute("href"), name: heading, number: badge });
  }
  return out;
});

console.log(`  link ditemukan di beranda: ${cards.length}`);
for (const c of cards) {
  console.log(`    ${c.number} ${c.name}  ->  ${c.href}`);
}

let pass = 0;
for (const c of cards) {
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1440, height: 1000 });
  await p2.goto(`http://localhost:3000${c.href}`, { waitUntil: "networkidle2", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 700));

  const shown = await p2.evaluate(() => {
    const h2 = document.querySelector("main h2, h2");
    const pressed = [...document.querySelectorAll('button[aria-pressed="true"]')].map((b) =>
      b.textContent.trim()
    );
    const label = document.querySelector(".surface .font-medium")?.textContent?.trim();
    return { h2: h2?.textContent?.trim(), pressed, label, url: location.search };
  });

  const nameOk = shown.h2 === c.name;
  const tabOk = shown.pressed.some((t) => t.includes(c.name.split(" ")[0]));
  console.log(
    `  ${nameOk && tabOk ? "OK  " : "GAGAL"} ${c.number}: heading="${shown.h2}" tab="${shown.pressed.join("|")}" search=${shown.url}`
  );
  if (nameOk && tabOk) pass++;
  await p2.close();
}

console.log(`\n  ${pass}/${cards.length} link membuka paslon yang benar`);
await browser.close();
