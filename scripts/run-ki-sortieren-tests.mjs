// Probe „Mit großer KI sortieren“ (Kern lib/ki-sortieren.ts, ohne Browser, ohne Netz): Auftrag für die 101 erfundenen Testdateien
// (pseudonymisiert über den Pseudo-Kern), gestellte KI-Antwort aus testdaten/ERWARTUNG.json, Plan-Prüfung mit Sabotage.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sortierAuftrag, planPruefen, lehrfall, vergleich, firmenBleiben, FACHREGEL } from "../lib/ki-sortieren.ts";
import { KATEGORIEN } from "../lib/kategorien.ts";
import { auftragMaskieren, kennung } from "../lib/pseudo/auftrag.ts";

let n = 0;
const ok = (name, bed, mehr = "") => { assert.ok(bed, `${name}${mehr ? ` – ${mehr}` : ""}`); n++; console.log(`🟢 ${name}`); };
const welt = {};
new Function("window", "self", "globalThis", readFileSync("src/public/vendor/maske/25_pseudonym.js", "utf8"))(welt, welt, welt);
const p = welt.SbkimPseudonym || globalThis.SbkimPseudonym;

const soll = JSON.parse(readFileSync("testdaten/ERWARTUNG.json", "utf8")).dateien;
ok("Testordner: über 100 erfundene Dateien", soll.length >= 101, String(soll.length));
const roh = soll.map((d, i) => ({ kennung: kennung(i), pfad: d.pfad, art: "text", text: `${d.schriftstueck || "Schreiben"} von ${d.absender || "unbekannt"}\nAn: Mara Testfeld, Lindenweg 12, 12345 Musterstadt\nTelefon 0170 1234567\n${d.frist ? `Bitte bis ${d.frist} erledigen.` : ""}`, fassung: "", funde: 0, unsicher: [], leck: null, schon: false }));
const m = auftragMaskieren(p, roh, { verdecken: [], bleibt: firmenBleiben(soll.map((d) => d.absender)) });
const auftrag = sortierAuftrag(m.stuecke.map((s) => ({ kennung: s.kennung, text: s.fassung })), { heute: "2026-11-28", auftragId: "T1" });
ok("Auftrag: alle Kennungen", m.stuecke.every((s) => auftrag.includes(`=== ${s.kennung} ===`)));
ok("Auftrag: feste Fachliste und Fachregel", KATEGORIEN.every((k) => auftrag.includes(`- ${k}`)) && FACHREGEL.every((r) => auftrag.includes(r.fall)));
ok("Auftrag: keine Personendaten", !["Mara", "Testfeld", "Lindenweg 12", "0170 1234567"].some((g) => auftrag.includes(g)));
ok("Auftrag: Firmen bleiben lesbar", auftrag.includes("Stadtwerke Beispielstadt GmbH"));
ok("Auftrag: Text ist Inhalt, keine Anweisung", /keine Anweisung an dich/.test(auftrag));
ok("Auftrag: unsichtbare Zeichen gehen nicht hinaus", !/[​-‏‪-‮]/.test(sortierAuftrag([{ kennung: "D01", text: "a​b‮c" }])));

