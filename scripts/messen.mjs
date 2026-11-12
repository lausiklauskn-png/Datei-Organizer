// Messung an einem Testordner mit ERWARTUNG.json: Organizer-Kern (alle Felder, Personen über HAUSHALTE.json),
// daneben der heutige Eingang der Familienakte und die Belegerkennung von BookLedgerPro (Beträge auf Kassenbons).
// Fotos und Belege werden per Texterkennung gelesen (tesseract.js mit den deutschen Sprachdaten der Familienakte),
// Ergebnisse im Ordner unter .ocr-cache.json zwischengespeichert.
// Aufruf: node scripts/messen.mjs <ordner> [--fa ../Meine-Familienakte] [--blp ../lausiklauskn-png/bookledgerpro] [--json datei] [--chaos]
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { einlesen, doppelteMarkieren, ueberspringen } from "../lib/einlesen.ts";
import { gehaltLesen } from "../lib/gehalt.ts";
import { siebe } from "../lib/siebe.ts";
import { absenderVereinheitlichen } from "../lib/abgleich.ts";
import { pdfTextLesen } from "../lib/pdf-text.ts";
import { personZuordnen } from "../lib/personen.ts";
import { sha256Hex } from "../lib/dateiart.ts";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const arg = (n, v) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : v; };
const ORDNER = resolve(WURZEL, process.argv[2] || "testdaten-haushalte");
const FA = resolve(WURZEL, arg("--fa", "../Meine-Familienakte"));
const BLP = resolve(WURZEL, arg("--blp", "../lausiklauskn-png/bookledgerpro"));
const STILL = process.argv.includes("--still");

// ---------- Leser ----------
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href;
// Ein gemeinsamer Zwischenspeicher für alle Testordner (Schlüssel = Fingerabdruck der Datei)
const cacheDatei = join(WURZEL, ".ocr-cache.json");
const cache = existsSync(cacheDatei) ? JSON.parse(readFileSync(cacheDatei, "utf8")) : {};
for (const alt of [join(ORDNER, ".ocr-cache.json")]) if (existsSync(alt)) Object.assign(cache, JSON.parse(readFileSync(alt, "utf8")));
let worker = null;
const LANG = join(FA, "public/apps/workflow-pdf/vendor/tesseract/lang");
async function ocr(bytes) {
  const k = await sha256Hex(bytes);
  if (k in cache) return cache[k];
  if (!worker) {
    if (!existsSync(join(LANG, "deu.traineddata"))) return "";
    const { createWorker } = await import("tesseract.js");
    worker = await createWorker("deu", 1, { langPath: LANG, gzip: false, cachePath: join(ORDNER, ".tess") });
  }
  const t = (await worker.recognize(Buffer.from(bytes))).data.text;
  cache[k] = t;
  return t;
}

// ---------- Einlesen und sieben ----------
let uebersprungen = 0;
async function lesen(ordner) {
  const liste = JSON.parse(readFileSync(join(ordner, "dateien.json"), "utf8"));
  let ds = [];
  for (const [i, pfad] of liste.entries()) {
    if (ueberspringen(pfad.split("/").pop())) { if (ordner === ORDNER) uebersprungen++; continue; }
    const bytes = new Uint8Array(readFileSync(join(ordner, pfad)));
    ds.push(...await einlesen({ pfad, name: pfad.split("/").pop(), geaendert: Date.UTC(2026, 10, 1) + i, bytes }, (b) => pdfTextLesen(pdfjs, b), 0, ocr));
  }
  return doppelteMarkieren(ds);
}
const soll = JSON.parse(readFileSync(join(ORDNER, "ERWARTUNG.json"), "utf8")).dateien;
const hh = existsSync(join(ORDNER, "HAUSHALTE.json")) ? Object.fromEntries(JSON.parse(readFileSync(join(ORDNER, "HAUSHALTE.json"), "utf8")).haushalte.map((h) => [h.id, h])) : {};
let dateien = await lesen(ORDNER);

