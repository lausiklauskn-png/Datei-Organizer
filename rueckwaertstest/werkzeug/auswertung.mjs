/* Rückwärtstest: zwei Bewertungen je App zusammenführen (bei Abweichung die strengere Wertung, REGELN.md),
   Trefferquote der Kern-Merkmale je Plan, Übereinstimmung der Bewerter, fehlende Kern-Merkmale.
   node auswertung.mjs  → schreibt ../ERGEBNIS.json und gibt eine Übersicht aus. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const R = join(dirname(fileURLToPath(import.meta.url)), "..");
const RANG = { getroffen: 3, teilweise: 2, fehlt: 1, verkehrt: 0 };
const PUNKT = { getroffen: 1, teilweise: 0.5, fehlt: 0, verkehrt: 0 };
const strenger = (a, b) => (RANG[a] ?? 1) <= (RANG[b] ?? 1) ? a : b;
const ergebnis = {};
for (const app of ["familienakte", "bookledgerpro", "workflow-pdf-pro", "private-brain-pro"]) {
  const ref = JSON.parse(readFileSync(join(R, app, "REFERENZ.json"), "utf8"));
  const kern = ref.merkmale.filter((m) => m.gewicht === "kern");
  const bw = [1, 2].map((n) => join(R, app, `bewertung-${n}.json`)).filter(existsSync).map((p) => JSON.parse(readFileSync(p, "utf8")));
  if (bw.length < 2) { console.log(app, "— noch nicht beide Bewertungen"); continue; }
  ergebnis[app] = { kern: kern.length, plaene: {} };
  for (const k of ["A", "B", "C", "K"]) {
    const w1 = bw[0].plaene[k].wertung, w2 = bw[1].plaene[k].wertung;
    let gleich = 0, s = 0, s1 = 0, s2 = 0; const fehlt = [], verkehrt = [];
    for (const m of kern) {
      const a = w1[m.id] || "fehlt", b = w2[m.id] || "fehlt", w = strenger(a, b);
      if (a === b) gleich++;
      s += PUNKT[w]; s1 += PUNKT[a]; s2 += PUNKT[b];
      if (w === "fehlt") fehlt.push(m.id + " " + m.text);
      if (w === "verkehrt") verkehrt.push(m.id + " " + m.text);
    }
    const pct = (x) => Math.round(x / kern.length * 100);
    ergebnis[app].plaene[k] = { quote: pct(s), bewerter1: pct(s1), bewerter2: pct(s2), einig: pct(gleich),
      bestanden: pct(s) >= 80 && verkehrt.length === 0, fehlt, verkehrt,
      zusaetze: [...new Set([...(bw[0].plaene[k].zusaetze || []), ...(bw[1].plaene[k].zusaetze || [])])].slice(0, 8) };
  }
}
writeFileSync(join(R, "ERGEBNIS.json"), JSON.stringify(ergebnis, null, 1) + "\n");
for (const [app, e] of Object.entries(ergebnis)) {
  const q = ["A", "B", "C"].map((k) => e.plaene[k].quote);
  console.log(`${app}: Kunden A/B/C ${q.join(" / ")} % (Mittel ${Math.round(q.reduce((x, y) => x + y) / 3)} %), Beispiel K ${e.plaene.K.quote} % · Bewerter einig ${["A", "B", "C", "K"].map((k) => e.plaene[k].einig).join("/")} % · bestanden ${["A", "B", "C", "K"].filter((k) => e.plaene[k].bestanden).join(",") || "keiner"}`);
}
