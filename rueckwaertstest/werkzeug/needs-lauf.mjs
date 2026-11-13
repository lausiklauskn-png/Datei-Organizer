/* Rückwärtstest: ausgefüllten Bedarf in einen echten Workflow-Needs-Vorgang legen und den Bauauftrag mit dem
   UNVERÄNDERTEN Code von Needs erzeugen (assets/kern/*, Sage-Modul 25).

   node needs-lauf.mjs liste   <bedarf.json>                  → Bedarf mit Kennungen (für die Stufe-2-Wahl)
   node needs-lauf.mjs auftrag <bedarf.json> <umfang.json> <aus.md>

   NEEDS=/pfad/zu/Workflow-Needs (Vorgabe: ../../../Workflow-Needs neben diesem Repo).
   bedarf.json: { titel, kunde:{firma,ansprechpartner,mail,…}, weitereNamen, bereiche:{ "1":[text|{text,…}], … } }
     Bereich 3: {text, anzahl} · Bereich 6: {text, prio: muss|soll|kann, nutzen:{stundenMonat, euroMonat, text}} ·
     Bereich 18: {text, wer, bis}
   umfang.json: { kundenStundenwertCent?, bausteine:[{katalog|null, name, groesse: klein|mittel|gross|null, deckt:[B-nn], faktoren?:[]}] } */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HIER = dirname(fileURLToPath(import.meta.url));
const NEEDS = resolve(process.env.NEEDS || join(HIER, "../../../Workflow-Needs"));
const require = createRequire(import.meta.url);
const still = console.log; console.log = () => {};
for (const f of ["modules/25_pseudonym.js", "assets/kern/geld.js", "assets/daten/bausteine.js", "assets/daten/markt.js",
  "assets/kern/bedarf.js", "assets/kern/rechnen.js", "assets/kern/fassungen.js", "assets/kern/bauauftrag.js"]) require(join(NEEDS, f));
console.log = still;
const WN = globalThis.WN, P = globalThis.SbkimPseudonym;
const EINST = { satzCent: 8000, ust: { modus: "regel", satz: 19 }, zeitraum: 24 };

function vorgangAus(bedarf) {
  const v = WN.fassungen.neuerVorgang(1, EINST, "2026-11-14");
  v.titel = bedarf.titel || "";
  Object.assign(v.kunde, bedarf.kunde || {});
  v.weitereNamen = bedarf.weitereNamen || "";
  const f = v.fassungen[0], p = f.protokoll;
  for (const b of WN.BEREICHE) {
    for (const roh of (bedarf.bereiche && bedarf.bereiche[b.nr]) || []) {
      const o = typeof roh === "string" ? { text: roh } : roh;
      const extra = {};
      if (b.nr === 3) extra.anzahl = Number(o.anzahl) || 1;
      if (b.nr === 18) { extra.wer = o.wer || ""; extra.bis = o.bis || ""; }
      const e = WN.bedarf.eintragNeu(v, p, b.nr, o.text, extra);
      if (b.nr === 6) {
        e.prio = ["muss", "soll", "kann"].includes(o.prio) ? o.prio : "";
        const n = o.nutzen || {};
        e.nutzen = { stundenMonat: n.stundenMonat ?? null, euroMonat: n.euroMonat ?? null, text: n.text || "" };
      }
    }
  }
  return v;
}

const [art, a1, a2, a3] = process.argv.slice(2);
const bedarf = JSON.parse(readFileSync(a1, "utf8"));
const v = vorgangAus(bedarf);
const f = v.fassungen[0];
if (art === "liste") {
  for (const x of WN.bedarf.alleEintraege(f.protokoll)) {
    const e = x.e;
    process.stdout.write(`${e.id} [Bereich ${x.nr} ${WN.BEREICHE[x.nr - 1].name.de}] ${e.text}${e.prio ? " (" + e.prio + ")" : ""}\n`);
  }
  process.stdout.write(`Ausgefüllt: ${WN.bedarf.fortschritt(f.protokoll)} von 18 Bereichen\n`);
} else if (art === "auftrag") {
  const umfang = JSON.parse(readFileSync(a2, "utf8"));
  if (umfang.kundenStundenwertCent) f.umfang.kundenStundenwertCent = umfang.kundenStundenwertCent;
  const kat = new Set(WN.BAUSTEINE.map((b) => b.id));
  for (const b of umfang.bausteine || []) {
    f.umfang.bausteine.push({ id: WN.bedarf.neueKennung(v, "K"), katalog: kat.has(b.katalog) ? b.katalog : null, name: b.name || "",
      menge: b.menge || 1, groesse: ["klein", "mittel", "gross"].includes(b.groesse) ? b.groesse : null, faktoren: b.faktoren || [], deckt: b.deckt || [] });
  }
  const r = WN.bauauftrag.erzeuge(v, null, f, { stunden: true, euro: false, datum: "2026-11-14" }, P);
  if (!r.ok) { console.error("Bauauftrag nicht erzeugt:", r.grund, r.fund || ""); process.exit(1); }
  writeFileSync(a3, r.md);
  process.stdout.write(`geschrieben: ${a3} (${r.md.length} Zeichen, ${f.umfang.bausteine.length} Bausteine, ${WN.bedarf.fortschritt(f.protokoll)}/18 Bereiche)\n`);
} else { console.error("art: liste | auftrag"); process.exit(2); }