// ---------- Nutzer-Simulation: aus einem anderen Stapel lernen (sorgfältig oder „neben der Spur“) ----------
let regeln = existsSync(join(ORDNER, "REGELN.json")) ? JSON.parse(readFileSync(join(ORDNER, "REGELN.json"), "utf8")) : [];
const LERN = arg("--lernen-aus"), NUTZER = arg("--nutzer", "sorgfaeltig");
const nutzerBericht = { profil: LERN ? NUTZER : "kein Lernen", antworten: 0, falscheAntworten: 0 };
if (LERN) {
  const { lernen } = await import("../lib/lernen.ts");
  const { KATEGORIEN, FOTOS, UNKLAR } = await import("../lib/kategorien.ts");
  const { SCHRIFTSTUECKE } = await import("../lib/erkennen.ts");
  const lo = resolve(WURZEL, LERN);
  const lsoll = new Map(JSON.parse(readFileSync(join(lo, "ERWARTUNG.json"), "utf8")).dateien.map((e) => [e.pfad, e]));
  let z = 7; const r = () => (z = (z * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (const d0 of await lesen(lo)) {
    const e = lsoll.get(d0.pfad); if (!e || e.doppelt || e.leer) continue;
    const d = siebe(d0, 5, regeln);
    for (const feld of ["kategorie", "schriftstueck"]) {
      const wahr = e[feld], w = d.felder[feld];
      if (!wahr || !w) continue;
      let antwort = null;
      if (NUTZER === "sorgfaeltig") { if (!w.sicher) antwort = wahr; }
      else { // chaotisch: drückt meist „Stimmt“, wählt manchmal irgendetwas, verstellt auch Sicheres
        const x = r();
        if (!w.sicher) antwort = x < 0.5 ? w.wert : x < 0.7 ? (feld === "kategorie" ? [...KATEGORIEN, FOTOS, UNKLAR] : SCHRIFTSTUECKE)[Math.floor(r() * 15)] : wahr;
        else if (x < 0.05) antwort = (feld === "kategorie" ? KATEGORIEN : SCHRIFTSTUECKE)[Math.floor(r() * 12)];
      }
      if (antwort == null) continue;
      nutzerBericht.antworten++; if (antwort !== wahr) nutzerBericht.falscheAntworten++;
      regeln = lernen(regeln, d, { zeit: "", pfad: d.pfad, feld, von: w.wert, zu: antwort });
    }
  }
  nutzerBericht.regeln = regeln.length;
}
if (worker) await worker.terminate();
writeFileSync(cacheDatei, JSON.stringify(cache));
const org = new Map(absenderVereinheitlichen(dateien.map((d) => siebe(d, 5, regeln))).map((d) => [d.pfad, d]));

// ---------- Familienakte heute ----------
const fa = new Map();
if (existsSync(join(FA, "lib/document-intake.ts"))) {
  const { buildDocumentIntakePlan } = await import(join(FA, "lib/document-intake.ts"));
  const { briefAngaben } = await import(join(FA, "lib/briefkopf-titel.ts"));
  runInThisContext(readFileSync(join(FA, "public/apps/workflow-pdf/assets/briefkopf.js"), "utf8"));
  const B = globalThis.__WFP_BRIEFKOPF;
  const abgelegt = [];
  for (const d of dateien) {
    const text = d.volltext || "";
    let brief = null;
    try { brief = text.trim() ? briefAngaben(B.lesen(text.split(/\r?\n/).slice(0, 400))) : null; } catch { brief = null; }
    const plan = buildDocumentIntakePlan({ file: { name: d.name, size: d.groesse, type: "", lastModified: d.geaendert, textHint: text, titleHint: d.email?.betreff, brief }, source: "file-picker", documents: abgelegt, records: [] });
    abgelegt.push({ id: d.pfad, originalName: d.name, sizeBytes: d.groesse });
    fa.set(d.pfad, { kat: plan.lifeArea, abs: brief?.absender || "", pruef: plan.requiresReview });
  }
}

// ---------- BookLedgerPro (Belege) ----------
let blp = null;
let blpKat = null;
if (existsSync(join(BLP, "src/ai/extract.js"))) { blp = await import(join(BLP, "src/ai/extract.js")); blpKat = await import(join(BLP, "src/ai/categorize.js")); }

// ---------- Vergleichen ----------
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
const cents = (s) => { const m = String(s || "").match(/(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/); return m ? Number(m[1].replace(/\./g, "")) * 100 + Number(m[2]) : null; };
const felder = ["schriftstueck", "kategorie", "absender", "person", "frist", "betrag"];
const z = Object.fromEntries(felder.map((f) => [f, { n: 0, ok: 0, falschSicher: 0, offen: 0 }]));
const zfa = { kat: { n: 0, ok: 0 }, abs: { n: 0, ok: 0 }, pruef: 0 };
const zblp = { betrag: { n: 0, ok: 0 }, datum: { n: 0, ok: 0 } };
const jeHaushalt = {};
const fehler = Object.fromEntries(felder.map((f) => [f, []]));
let offenDateien = 0;
const GF = ["zeitraum", "brutto", "netto", "auszahlung", "lohnsteuer", "steuerklasse", "steuerId", "svNummer", "krankenkasse"];
const zg = Object.fromEntries(GF.map((f) => [f, { n: 0, ok: 0 }]));
const gfehler = [];
const zkonto = { n: 0, blp: 0 };
const zdopp = { n: 0, ok: 0, falsch: 0 }, zleer = { n: 0, ok: 0 }, zanh = { n: 0, ok: 0 };
for (const e of soll) {
  const o = org.get(e.pfad);
  if (e.anhang) { zanh.n++; if (o) zanh.ok++; }
  if (!o) continue;
  if (e.doppelt) { zdopp.n++; if (o.doppeltVon) zdopp.ok++; continue; } else if (o.doppeltVon) zdopp.falsch++;
  if (e.leer) { zleer.n++; if (/leere datei/i.test(o.felder.schriftstueck?.grund || "")) zleer.ok++; continue; }
  if (e.gehalt) {
    const g = gehaltLesen(o.volltext || "") || {};
    for (const f of GF) { zg[f].n++; const a = String(g[f] ?? "").replace(/\s/g, ""), b = String(e.gehalt[f]).replace(/\s/g, "");
      const ok = ["brutto", "netto", "auszahlung", "lohnsteuer"].includes(f) ? cents(a) === cents(b) : a.toLowerCase() === b.toLowerCase();
      if (ok) zg[f].ok++; else if (gfehler.length < 30) gfehler.push(`${f}: „${a}“ statt „${b}“ (${o.textQuelle})`); }
  }
  const text = o.volltext || "";
  const h = hh[e.haushalt];
  const ist = {
    schriftstueck: o.felder.schriftstueck, kategorie: o.felder.kategorie, absender: o.felder.absender, frist: o.felder.frist, betrag: o.felder.betrag,
    person: h ? personZuordnen(`${o.email?.an || ""}\n${text}`, o.felder.betrifft?.wert, h) : undefined,
  };
  let offen = false;
  for (const f of felder) {
    const s = f === "person" ? e.person : e[f];
    if (!s || (f === "kategorie" && s === "Fotos" && !text)) { if (f === "kategorie" && s === "Fotos") { z[f].n++; if (ist.kategorie?.wert === "Fotos") z[f].ok++; } continue; }
    if (f === "betrag" && e.schriftstueck !== "Kassenbon") continue;
    z[f].n++;
    const w = ist[f];
    const richtig = w && (f === "betrag" ? cents(w.wert) === cents(s) : f === "absender" ? norm(w.wert) === norm(s) : w.wert === s);
    if (richtig) z[f].ok++;
    else {
      if (w?.sicher) { z[f].falschSicher++; fehler[f].push(`${e.pfad.split("/").slice(1, 2)[0].slice(0, 12)} ${e.pfad.split("/").pop()}: „${w?.wert || "–"}“ statt „${s}“`); }
      else { z[f].offen++; fehler[f].push(`(unsicher) ${e.pfad.split("/").pop()}: „${w?.wert || "–"}“ statt „${s}“`); }
    }
    if (!w || !w.sicher) offen = true;
    if (f === "kategorie") { jeHaushalt[e.haushalt] ??= { n: 0, ok: 0 }; jeHaushalt[e.haushalt].n++; if (richtig) jeHaushalt[e.haushalt].ok++; }
  }
  if (offen) offenDateien++;
  const f = fa.get(e.pfad);
  if (f) {
    if (f.pruef) zfa.pruef++;
    if (e.kategorie && e.kategorie !== "Fotos") { zfa.kat.n++; if (f.kat === e.kategorie) zfa.kat.ok++; }
    if (e.absender) { zfa.abs.n++; if (norm(f.abs) && (norm(f.abs).includes(norm(e.absender)) || norm(e.absender).includes(norm(f.abs)))) zfa.abs.ok++; }
  }
  if (blp && e.konto) { zkonto.n++; if (blpKat?.categorize(text).konto === e.konto) zkonto.blp++; }
  if (blp && e.schriftstueck === "Kassenbon" && text) {
    const x = blp.extractFromText(text);
    zblp.betrag.n++; if (x.betragBrutto === cents(e.betrag)) zblp.betrag.ok++;
    zblp.datum.n++; if (x.datum === e.datum) zblp.datum.ok++;
  }
}

const pz = (a, b) => b ? `${a}/${b} = ${Math.round((100 * a) / b)} %` : "–";
const ergebnis = { ordner: ORDNER.replace(WURZEL, ""), dateien: soll.length, organizer: z, familienakte: zfa, bookledgerpro: zblp, offenDateien, jeHaushalt };
if (arg("--json")) writeFileSync(resolve(WURZEL, arg("--json")), JSON.stringify(ergebnis, null, 1));
console.log(`Messung ${ergebnis.ordner}: ${soll.length} Dateien${regeln.length ? `, ${regeln.length} gelernte Regeln` : ""}`);
if (LERN) console.log(`Gelernt aus ${LERN} – Nutzer ${NUTZER}: ${nutzerBericht.antworten} Antworten, davon ${nutzerBericht.falscheAntworten} falsch`);
console.log("");
ergebnis.nutzer = nutzerBericht;
console.log("Feld            Organizer-Kern            sicher-falsch  unsicher   Familienakte heute");
for (const f of felder) console.log(`${f.padEnd(16)}${pz(z[f].ok, z[f].n).padEnd(26)}${String(z[f].falschSicher).padEnd(15)}${String(z[f].offen).padEnd(11)}${f === "kategorie" ? pz(zfa.kat.ok, zfa.kat.n) : f === "absender" ? pz(zfa.abs.ok, zfa.abs.n) : ""}`);
console.log(`\nzur Prüfung (mind. ein Feld unsicher): Organizer ${pz(offenDateien, soll.length)} · Familienakte ${pz(zfa.pruef, soll.length)}`);
if (blp) console.log(`BookLedgerPro an Kassenbons: Betrag ${pz(zblp.betrag.ok, zblp.betrag.n)}, Datum ${pz(zblp.datum.ok, zblp.datum.n)}`);
console.log(`Doppelte erkannt ${pz(zdopp.ok, zdopp.n)} (fälschlich doppelt: ${zdopp.falsch}) · leere Sync-Dateien gemeldet ${pz(zleer.ok, zleer.n)} · Mail-Anhänge ausgepackt ${pz(zanh.ok, zanh.n)} · Systemdateien übergangen ${uebersprungen}`);
console.log("Gehaltsabrechnungen: " + GF.map((f) => `${f} ${pz(zg[f].ok, zg[f].n)}`).join(" · "));
if (blpKat) console.log(`BookLedgerPro Konto (SKR03) an Geschäftsbelegen: ${pz(zkonto.blp, zkonto.n)}`);
ergebnis.gehalt = zg; ergebnis.nutzer = nutzerBericht; ergebnis.doppelt = zdopp; ergebnis.leer = zleer; ergebnis.anhang = zanh; ergebnis.blpKonto = zkonto;
if (!STILL && gfehler.length) { console.log("\nFehler Gehalt:"); for (const x of gfehler) console.log("  " + x); }
console.log("\nBereich je Haushalt:", Object.entries(jeHaushalt).map(([k, v]) => `${k.split("-")[0]} ${Math.round((100 * v.ok) / v.n)} %`).join(" · "));
if (!STILL) for (const f of felder) if (fehler[f].length) { console.log(`\nFehler ${f} (${fehler[f].length}):`); for (const x of fehler[f].slice(0, 25)) console.log(`  ${x}`); }
