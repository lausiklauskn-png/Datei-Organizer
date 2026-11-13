// Oberflächen-Probe: echter Browser gegen die gebaute App (app/) mit dem erfundenen Testordner.
// Aufruf: npm run build && node tests/ui-probe.mjs
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
// Playwright liegt global (Behälter) oder als Entwicklungs-Abhängigkeit (CI).
const { chromium } = createRequire(import.meta.url)("playwright");
import { indexLesen } from "../lib/index-format.ts";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const TYP = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json" };
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
    if (p.includes("..")) throw new Error("nein");
    let f = join(WURZEL, p);
    if ((await stat(f)).isDirectory()) f = join(f, "index.html");
    res.writeHead(200, { "content-type": TYP[extname(f)] || "application/octet-stream" });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end("fehlt"); }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const basis = `http://127.0.0.1:${server.address().port}/app/`;

let gruen = 0, rot = 0;
const soll = (name, bed, mehr = "") => { if (bed) { gruen++; console.log(`  ✓ ${name}`); } else { rot++; console.log(`  ✗ ROT: ${name}${mehr ? ` – ${mehr}` : ""}`); } };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const fehler = [];
  page.on("pageerror", (e) => fehler.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
  page.on("dialog", (d) => d.accept());

  console.log("Start");
  await page.goto(basis);
  soll("Kopf, Navigation und Fuß stehen da", await page.locator(".site-header .main-navigation [data-nav]").count() === 6 && await page.locator(".site-footer").isVisible());
  soll("Ohne Ordner: „Kein Ordner“", (await page.locator("[data-ordner-pill]").innerText()).includes("Kein Ordner"));
  await page.locator(".page-title .info-knopf").click();
  soll("Fragezeichen öffnet den Hinweis mit dem SD-Baum", await page.locator("[data-info-fenster]").isVisible() && (await page.locator("[data-info-fenster]").innerText()).includes("Datei-Organizer"));
  await page.keyboard.press("Escape");
  soll("Esc schließt den Hinweis", await page.locator("[data-info-fenster]").count() === 0);

  console.log("Installierbar (PWA)");
  const man = await (await fetch(basis + "manifest.webmanifest")).json();
  soll("Manifest mit Symbolen 192 und 512", ["192x192", "512x512"].every((g) => man.icons?.some((i) => i.sizes === g && i.type === "image/png")) && man.display === "standalone");
  const sw = await page.evaluate(() => navigator.serviceWorker.ready.then((r) => !!r.active).catch(() => false));
  soll("Offline-Vorrat (Service Worker) aktiv", sw);
  await page.reload(); await page.waitForTimeout(500);
  await ctx.setOffline(true);
  await page.reload();
  soll("Startet ohne Netz", await page.locator(".site-header .main-navigation").isVisible().catch(() => false));
  await ctx.setOffline(false);
  await page.reload();

  console.log("Testordner einlesen");
  await page.locator("[data-testordner]").click();
  await page.waitForFunction(() => /Dateien im Eingang/.test(document.querySelector("[data-meldung]")?.textContent || ""), null, { timeout: 120000 });
  const meldung = await page.locator("[data-meldung]").innerText();
  const gesamt = Number(meldung.match(/(\d+) Dateien im Eingang/)?.[1]);
  soll("Alle Testdateien (mit Mail-Anhängen) im Eingang", gesamt >= 101, meldung);
  soll("Sieb 1 meldet 3 gesperrte und 3 doppelte (eine als Mail-Anhang)", /3 auffällig, 3 doppelt/.test(meldung), meldung);
  soll("Kopf nennt den Ordner", (await page.locator("[data-ordner-pill]").innerText()).includes("Testordner"));

  console.log("Sortieren");
  await page.locator("[data-nav=sortieren]").click();
  await page.locator("[data-naechstes]").click();
  soll("„Nächstes Sieb“ geht einen Schritt", (await page.locator("[data-siebe] [aria-current=step]").innerText()).includes("Kopf"));
  await page.locator("[data-zurueck]").click();
  soll("„Sieb zurück“ geht zurück", (await page.locator("[data-siebe] [aria-current=step]").innerText()).includes("Art"));
  let runden = 0, bestaetigt = 0, geaendert = 0;
  while (runden++ < 200) {
    if (await page.locator("[data-durchsieben]").isEnabled()) await page.locator("[data-durchsieben]").click();
    const zeilen = page.locator("[data-pruef]");
    if (await zeilen.count() === 0) { if (!(await page.locator("[data-durchsieben]").isEnabled())) break; continue; }
    const z = zeilen.first();
    if (geaendert < 2) {
      await z.locator("[data-korrigieren]").click();
      const w = z.locator("[data-wert]");
      if (await w.evaluate((e) => e.tagName) === "SELECT") await w.selectOption({ index: 2 }); else await w.fill("Test-Wert");
      await z.locator("[data-uebernehmen]").click(); geaendert++;
    } else if (await z.locator("[data-stimmt]").count()) { await z.locator("[data-stimmt]").click(); bestaetigt++; }
    else { await z.locator("[data-korrigieren]").click(); const w = z.locator("[data-wert]"); if (await w.evaluate((e) => e.tagName) === "SELECT") await w.selectOption({ index: 1 }); else await w.fill("2026-11-01"); await z.locator("[data-uebernehmen]").click(); geaendert++; }
  }
  soll("Ganz durchgesiebt, nichts mehr zu prüfen", await page.locator("[data-nichts-offen]").count() === 1 && !(await page.locator("[data-durchsieben]").isEnabled()), `Runden ${runden}`);
  console.log(`    (${bestaetigt} bestätigt, ${geaendert} geändert)`);
  soll("Zähler in der Navigation ist weg", await page.locator("[data-nav=sortieren] .zahl").count() === 0);

  console.log("Verlauf");
  await page.locator("[data-nav=verlauf]").click();
  const korr = await page.locator("[data-verlauf] li").count();
  soll("Verlauf zeigt alle Korrekturen", korr === bestaetigt + geaendert, `${korr} statt ${bestaetigt + geaendert}`);
  await page.locator("[data-rueckgaengig]").first().click();
  soll("Rückgängig nimmt eine zurück", await page.locator("[data-verlauf] li").count() === korr - 1);
  await page.locator("[data-nav=sortieren]").click();
  soll("… und die Datei ist wieder zu prüfen", await page.locator("[data-pruef]").count() >= 1);
  while (await page.locator("[data-pruef]").count()) {
    const z = page.locator("[data-pruef]").first();
    if (await z.locator("[data-stimmt]").count()) await z.locator("[data-stimmt]").click();
    else { await z.locator("[data-korrigieren]").click(); const w = z.locator("[data-wert]"); if (await w.evaluate((e) => e.tagName) === "SELECT") await w.selectOption({ index: 1 }); else await w.fill("Test"); await z.locator("[data-uebernehmen]").click(); }
  }

  console.log("Finden");
  await page.locator("[data-nav=finden]").click();
  const sichten = await page.locator("[data-sicht] option").count();
  soll("Alle Sichten wählbar (nach Sieb 5)", sichten === 9, `${sichten}`);
  soll("Baum zeigt „Alle Dateien“ mit Zahl", (await page.locator("[data-ordnerbaum] [data-ast='Alle Dateien'] .zahl").innerText()) === String(gesamt));
  soll("Gesperrte stehen oben im Baum", (await page.locator("[data-ordnerbaum] > li > ul > li").first().innerText()).includes("Auffällig"));
  await page.locator("[data-sicht]").selectOption("absender");
  await page.locator("[data-ordnerbaum] > li > ul > li > .ast").nth(1).click();
  const n = await page.locator("[data-liste] [data-datei]").count();
  soll("Klick auf einen Ordner zeigt seine Dateien", n >= 1);
  await page.locator("[data-liste] [data-datei]").first().click();
  soll("Steckbrief öffnet sich", await page.locator("[data-steckbrief]").isVisible());
  await page.locator("[data-suche]").fill("BSP-FA 12");
  await page.waitForTimeout(100);
  soll("Suche findet das Kennzeichen", await page.locator("[data-liste] [data-datei]").count() >= 1);
  await page.locator("[data-suche]").fill("");
  await page.locator("[data-sicht]").selectOption("art");
  await page.locator("[data-ordnerbaum] [data-ast='Bild']").first().click();
  await page.locator("[data-liste] [data-datei]").first().click();
  await page.locator("[data-original]").click();
  soll("Original eines Fotos wird angezeigt", await page.locator(".vorschau-bild").waitFor({ timeout: 5000 }).then(() => true, () => false));

  console.log("Familienakte");
  await page.locator("[data-nav=akte]").click();
  const bereit = Number((await page.locator("[data-bereit]").innerText()).match(/\d+/)[0]);
  soll("Dateien sind bereit für Archivnummern", bereit > 50, `${bereit}`);
  await page.locator("[data-nummern-vergeben]").click();
  soll("Nummern vergeben", (await page.locator("[data-meldung]").first().innerText()).includes(`${bereit} Archivnummern`));
  soll("Danach keine mehr bereit", await page.locator("[data-nummern-vergeben]").isDisabled());
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("[data-index-sichern]").click()]);
  const text = await (await import("node:fs/promises")).readFile(await dl.path(), "utf8");
  const r = indexLesen(text);
  soll("organizer-index.json ist gültig", r.ok, r.ok ? "" : r.grund);
  if (r.ok) {
    soll("Index enthält alle Dateien", r.index.dateien.length === gesamt, `${r.index.dateien.length}`);
    const nr = r.index.dateien.filter((d) => d.archivnummer).map((d) => d.archivnummer).sort();
    soll("Archivnummern lückenlos ab 0001", nr.length === bereit && nr[0].endsWith("-0001") && nr.at(-1).endsWith(`-${String(bereit).padStart(4, "0")}`));
    soll("Gesperrte haben keine Nummer", r.index.dateien.filter((d) => /Gesperrt|Doppelt/.test(d.kurzfassung)).every((d) => !d.archivnummer));
    soll("Steckbriefe tragen Text und Abschnitte", r.index.dateien.some((d) => d.text && d.abschnitte?.length));
    soll("Index trägt Verlauf und Regeln", Array.isArray(r.index.verlauf) && r.index.verlauf.length > 0 && Array.isArray(r.index.lernregeln));
  }

  console.log("Gemerkt nach Neuladen");
  await page.waitForTimeout(800);
  await page.reload();
  // Der Bestand kommt nach dem Neuladen erst aus dem Gerätespeicher: auf die Anzeige warten (Bedingung, keine feste Zeit),
  // dann prüfen. Vorher las die Probe sofort und war in der CI rot, sobald das Laden etwas länger brauchte.
  await page.waitForFunction((n) => (document.querySelector("[data-ordner-pill]")?.textContent || "").includes(String(n)), gesamt, { timeout: 15000 }).catch(() => {});
  soll("Ordner und Dateien bleiben nach Neuladen", (await page.locator("[data-ordner-pill]").innerText()).includes(String(gesamt)));
  await page.goto(basis + "#akte");
  soll("Archivnummern bleiben", (await page.locator("[data-archivnummern] .chip").first().innerText()).startsWith(String(bereit)));

  console.log("Handy (360 px)");
  for (const s of ["ordner", "sortieren", "finden", "verlauf", "akte", "hilfe"]) {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(basis + "#" + s);
    await page.waitForTimeout(150);
    const breit = await page.evaluate(() => document.documentElement.scrollWidth);
    const zuBreit = breit > 361 ? await page.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > 362).slice(-3).map((e) => `${e.tagName}.${e.className}`).join(", ")) : "";
    soll(`${s}: kein seitliches Scrollen`, breit <= 361, `${breit}px ${zuBreit}`);
  }
  await page.goto(basis + "datenschutz.html");
  soll("Impressum & Datenschutz erreichbar", (await page.locator("h1").innerText()).includes("Impressum"));

  soll("Keine Fehler in der Konsole", fehler.length === 0, fehler.slice(0, 3).join(" | "));
} finally {
  await browser.close(); server.close();
}
console.log(`UI: ${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
