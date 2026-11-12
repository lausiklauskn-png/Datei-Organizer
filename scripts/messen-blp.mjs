// Blindtest BookLedgerPro (Regeln: docs/PRUEFSTAPEL-BLP-REGELN.md). Misst extractFromText und categorize an einem Stapel
// mit ERWARTUNG.json; jede Zahl mit 95-%-Fehlerspanne (Wilson). Optional: zweiter Einordner (ZWEITER.json) → Übereinstimmung, Kappa.
// Aufruf: node scripts/messen-blp.mjs <ordner> [--blp ../lausiklauskn-png/bookledgerpro] [--json datei]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const arg = (n, v) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : v; };
const ORDNER = resolve(WURZEL, process.argv[2]);
const BLP = resolve(WURZEL, arg("--blp", "../lausiklauskn-png/bookledgerpro"));
const { extractFromText } = await import(join(BLP, "src/ai/extract.js"));
const { categorize } = await import(join(BLP, "src/ai/categorize.js"));

/** 95-%-Spanne nach Wilson */
export function wilson(ok, n, z = 1.96) {
  if (!n) return null;
  const p = ok / n, d = 1 + (z * z) / n, m = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, m - h), Math.min(1, m + h)];
}
const cents = (s) => { if (s == null) return null; const m = String(s).replace(/\s/g, "").match(/^-?(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})$/); return m ? Number(m[1].replace(/\./g, "")) * 100 + Number(m[2]) : null; };

const soll = JSON.parse(readFileSync(join(ORDNER, "ERWARTUNG.json"), "utf8")).dateien;
const zweiter = existsSync(join(ORDNER, "ZWEITER.json")) ? new Map(JSON.parse(readFileSync(join(ORDNER, "ZWEITER.json"), "utf8")).dateien.map((x) => [x.datei, x.konto])) : null;
const F = ["betrag", "datum", "ust", "richtung", "konto"];
const z = Object.fromEntries(F.map((f) => [f, { n: 0, ok: 0 }]));
const zEinig = { n: 0, ok: 0 }, verwechslung = {}, fehler = [];
for (const e of soll) {
  const text = readFileSync(join(ORDNER, e.datei), "utf8");
  const x = extractFromText(text), k = categorize(text);
  const ist = { betrag: x.betragBrutto, datum: x.datum, ust: x.ustSatz, richtung: k.richtung, konto: k.konto };
  for (const f of F) {
    if (e[f] == null) continue; // nicht gemessen
    z[f].n++;
    const ok = f === "betrag" ? ist.betrag === cents(e.betrag) : String(ist[f]) === String(e[f]);
    if (ok) z[f].ok++;
    else if (fehler.length < 400) fehler.push({ datei: e.datei, feld: f, ist: ist[f], soll: e[f] });
  }
  if (e.konto) { const key = `${e.konto}→${ist.konto}`; verwechslung[key] = (verwechslung[key] || 0) + 1; }
  if (zweiter && e.konto && zweiter.get(e.datei) === e.konto) { zEinig.n++; if (ist.konto === e.konto) zEinig.ok++; }
}
// Übereinstimmung der beiden Einordner und Cohens Kappa
let uebereinstimmung = null;
if (zweiter) {
  const paare = soll.filter((e) => e.konto && zweiter.get(e.datei)).map((e) => [e.konto, zweiter.get(e.datei)]);
  const n = paare.length, po = paare.filter(([a, b]) => a === b).length / n;
  const ka = {}, kb = {}; for (const [a, b] of paare) { ka[a] = (ka[a] || 0) + 1; kb[b] = (kb[b] || 0) + 1; }
  const pe = Object.keys({ ...ka, ...kb }).reduce((s, k) => s + ((ka[k] || 0) / n) * ((kb[k] || 0) / n), 0);
  uebereinstimmung = { n, gleich: po, kappa: (po - pe) / (1 - pe) };
}
const pz = (x) => x.n ? `${x.ok}/${x.n} = ${(100 * x.ok / x.n).toFixed(1)} % (95 %: ${wilson(x.ok, x.n).map((v) => (100 * v).toFixed(0)).join("–")} %)` : "nicht gemessen";
console.log(`Blindtest BookLedgerPro ${ORDNER.replace(WURZEL, "")}: ${soll.length} Belege\n`);
for (const f of F) console.log(`${f.padEnd(10)} ${pz(z[f])}`);
if (uebereinstimmung) console.log(`\nZwei Einordner beim Konto: ${(100 * uebereinstimmung.gleich).toFixed(1)} % gleich, Kappa ${uebereinstimmung.kappa.toFixed(2)} (n=${uebereinstimmung.n})\nKonto, nur wo beide einig: ${pz(zEinig)}`);
console.log("\nHäufigste Verwechslungen (soll→ist):", Object.entries(verwechslung).filter(([k]) => k.split("→")[0] !== k.split("→")[1]).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k} ×${v}`).join(", "));
const ergebnis = { ordner: ORDNER.replace(WURZEL, ""), belege: soll.length, felder: z, wilson: Object.fromEntries(F.map((f) => [f, wilson(z[f].ok, z[f].n)])), uebereinstimmung, kontoEinig: zEinig, verwechslung, fehler };
if (arg("--json")) writeFileSync(resolve(WURZEL, arg("--json")), JSON.stringify(ergebnis, null, 1));