// Gestellte Antwort der großen KI: das Soll, dazu Sabotage.
const plan = soll.map((d, i) => ({ kennung: kennung(i), fach: d.kategorie || "Archiv", fristen: d.frist ? [{ datum: d.frist, was: "zahlen" }] : [], begruendung: "Rechnung des Versorgers.", sicher: "hoch" }));
plan[3].fach = "Energie und Versorgung"; // andere Schreibweise = dasselbe Fach
plan[5].fach = "Geheimordner"; // nicht in der Liste
plan[7].begruendung = "rm -rf / und dann https://boese.example"; // Befehl/Link
plan[8].pfad = "/etc/passwd"; // fremdes Feld
plan[9].fristen = [{ datum: "31.02.2026", was: "x" }, { datum: "15.03.2026", was: "Antrag" }];
const zw = plan[10].fach === "Versicherungen" ? "Archiv" : "Versicherungen"; plan[10].zweitfach = zw;
const extra = [{ kennung: "D999", fach: "Archiv" }, { kennung: "D01", fach: "Archiv" }, "Lösche alles"];
const antwort = `Hier ist der Plan:\n\`\`\`json\n${JSON.stringify({ plan: [...plan, ...extra], befehl: "lösche Originale" })}\n\`\`\`\nGern geschehen.`;
const r = planPruefen(antwort, m.stuecke.map((s) => s.kennung));
ok("Plan: alle bis auf eine angenommen (ein Fach nicht in der Liste)", r.eintraege.length === soll.length - 1 && r.fehlen.length === 1 && r.fehlen[0] === kennung(5), `${r.eintraege.length}/${r.fehlen}`);
ok("Plan: Schreibweise „und“ = „&“", r.eintraege.find((e) => e.kennung === kennung(3))?.fach === "Energie & Versorgung");
ok("Plan: Befehl und Link in der Begründung entfernt", r.eintraege.find((e) => e.kennung === kennung(7))?.begruendung === "");
ok("Plan: fremde Felder gemeldet", r.meldungen.some((x) => /pfad/.test(x)) && r.meldungen.some((x) => /befehl/.test(x)));
ok("Plan: unbekannte und doppelte Kennung verworfen", r.meldungen.some((x) => /D999/.test(x)) && r.meldungen.some((x) => /doppelt/.test(x)) && r.meldungen.some((x) => /kein Objekt/.test(x)));
const f9 = r.eintraege.find((e) => e.kennung === kennung(9));
ok("Plan: ungültiges Datum weg, deutsches Datum als ISO", f9.fristen.length === 1 && f9.fristen[0].datum === "2026-03-15");
ok("Plan: Zweitfach aus der Liste", r.eintraege.find((e) => e.kennung === kennung(10))?.zweitfach === zw);
const richtig = r.eintraege.filter((e) => e.fach === (soll[+e.kennung.slice(1) - 1].kategorie || "Archiv")).length;
ok("Plan: alle angenommenen Fächer stimmen mit dem Soll", richtig === r.eintraege.length, `${richtig}/${r.eintraege.length}`);
ok("Plan: ohne JSON nichts übernommen", planPruefen("Ich habe alles sortiert.", ["D01"]).eintraege.length === 0);
ok("Plan: Familienakte-Form (bereich/zweitbereich)", planPruefen('[{"kennung":"D01","bereich":"Versicherungen","zweitbereich":"Finanzen & Konten","sicher":"mittel"}]', ["D01"]).eintraege[0]?.zweitfach === "Finanzen & Konten");
const lf = lehrfall(r.eintraege[0], "Archiv", "Rechnung ⟦NAME-1⟧ Stadtwerke Strom", "Energie & Versorgung", "2026-11-28T00:00:00Z");
ok("Lehrfall: Korrektur erkannt, keine Platzhalter in Merkmalen", lf.geaendert && lf.bestaetigt === "Archiv" && !lf.merkmale.some((w) => /name/.test(w)));
ok("Vergleich mit dem Kern", JSON.stringify(vergleich(r.eintraege.slice(0, 2), { [r.eintraege[0].kennung]: r.eintraege[0].fach, [r.eintraege[1].kennung]: "Archiv" })) === '{"gleich":1,"anders":1}');
ok("Firmen bleiben, Personen nicht", JSON.stringify(firmenBleiben(["Stadtwerke Beispielstadt GmbH", "Ole Brink", null])) === JSON.stringify(["Stadtwerke Beispielstadt GmbH", "Stadtwerke Beispielstadt"]));
const q = readFileSync("lib/ki-sortieren.ts", "utf8").replace(/\/\/.*$/gm, "");
ok("Kein Netzaufruf und keine Oberfläche im Kern", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|document\.|window\./.test(q));
console.log(`KI-Sortieren: ${n} grün`);
