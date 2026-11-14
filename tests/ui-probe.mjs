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
  await page.addInitScript(() => { addEventListener("DOMContentLoaded", () => new MutationObserver(() => { const e = document.querySelector(".site-header [data-ladeanzeige]"); if (e) sessionStorage.setItem("probe-lade", (sessionStorage.getItem("probe-lade") || "") + " " + e.getAttribute("data-ladeanzeige")); }).observe(document.documentElement, { subtree: true, childList: true, attributes: true })); });
  const fehler = [];
  page.on("pageerror", (e) => fehler.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
  page.on("dialog", (d) => d.accept());

  console.log("Start");
  await page.goto(basis);
  soll("Kopf, Navigation und Fuß stehen da", await page.locator(".site-header .main-navigation [data-nav]").count() === 6 && await page.locator(".site-footer").isVisible());
  soll("Ohne Ordner: „Kein Ordner“", (await page.locator("[data-ordner-pill]").innerText()).includes("Kein Ordner"));
  soll("Knopf „Aktualisieren“ steht oben im Kopf", await page.locator(".site-header [data-aktualisieren]").isVisible());
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

  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(basis + "#sortieren"); await page.waitForTimeout(400);
  soll("Sortieren: grüne Liste der sicheren Dateien mit Zahl", await page.locator("[data-sicherliste] [data-sicher]").count() > 0 && /\d+/.test(await page.locator("[data-sicherliste] .badge.gut").innerText()));
  { const o = await page.locator("[data-pruefliste] [data-pruef]").count(), n = await page.locator("[data-pruefliste] [data-neu-marke]").count(); soll("Prüfliste: neu hängen Gebliebenes steht markiert zuerst (oder es gibt nichts Älteres)", o === 0 || n === 0 || await page.locator("[data-pruefliste] [data-pruef]").first().locator("[data-neu-marke]").count() === 1, `${o} offen, ${n} neu`); }
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(basis + "#ordner"); await page.waitForTimeout(400);
  { const zahl = async () => Number(((await page.locator("[data-ordner-pill]").innerText()).match(/· (\d+)/) || [])[1] || 0);
    const vorher = await zahl();
    await page.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(["Stadtwerke Muster GmbH\nRechnung Nr. 77\nBetrag 50,00 EUR"], "hineingezogen-rechnung.txt", { type: "text/plain" })); dt.items.add(new File(["Notiz eins"], "hineingezogen-notiz.txt", { type: "text/plain" })); document.querySelector("[data-ablage]").dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true })); });
    await page.waitForFunction((v) => Number(((document.querySelector("[data-ordner-pill]")?.textContent || "").match(/· (\d+)/) || [])[1] || 0) === v + 2, vorher, { timeout: 15000 }).catch(() => {});
    soll("Drag and Drop fügt hinzu, der Bestand bleibt", vorher > 0 && await zahl() === vorher + 2, `${vorher} → ${await zahl()}`);
    // Texterkennung in der App (Klaus 13.11.): ein Foto mit Text wird gelesen – mit den gepinnten Sprachdaten aus src/public/vendor/.
    // Dazu „ältere Fassung“: dieselbe Notiz als „(2)“ mit anderem Inhalt wird markiert, nicht entfernt.
    const davor = await zahl();
    await page.evaluate(async () => {
      const c = document.createElement("canvas"); c.width = 1400; c.height = 600; const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = "#000"; g.font = "bold 54px Arial";
      ["Stadtwerke Musterstadt GmbH", "Rechnung Nummer 4711", "Betrag zahlbar bis 15.12.2026"].forEach((z, i) => g.fillText(z, 60, 140 + i * 130));
      const png = await new Promise((ok) => c.toBlob(ok, "image/png"));
      const dt = new DataTransfer(); dt.items.add(new File([png], "hineingezogen-foto-rechnung.png", { type: "image/png" }));
      dt.items.add(new File(["Notiz eins, jetzt mit Nachtrag"], "hineingezogen-notiz (2).txt", { type: "text/plain" }));
      document.querySelector("[data-ablage]").dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
    });
    await page.waitForFunction((v) => Number(((document.querySelector("[data-ordner-pill]")?.textContent || "").match(/· (\d+)/) || [])[1] || 0) === v + 2, davor, { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(900);
    const gespeichert = await page.evaluate(() => new Promise((ok) => { const r = indexedDB.open("DateiOrganizer1", 1); r.onsuccess = () => { const q = r.result.transaction("kv").objectStore("kv").get("zustand"); q.onsuccess = () => ok(q.result); }; r.onerror = () => ok(null); }));
    const foto = gespeichert?.dateien?.find((d) => d.name === "hineingezogen-foto-rechnung.png"), notiz = gespeichert?.dateien?.find((d) => /^hineingezogen-notiz( \(2\))?\.txt$/.test(d.name) && d.aehnlich);
    soll("Texterkennung in der App liest ein Foto mit Text", foto?.textQuelle === "ocr" && /Rechnung/i.test(foto?.volltext || ""), `${foto?.textQuelle} ${JSON.stringify((foto?.volltext || "").slice(0, 80))}`);
    soll("Ältere Fassung wird als „ähnlich“ markiert, nicht entfernt", !!notiz?.aehnlich && notiz.aehnlich.art === "fassung" && /hineingezogen-notiz/.test(notiz.aehnlich.zu) && await page.locator("[data-zahl=aehnlich]").count() === 1, JSON.stringify(notiz?.aehnlich));
    await page.goto(basis + "#finden"); await page.locator("[data-suche]").fill("hineingezogen-notiz"); await page.waitForTimeout(300);
    await page.locator("[data-datei]").first().click();
    soll("Steckbrief hat Ansehen, Teilen und Entfernen", await page.locator("[data-steckbrief] [data-original]").count() === 1 && await page.locator("[data-steckbrief] [data-teilen]").count() === 1 && await page.locator("[data-steckbrief] [data-entfernen]").count() === 1);
    await page.locator("[data-steckbrief] [data-entfernen]").click(); await page.waitForTimeout(300);
    soll("Entfernen nimmt genau diese eine Datei aus der Liste", await zahl() === vorher + 3, `${await zahl()}`);
    await page.locator("[data-suche]").fill("hineingezogen"); await page.waitForTimeout(300);
    await page.locator("[data-entfernen-liste]").click(); await page.waitForTimeout(300);
    soll("„Entfernen“ über der Liste nimmt alle Treffer heraus", await zahl() === vorher, `${await zahl()}`);
  }
  // ---------- Landkarte und Dashboard (Klaus 13.11.): Kästen sind Links, an jeder Datei Auge, Stift, Papierkorb ----------
  {
    await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(basis + "#ordner"); await page.waitForTimeout(300);
    await page.locator("[data-landkarte-knopf]").click(); await page.waitForTimeout(300);
    const gesamt = Number(await page.locator("[data-kachel=gesamt] b").innerText());
    soll("Landkarten-Knopf im Kopf öffnet das Dashboard mit allen Dateien", gesamt > 0 && await page.locator("[data-kachel]").count() === 6, String(gesamt));
    await page.locator("[data-kachel=offen]").click(); await page.waitForTimeout(200);
    soll("Kasten „von dir zu entscheiden“ führt zum Prüfen", (await page.evaluate(() => location.hash)) === "#sortieren");
    await page.goto(basis + "#landkarte"); await page.waitForTimeout(300);
    const bereich = page.locator("[data-bereich]").first(), name = await bereich.getAttribute("data-bereich"), n = Number(await bereich.locator(".n").innerText());
    await bereich.click(); await page.waitForTimeout(400);
    const titel = await page.locator("[data-liste] .card-heading h2").innerText(), inListe = Number(await page.locator("[data-liste] .card-heading .badge").innerText());
    soll("Bereich im Dashboard führt in genau diesen Ordner im Baum", (await page.evaluate(() => location.hash)) === "#finden" && titel === name && inListe === n, `${name} ${n} / ${titel} ${inListe}`);
    const eintrag = page.locator("[data-liste] .datei-eintrag").first();
    soll("Jede Datei in der Liste hat Auge, Stift und Papierkorb", await eintrag.locator("[data-auge]").count() === 1 && await eintrag.locator("[data-stift]").count() === 1 && await eintrag.locator("[data-papierkorb]").count() === 1);
    await eintrag.locator("[data-stift]").click();
    const wahl = eintrag.locator("[data-feld-aendern] [data-wert]");
    const neu = await wahl.evaluate((e, alt) => [...e.options].map((o) => o.value).find((v) => v && v !== alt), name);
    await wahl.selectOption(neu); await eintrag.locator("[data-feld-aendern] [data-uebernehmen]").click(); await page.waitForTimeout(400);
    soll("Stift: Bereich einer schon eingeordneten Datei von Hand ändern – sie verlässt diesen Ordner", Number(await page.locator("[data-liste] .card-heading .badge").innerText()) === n - 1, `${neu}`);
    await page.locator("[data-nav=verlauf]").click(); await page.waitForTimeout(200);
    soll("… und die Änderung steht im Verlauf", (await page.locator("main").innerText()).includes(neu));
    await page.goto(basis + "#landkarte"); await page.waitForTimeout(300);
    await page.locator("[data-kachel=sicher]").click(); await page.waitForTimeout(400);
    const vorP = Number(await page.locator("[data-liste] .card-heading .badge").innerText());
    soll("Kasten „eingeordnet – nachprüfen“ zeigt die eingeordneten Dateien", (await page.locator("[data-liste] .card-heading h2").innerText()) === "In Ordnung" && vorP > 0);
    await page.locator("[data-liste] .datei-eintrag").first().locator("[data-papierkorb]").click(); await page.waitForTimeout(400);
    soll("Papierkorb nimmt die Datei aus dem Organizer", Number(await page.locator("[data-liste] .card-heading .badge").innerText()) === vorP - 1);
    await page.goto(basis + "#landkarte"); await page.waitForTimeout(300);
    await page.locator("[data-reiter=organizer]").click();
    const rahmen = page.frameLocator("[data-karte=organizer]");
    await rahmen.locator(".kasten").first().waitFor({ timeout: 10000 }).catch(() => {});
    soll("Landkarte Organizer im Rahmen: Kästen da, eigener Titel und Reiter ausgeblendet", await rahmen.locator(".kasten").count() > 10 && !(await rahmen.locator(".kopf").isVisible()));
    await rahmen.locator("#o_index").click();
    soll("Kasten antippen zeigt, woher und wohin", /Kommt von:[\s\S]*Geht zu:/.test(await rahmen.locator("#tafel").innerText()));
    await page.locator("[data-reiter=familienakte]").click();
    await page.frameLocator("[data-karte=familienakte]").locator("#f_tresor").waitFor({ timeout: 10000 }).catch(() => {});
    soll("Landkarte Familienakte im Rahmen", await page.frameLocator("[data-karte=familienakte]").locator("#f_tresor").count() === 1);
  }
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(basis + "#akte"); await page.waitForTimeout(300);
  soll("Kein Update-Fähnchen, solange die Fassung aktuell ist", await page.locator("[data-update-fahne]").count() === 0);
  { const v = JSON.parse(await (await page.request.get(basis + "version.json")).text()); const kopf = await page.locator(".site-brand small").innerText(); soll("version.json nennt dieselbe Fassung wie der Kopf", kopf.includes("Fassung " + v.fassung), `${v.fassung} / ${kopf}`); }
  await page.route("**/version.json*", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ fassung: "9.9.9" }) }));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.waitForSelector("[data-update-fahne]", { timeout: 5000 }).catch(() => {});
  soll("Neue Fassung auf dem Server: Fähnchen „Update 9.9.9“ erscheint von selbst neben der Fassung", ((await page.locator("[data-update-fahne]").innerText().catch(() => "")) || "").includes("9.9.9"));
  await page.unroute("**/version.json*");
  if (await page.locator("[data-leeren-knopf]").count()) {
    await page.locator("[data-leeren-knopf]").click();
    await page.waitForFunction(() => document.querySelector("[data-ordner-pill]")?.textContent?.includes("Kein Ordner"), null, { timeout: 5000 }).catch(() => {});
    soll("„Organizer leeren“: Liste leer, Meldung nennt die unveränderten Originale", (await page.locator("[data-ordner-pill]").innerText()).includes("Kein Ordner") && /Originale und der Ordner sind unverändert/.test(await page.locator("[data-ordner-wahl]").innerText()));
    await page.waitForTimeout(600); await page.reload();
    await page.waitForTimeout(600);
    { const t = await page.locator("[data-ordner-pill]").innerText(); soll("… und bleibt nach dem Neuladen leer", t.includes("Kein Ordner"), t); }
  } else soll("Knopf „Organizer leeren“ steht auf der Seite Familienakte", false);
  { const l = (await page.evaluate(() => sessionStorage.getItem("probe-lade") || "")).split(" "); soll("Ladebalken im Kopf lief beim Einlesen (durchsehen, dann Datei für Datei)", l.includes("suchen") && l.includes("lesen"), JSON.stringify([...new Set(l)])); }
  soll("Web-App heißt „Datei-Organizer Basic“ (Kopf, Seitentitel), ohne Fassungs-Knopf der App", (await page.locator("[data-app-name]").innerText()) === "Datei-Organizer Basic" && (await page.title()) === "Datei-Organizer Basic" && await page.locator("[data-fassung-knopf]").count() === 0);
  // Datei-Organizer Pro (Android-App) gestellt: Capacitor-Brücke mit Update-Plugin DoUpdates. Kein echtes Android, kein echter Server.
  {
    const nctx = await browser.newContext({ viewport: { width: 400, height: 800 } });
    await nctx.addInitScript(() => {
      const aufrufe = (window.__updAufrufe = []);
      const stand = (window.__updStand = { neu: "9.9.9", fehler: "" });
      window.Capacitor = { isNativePlatform: () => true, Plugins: { DoUpdates: {
        pruefen: async () => { aufrufe.push("pruefen"); if (stand.fehler) throw Object.assign(new Error(stand.fehler), { code: stand.fehler }); return stand.neu ? { neu: stand.neu, installiert: "0.4.0", groesse: 1000 } : { aktuell: true, version: "0.4.0", installiert: "0.4.0" }; },
        installieren: async () => { aufrufe.push("installieren"); return { gestartet: true }; },
        addListener: async (_n, f) => { setTimeout(() => f({ geladen: 500, groesse: 1000 })); return { remove: async () => {} }; },
      } } };
    });
    const np = await nctx.newPage();
    const nfehler = []; np.on("pageerror", (e) => nfehler.push(String(e)));
    await np.goto(basis + "#hilfe");
    soll("App heißt „Datei-Organizer Pro“ (Kopf, Seitentitel, Fuß)", (await np.locator("[data-app-name]").innerText()) === "Datei-Organizer Pro" && (await np.title()) === "Datei-Organizer Pro" && (await np.locator(".footer-meta").innerText()).includes("Datei-Organizer Pro"));
    soll("App: kein Service Worker angemeldet", await np.evaluate(async () => !(await navigator.serviceWorker?.getRegistration())));
    await np.waitForSelector("[data-update-fahne][data-nativ]", { timeout: 6000 }).catch(() => {});
    soll("App: still geprüft, Fähnchen „Update 9.9.9“ erscheint von selbst", ((await np.locator("[data-update-fahne]").innerText().catch(() => "")) || "").includes("9.9.9"));
    soll("App: version.json wird nicht gefragt (nur der eigene Update-Server)", !(await np.evaluate(() => performance.getEntriesByType("resource").some((e) => e.name.includes("version.json")))));
    await np.evaluate(() => { window.__updAufrufe.length = 0; });
    await np.locator("[data-update-fahne]").click(); await np.waitForTimeout(300);
    soll("App: Tipp auf das Fähnchen prüft und installiert direkt", JSON.stringify(await np.evaluate(() => window.__updAufrufe)) === JSON.stringify(["pruefen", "installieren"]));
    await np.evaluate(() => { window.__updStand.neu = ""; window.__updAufrufe.length = 0; });
    await np.locator("[data-fassung-knopf]").click();
    await np.waitForSelector("[data-update-meldung]", { timeout: 3000 }).catch(() => {});
    soll("App: Tipp auf die Fassung, aktuell → kurze Meldung, nichts installiert", ((await np.locator("[data-update-meldung]").innerText().catch(() => "")) || "").includes("Aktuelle Fassung 0.4.0") && !(await np.evaluate(() => window.__updAufrufe.includes("installieren"))));
    await np.evaluate(() => { window.__updStand.fehler = "UPDATE_NICHT_EINGERICHTET"; });
    await np.waitForTimeout(4800);
    await np.locator("[data-fassung-knopf]").click();
    await np.waitForSelector("[data-update-meldung]", { timeout: 3000 }).catch(() => {});
    soll("App ohne Update-Schlüssel: Tipp sagt „noch nicht eingerichtet“", ((await np.locator("[data-update-meldung]").innerText().catch(() => "")) || "").includes("noch nicht eingerichtet"));
    soll("App: keine Fehler in der Seite", nfehler.length === 0, nfehler.slice(0, 3).join(" | "));
    await nctx.close();
  }
  // Datei-Organizer Pro für Windows gestellt (0.4.1): Ordner am PC mit dauerhafter Freigabe, „Öffnen mit“, „Speichern unter“.
  // Die Brücke ist erfunden (Ordner im Speicher), keine echte Hülle – die echte prüft windows.yml installiert.
  {
    const wctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    await wctx.addInitScript(() => {
      const b64 = (t) => btoa(String.fromCharCode(...new TextEncoder().encode(t)));
      const ordner = { "Strom 2026.txt": "Stadtwerke Musterstadt\nAbschlag Strom Januar 2026", "Bank/Auszug 01.txt": "Musterbank eG\nKontoauszug 1/2026" };
      const log = (window.__winLog = JSON.parse(sessionStorage.getItem("winLog") || "[]"));
      const merk = () => sessionStorage.setItem("winLog", JSON.stringify(log));
      const eingang = (window.__eingang = { stapel: [], hoerer: [] });
      const gespeichert = (window.__gespeichert = []);
      const liste = (pfad) => { const aus = new Map(); for (const [p, t] of Object.entries(ordner)) { if (pfad && !p.startsWith(pfad + "/")) continue; const rest = pfad ? p.slice(pfad.length + 1) : p; const [kopf, ...weiter] = rest.split("/"); aus.set(kopf, weiter.length ? { name: kopf, art: "ordner", groesse: 0 } : { name: kopf, art: "datei", groesse: new TextEncoder().encode(t).length, geaendert: 1767225600000 }); } return [...aus.values()]; };
      window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "windows", Plugins: {
        FamilyFolders: {
          ordnerWaehlen: async () => { log.push("waehlen"); merk(); sessionStorage.setItem("winGemerkt", "1"); return { token: "t1", name: "Probeordner", id: "g1" }; },
          gemerkt: async () => ({ ordner: sessionStorage.getItem("winGemerkt") ? [{ id: "g1", name: "Probeordner", da: true }] : [] }),
          wiederOeffnen: async ({ id }) => { log.push("wieder:" + id); merk(); return { token: "t2", name: "Probeordner" }; },
          vergessen: async () => { sessionStorage.removeItem("winGemerkt"); return {}; },
          ordnerListe: async ({ pfad }) => ({ eintraege: liste(pfad) }),
          dateiLesen: async ({ pfad, offset, laenge }) => ({ data: b64(ordner[pfad].slice(offset, offset + laenge)) }),
          dateiBeginn: async () => { throw Object.assign(new Error("DO_NICHT_ERLAUBT"), { code: "DO_NICHT_ERLAUBT" }); },
        },
        DoEingang: {
          abholen: async () => { const s = eingang.stapel.shift(); return s ? { stapel: "1-abcdef12.abgeholt", dateien: s.map(([name, t]) => ({ name, groesse: new TextEncoder().encode(t).length })), weitere: eingang.stapel.length } : { stapel: "", dateien: [] }; },
          lesen: async ({ name, offset, laenge }) => ({ data: b64((window.__eingangText[name] || "").slice(offset, offset + laenge)) }),
          addListener: async (_n, f) => { eingang.hoerer.push(f); return { remove: () => {} }; },
        },
        DoDateien: { speichern: async (a) => { gespeichert.push(a); return { gespeichert: true }; } },
        DoUpdates: { pruefen: async () => { throw Object.assign(new Error("UPDATE_NICHT_EINGERICHTET"), { code: "UPDATE_NICHT_EINGERICHTET" }); }, installieren: async () => ({}) },
      } };
      window.__eingangText = {};
    });
    const wp = await wctx.newPage();
    const wfehler = []; wp.on("pageerror", (e) => wfehler.push(String(e)));
    await wp.goto(basis + "#ordner");
    await wp.waitForSelector("[data-nativ-ordner]", { timeout: 8000 }).catch(() => {});
    soll("Windows-App: Knopf heißt „Ordner am PC“, kein zweiter Browser-Ordnerknopf", (await wp.locator("[data-nativ-ordner]").innerText().catch(() => "")).includes("Ordner am PC") && await wp.locator("[data-pc-ordner]").count() === 0);
    await wp.locator("[data-nativ-ordner]").click();
    await wp.waitForFunction(() => /^2 /.test(document.querySelector('[data-zahl="gesamt"]')?.textContent || ""), null, { timeout: 20000 }).catch(() => {});
    soll("Windows-App: Ordner mit Unterordner eingelesen (2 Dateien)", ((await wp.locator('[data-zahl="gesamt"]').innerText().catch(() => "")) || "").startsWith("2 "));
    await wp.waitForSelector("[data-ordner-wieder]", { timeout: 5000 }).catch(() => {});
    soll("Gemerkter Ordner steht unter „Zuletzt“", ((await wp.locator("[data-ordner-wieder]").innerText().catch(() => "")) || "").includes("Probeordner"));
    await wp.evaluate(() => { location.hash = "akte"; });
    await wp.waitForSelector("[data-index-sichern]", { timeout: 5000 }).catch(() => {});
    soll("Ordner der App: der Index wird in den Ordner geschrieben (Knopf „In den Ordner schreiben“)", ((await wp.locator("[data-index-sichern]").innerText().catch(() => "")) || "").includes("In den Ordner schreiben"));
    // Neu laden wie nach einem Neustart: der gemerkte Ordner öffnet ohne Auswahl-Fenster.
    await wp.waitForTimeout(600); await wp.goto(basis + "#ordner"); await wp.reload();
    await wp.waitForSelector("[data-ordner-wieder]", { timeout: 8000 }).catch(() => {});
    await wp.locator("[data-ordner-wieder]").first().click().catch(() => {});
    await wp.waitForTimeout(800);
    soll("Nach Neustart: ein Tipp auf „Zuletzt“ öffnet den Ordner ohne Auswahl-Fenster", JSON.stringify(await wp.evaluate(() => JSON.parse(sessionStorage.getItem("winLog") || "[]"))) === JSON.stringify(["waehlen", "wieder:g1"]));
    // „Öffnen mit“: die App meldet „neu“, die Seite holt den Stapel und nimmt ihn zum Bestand dazu.
    await wp.evaluate(() => { window.__eingangText["Brief-Öffnen-mit.txt"] = "Muster Versicherung AG\nBeitragsrechnung 2026"; window.__eingang.stapel.push([["Brief-Öffnen-mit.txt", window.__eingangText["Brief-Öffnen-mit.txt"]]]); window.__eingang.hoerer.forEach((f) => f({ neu: 1 })); });
    await wp.waitForFunction(() => /^3 /.test(document.querySelector('[data-zahl="gesamt"]')?.textContent || ""), null, { timeout: 15000 }).catch(() => {});
    soll("„Öffnen mit“/Teilen: Datei kommt zum Bestand dazu (2 → 3)", ((await wp.locator('[data-zahl="gesamt"]').innerText().catch(() => "")) || "").startsWith("3 "));
    soll("Windows-App: keine Fehler in der Seite", wfehler.length === 0, wfehler.slice(0, 3).join(" | "));
    await wctx.close();
    // Nur geteilte Dateien, kein Ordner: der Index geht über „Speichern unter …“ der App, nie über einen Download.
    const actx = await browser.newContext({ viewport: { width: 400, height: 800 } });
    await actx.addInitScript(() => {
      const b64 = (t) => btoa(String.fromCharCode(...new TextEncoder().encode(t)));
      const text = "Stadtwerke Musterstadt\nAbschlag Strom 2026";
      let einmal = true;
      window.__gespeichert = [];
      window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "android", Plugins: {
        FamilyFolders: { ordnerWaehlen: async () => ({ cancelled: true }), gemerkt: async () => ({ ordner: [] }) },
        DoEingang: { abholen: async () => { if (!einmal) return { stapel: "", dateien: [] }; einmal = false; return { stapel: "1-abcdef12.abgeholt", dateien: [{ name: "Geteilt.txt", groesse: new TextEncoder().encode(text).length }] }; },
          lesen: async ({ offset, laenge }) => ({ data: b64(text.slice(offset, offset + laenge)) }) },
        DoDateien: { speichern: async (a) => { window.__gespeichert.push(a); return { gespeichert: true }; } },
      } };
    });
    const ap = await actx.newPage();
    const afehler = []; ap.on("pageerror", (e) => afehler.push(String(e)));
    await ap.goto(basis + "#ordner");
    await ap.waitForFunction(() => /^1 /.test(document.querySelector('[data-zahl="gesamt"]')?.textContent || ""), null, { timeout: 15000 }).catch(() => {});
    soll("Android-App: geteilte Datei kommt beim Start an (Teilen an die App)", ((await ap.locator('[data-zahl="gesamt"]').innerText().catch(() => "")) || "").startsWith("1 "));
    await ap.evaluate(() => { location.hash = "akte"; });
    await ap.waitForSelector("[data-index-sichern]", { timeout: 5000 }).catch(() => {});
    soll("Ohne Ordner heißt der Knopf „Speichern unter …“", ((await ap.locator("[data-index-sichern]").innerText().catch(() => "")) || "").includes("Speichern unter"));
    let download = false; ap.on("download", () => { download = true; });
    await ap.locator("[data-index-sichern]").click().catch(() => {});
    await ap.waitForTimeout(500);
    const g = await ap.evaluate(() => window.__gespeichert);
    soll("„Speichern unter …“: organizer-index.json als JSON an die App, kein Download", g.length === 1 && g[0].name === "organizer-index.json" && g[0].mime === "application/json" && atob(g[0].data).includes("Geteilt.txt") && !download);
    soll("Android-App: keine Fehler in der Seite", afehler.length === 0, afehler.slice(0, 3).join(" | "));
    await actx.close();
  }
  soll("Keine Fehler in der Konsole", fehler.length === 0, fehler.slice(0, 3).join(" | "));
} finally {
  await browser.close(); server.close();
}
console.log(`UI: ${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
