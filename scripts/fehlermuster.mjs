// Fehlermuster aus exportierten Lehrfällen zählen (nur Fächer und Zahlen, keine Wörter): node scripts/fehlermuster.mjs <lehrfaelle.json>
// Die Datei kommt vom Gerät (Speicher „do-lehrfaelle“, „fa-lehrfaelle“, „pa-lehrfaelle“) und gehört nicht ins Repo – die Ausgabe schon.
import { readFileSync } from "node:fs";
import { fehlermuster, nachlernenLohnt, NACHLERNEN_AB } from "../lib/lehrmodell.ts";
const datei = process.argv[2];
if (!datei) { console.error("Aufruf: node scripts/fehlermuster.mjs <lehrfaelle.json>"); process.exit(2); }
const faelle = JSON.parse(readFileSync(datei, "utf8"));
const m = fehlermuster(Array.isArray(faelle) ? faelle : []);
console.log(`${faelle.length} Lehrfälle, ${m.length} Fehlermuster`);
for (const x of m) console.log(`${x.wer === "kern" ? "Kern" : "KI  "} ${x.vorschlag} → bestätigt ${x.bestaetigt}: ${x.n}×`);
const los = nachlernenLohnt(m);
console.log(los.length ? `Nachlernen lohnt (ab ${NACHLERNEN_AB}×): ${los.map((x) => `${x.vorschlag} → ${x.bestaetigt}`).join("; ")}` : `Noch zu wenig zum Nachlernen (je Muster ab ${NACHLERNEN_AB}× gleich).`);
