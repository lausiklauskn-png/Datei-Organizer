// Messung an einem Testordner mit ERWARTUNG.json: Organizer-Kern (alle Felder, Personen über HAUSHALTE.json),
// daneben der heutige Eingang der Familienakte und die Belegerkennung von BookLedgerPro (Beträge auf Kassenbons).
// Fotos und Belege werden per Texterkennung gelesen (tesseract.js mit den deutschen Sprachdaten der Familienakte),
// Ergebnisse im Ordner unter .ocr-cache.json zwischengespeichert.
// Aufruf: node scripts/messen.mjs <ordner> [--fa ../Meine-Familienakte] [--blp ../lausiklauskn-png/bookledgerpro] [--json datei] [--chaos]
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import { einlesen, doppelteMarkieren } from "../lib/einlesen.ts";
import { siebe } from "../lib/siebe.ts";
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
const cacheDatei = join(ORDNER, ".ocr-cache.json");
const cache = existsSync(cacheDatei) ? JSON.parse(readFileSync(cacheDatei, "utf8")) : {};
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
const soll = JSON.parse(readFileSync(join(ORDNER, "ERWARTUNG.json"), "utf8")).dateien;
const liste = JSON.parse(readFileSync(join(ORDNER, "dateien.json"), "utf8"));
const hh = existsSync(join(ORDNER, "HAUSHALTE.json")) ? Object.fromEntries(JSON.parse(readFileSync(join(ORDNER, "HAUSHALTE.json"), "utf8")).haushalte.map((h) => [h.id, h])) : {};
let dateien = [];
for (const [i, pfad] of liste.entries()) {
  const bytes = new Uint8Array(readFileSync(join(ORDNER, pfad)));
  dateien.push(...await einlesen({ pfad, name: pfad.split("/").pop(), geaendert: Date.UTC(2026, 10, 1) + i, bytes }, (b) => pdfTextLesen(pdfjs, b), 0, ocr));
}
if (worker) await worker.terminate();
writeFileSync(cacheDatei, JSON.stringify(cache));
dateien = doppelteMarkieren(dateien);
const regeln = existsSync(join(ORDNER, "REGELN.json")) ? JSON.parse(readFileSync(join(ORDNER, "REGELN.json"), "utf8")) : [];
const org = new Map(dateien.map((d) => [d.pfad, siebe(d, 5, regeln)]));

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
if (existsSync(join(BLP, "src/ai/extract.js"))) blp = await import(join(BLP, "src/ai/extract.js"));

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
for (const e of soll) {
  const o = org.get(e.pfad);
  if (!o) continue;
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
  if (blp && e.schriftstueck === "Kassenbon" && text) {
    const x = blp.extractFromText(text);
    zblp.betrag.n++; if (x.betragBrutto === cents(e.betrag)) zblp.betrag.ok++;
    zblp.datum.n++; if (x.datum === e.datum) zblp.datum.ok++;
  }
}

const pz = (a, b) => b ? `${a}/${b} = ${Math.round((100 * a) / b)} %` : "–";
const ergebnis = { ordner: ORDNER.replace(WURZEL, ""), dateien: soll.length, organizer: z, familienakte: zfa, bookledgerpro: zblp, offenDateien, jeHaushalt };
if (arg("--json")) writeFileSync(resolve(WURZEL, arg("--json")), JSON.stringify(ergebnis, null, 1));
console.log(`Messung ${ergebnis.ordner}: ${soll.length} Dateien${regeln.length ? `, ${regeln.length} gelernte Regeln` : ""}\n`);
console.log("Feld            Organizer-Kern            sicher-falsch  unsicher   Familienakte heute");
for (const f of felder) console.log(`${f.padEnd(16)}${pz(z[f].ok, z[f].n).padEnd(26)}${String(z[f].falschSicher).padEnd(15)}${String(z[f].offen).padEnd(11)}${f === "kategorie" ? pz(zfa.kat.ok, zfa.kat.n) : f === "absender" ? pz(zfa.abs.ok, zfa.abs.n) : ""}`);
console.log(`\nzur Prüfung (mind. ein Feld unsicher): Organizer ${pz(offenDateien, soll.length)} · Familienakte ${pz(zfa.pruef, soll.length)}`);
if (blp) console.log(`BookLedgerPro an Kassenbons: Betrag ${pz(zblp.betrag.ok, zblp.betrag.n)}, Datum ${pz(zblp.datum.ok, zblp.datum.n)}`);
console.log("\nBereich je Haushalt:", Object.entries(jeHaushalt).map(([k, v]) => `${k.split("-")[0]} ${Math.round((100 * v.ok) / v.n)} %`).join(" · "));
if (!STILL) for (const f of felder) if (fehler[f].length) { console.log(`\nFehler ${f} (${fehler[f].length}):`); for (const x of fehler[f].slice(0, 25)) console.log(`  ${x}`); }
