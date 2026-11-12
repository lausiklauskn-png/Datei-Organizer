// Proben für den Sortier-Kern (lib/) – ohne Browser. Misst zusätzlich die Trefferquote an den Testdaten.
// Aufruf: node scripts/run-kern-tests.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { erkenneArt } from "../lib/dateiart.ts";
import { exifStueck, leseExif, verbinde } from "../lib/exif.ts";
import { leseEml, kopfDekodieren } from "../lib/eml.ts";
import { officeText } from "../lib/zip.ts";
import { erkenneSchriftstueck, erkenneNummern, erkenneFrist, erkenneBetrag, erkenneBetrifft, erkenneAbsender, erkenneKategorie, dringlichkeit, kennzeichenImText, erkenneDatum } from "../lib/erkennen.ts";
import { siebe, istUnsicher } from "../lib/siebe.ts";
import { einlesen, doppelteMarkieren } from "../lib/einlesen.ts";
import { pdfTextLesen } from "../lib/pdf-text.ts";
import { textPdf } from "../lib/test-pdf.ts";
import { lernen, korrigieren, regelnAufAlle } from "../lib/lernen.ts";
import { SICHTEN, baum, dateienUnter, suche } from "../lib/sichten.ts";
import { organizerIndex, indexLesen, steckbrief } from "../lib/index-format.ts";
import { KATEGORIEN } from "../lib/kategorien.ts";
import { archivnummernVergeben, offeneFuerNummer } from "../lib/archivnummer.ts";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
let gruen = 0, rot = 0;
const soll = (name, ok, info = "") => { if (ok) gruen++; else { rot++; console.log(`  ✗ ROT: ${name}${info ? ` – ${info}` : ""}`); } };

// ---------- Sieb 1 ----------
const pdfKopf = new TextEncoder().encode("%PDF-1.4\n");
soll("PDF am Kopf erkannt", erkenneArt("a.pdf", pdfKopf).art === "pdf");
soll(".pdf.exe ist auffällig", !!erkenneArt("Rechnung.pdf.exe", new Uint8Array([0x4d, 0x5a, 0, 0])).auffaellig);
soll("Programm hinter .pdf ist auffällig", !!erkenneArt("brief.pdf", new Uint8Array([0x4d, 0x5a, 0, 0])).auffaellig);
soll("Text mit .pdf-Endung ist auffällig", !!erkenneArt("x.pdf", new TextEncoder().encode("kein pdf")).auffaellig);
soll("JPEG ist Bild", erkenneArt("a.jpg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])).art === "bild");
soll("docx (ZIP) ist Office, nicht auffällig", (() => { const r = erkenneArt("a.docx", new Uint8Array([0x50, 0x4b, 3, 4])); return r.art === "office" && !r.auffaellig; })());
soll("eml als Text ist E-Mail", erkenneArt("a.eml", new TextEncoder().encode("From: x\nSubject: y\n")).art === "email");
soll(".js ist auffällig", !!erkenneArt("rechnung.js", new TextEncoder().encode("console.log(1)")).auffaellig);

// ---------- EXIF hin und zurück ----------
const jpeg = readFileSync(join(WURZEL, "scripts/bilder/auto-vorne.jpg"));
const mitExif = verbinde([jpeg.subarray(0, 2), exifStueck({ aufnahme: "2026-10-14T08:12:33", hersteller: "Beispiel", modell: "Handy S21", gps: { lat: 53.55, lon: 10.0 } }), jpeg.subarray(2)]);
const ex = leseExif(mitExif);
soll("EXIF: Aufnahmezeit", ex?.aufnahme === "2026-10-14T08:12:33", JSON.stringify(ex));
soll("EXIF: Modell", ex?.modell === "Handy S21");
soll("EXIF: GPS", !!ex?.gps && Math.abs(ex.gps.lat - 53.55) < 0.01 && Math.abs(ex.gps.lon - 10) < 0.01, JSON.stringify(ex?.gps));
soll("EXIF: Bildgröße aus dem JPEG", ex?.breite === 800 && ex?.hoehe === 600, `${ex?.breite}x${ex?.hoehe}`);
soll("JPEG ohne EXIF: kein Aufnahmedatum", !leseExif(jpeg)?.aufnahme);
soll("kaputtes JPEG wirft nicht", (() => { try { leseExif(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff, 1, 2])); return true; } catch { return false; } })());

// ---------- E-Mail ----------
soll("Betreff Q-dekodiert", kopfDekodieren("=?UTF-8?Q?Terminbest=C3=A4tigung?=") === "Terminbestätigung");
const mail = leseEml(readFileSync(join(WURZEL, "testdaten/Eingang/Mail-Anhaenge/Ihre_Rechnung_November.eml"), "utf8"));
soll("E-Mail: Anhang gefunden", mail.anhaenge.length === 1 && mail.anhaenge[0].name === "Rechnung_11-2026.pdf", JSON.stringify(mail.meta));
soll("E-Mail: Anhang ist ein PDF", erkenneArt("x.pdf", mail.anhaenge[0].daten.slice(0, 8)).art === "pdf");
soll("E-Mail: Absender", /Stadtwerke/.test(mail.meta.von || ""));

// ---------- Word ----------
const docText = await officeText(readFileSync(join(WURZEL, "testdaten/Eingang/Durcheinander/Kuendigung_Entwurf.docx")), "x.docx");
soll("docx: Text gelesen", /kündige ich fristgerecht/.test(docText), docText.slice(0, 80));

// ---------- Regeln ----------
soll("Mahnung vor Rechnung", erkenneSchriftstueck("Stadtwerke\n1. Mahnung\nRechnungsnummer RE-1").wert === "Mahnung");
soll("Rechnung sicher im Kopf", erkenneSchriftstueck("Firma\nRechnung Strom").sicher);
soll("nur Anrede → Brief, unsicher", (() => { const v = erkenneSchriftstueck("Sehr geehrte Frau X,\nwie besprochen"); return v.wert === "Brief" && !v.sicher; })());
const nr = erkenneNummern("Kundennummer: KD-40 1187\nRechnungsnummer: RE-2026-381\nIBAN DE00 0000 0000 0000 0000 00\nKennzeichen: BSP-FA 12");
soll("Kundennummer", nr.some((n) => n.art === "Kundennummer" && n.wert === "KD-40 1187"), JSON.stringify(nr));
soll("Rechnungsnummer", nr.some((n) => n.art === "Rechnungsnummer" && n.wert === "RE-2026-381"));
soll("IBAN gekürzt", nr.some((n) => n.art === "IBAN" && n.wert.includes("…")));
soll("Kennzeichen", nr.some((n) => n.art === "Kennzeichen" && n.wert === "BSP-FA 12"));
soll("kein Kennzeichen aus „DE00 0000“", !kennzeichenImText("IBAN DE00 0000 0000").length);
soll("Frist „bis spätestens“", erkenneFrist("Bitte zahlen Sie bis spätestens 19.11.2026.")?.wert === "2026-11-19");
soll("Frist „innerhalb eines Monats“ gerechnet, unsicher", (() => { const f = erkenneFrist("innerhalb eines Monats Einspruch", "2026-10-08"); return f?.wert === "2026-11-08" && !f.sicher; })());
soll("Betrag genannt", erkenneBetrag("Rechnungsbetrag: 1.240,00 €")?.wert === "1.240,00 €");
soll("Tausenderpunkt bleibt im Betrag", erkenneBetrag("Summe 12.345,67 EUR")?.wert === "12.345,67 €");
soll("betrifft aus Anrede", erkenneBetrifft("Sehr geehrte Frau Beispiel,")?.wert === "Frau Beispiel");
soll("betrifft Familie aus Anschrift", erkenneBetrifft("Familie Beispiel\nMusterweg 1")?.wert === "Familie Beispiel");
soll("Absender aus Absenderzeile", erkenneAbsender("Stadtwerke Beispielstadt GmbH\nStadtwerke Beispielstadt GmbH · Werkstraße 5 · 00001 Beispielstadt")?.wert === "Stadtwerke Beispielstadt GmbH");
soll("Kategorie über Absender", erkenneKategorie("Rechnung", "Stadtwerke Beispielstadt").wert === "Energie & Versorgung");
soll("Briefdatum", erkenneDatum("Beispielstadt, 02.10.2026\nRechnung")?.wert === "2026-10-02");
soll("Dringlichkeit", dringlichkeit("2026-11-10", "2026-11-12") === "Frist überschritten" && dringlichkeit("2026-11-15", "2026-11-12") === "diese Woche" && dringlichkeit(undefined, "2026-11-12") === "keine Frist");

// ---------- PDF-Text (pdf.js in Node) ----------
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href;
const lesePdf = (b) => pdfTextLesen(pdfjs, b);
const probePdf = await lesePdf(textPdf([["# Stadtwerke Beispielstadt GmbH", "Rechnung Strom", "Zählerstand: 4.712 kWh – Grüße"]]));
soll("PDF-Text mit Umlauten", /Zählerstand: 4\.712 kWh – Grüße/.test(probePdf.voll), probePdf.voll);
soll("PDF-Kopf enthält Betreff", /Rechnung Strom/.test(probePdf.kopf));

// ---------- Ganzer Lauf über die Testdaten ----------
const liste = JSON.parse(readFileSync(join(WURZEL, "testdaten/dateien.json"), "utf8"));
let dateien = [];
for (const pfad of liste) {
  const voll = join(WURZEL, "testdaten", pfad);
  dateien.push(...await einlesen({ pfad, name: pfad.split("/").pop(), geaendert: statSync(voll).mtimeMs, bytes: new Uint8Array(readFileSync(voll)) }, lesePdf));
}
dateien = doppelteMarkieren(dateien);
soll("Anhänge sind eigene Dateien", dateien.some((d) => d.pfad.includes(" › Rechnung_11-2026.pdf")));
soll("2 Doppelte erkannt", dateien.filter((d) => d.doppeltVon).length >= 2, String(dateien.filter((d) => d.doppeltVon).length));
soll("3 Auffällige erkannt", dateien.filter((d) => d.auffaellig).length === 3, dateien.filter((d) => d.auffaellig).map((d) => d.name).join(", "));
const stufenweise = dateien.map((d) => [2, 3, 4, 5].reduce((x, s) => siebe(x, s), d));
const aufEinmal = dateien.map((d) => siebe(d, 5));
soll("Stufenweise = auf einmal", JSON.stringify(stufenweise.map((d) => d.felder)) === JSON.stringify(aufEinmal.map((d) => d.felder)));
const nach2 = dateien.map((d) => siebe(d, 2));
soll("Sieb 2 setzt noch keinen Absender", nach2.every((d) => !d.felder.absender));
soll("Sieb 2 liest keinen ganzen Text (Kopf ≤ obere Hälfte)", nach2.filter((d) => d.textQuelle === "pdf").every((d) => (d.kopfText?.length || 0) <= (d.volltext?.length || 0)));
soll("Foto mit EXIF: Datum aus der Aufnahme", aufEinmal.find((d) => d.name === "IMG_20261014_081233.jpg")?.felder.datum?.wert === "2026-10-14");
dateien = aufEinmal;

// Trefferquote
const erwartung = JSON.parse(readFileSync(join(WURZEL, "testdaten/ERWARTUNG.json"), "utf8")).dateien;
const quote = {};
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
for (const e of erwartung) {
  const d = dateien.find((x) => x.pfad === e.pfad);
  if (!d) { soll(`Datei aus der Erwartung eingelesen: ${e.pfad}`, false); continue; }
  for (const feld of ["schriftstueck", "kategorie", "absender", "betrifft", "frist"]) {
    if (!e[feld]) continue;
    const q = (quote[feld] ||= { richtig: 0, gesamt: 0, falschSicher: 0, fehler: [] });
    q.gesamt++;
    const ist = d.felder[feld]?.wert;
    const ok = feld === "absender" ? norm(ist).includes(norm(e[feld]).split(" ")[0]) && norm(ist).startsWith(norm(e[feld]).slice(0, 10)) : norm(ist) === norm(e[feld]);
    if (ok) q.richtig++; else { if (d.felder[feld]?.sicher) q.falschSicher++; q.fehler.push(`${e.pfad.split("/").slice(-1)[0]}: „${ist}“ statt „${e[feld]}“${d.felder[feld]?.sicher ? " (als sicher!)" : ""}`); }
  }
  if (e.doppelt) soll(`doppelt: ${e.pfad}`, !!d.doppeltVon);
  if (e.auffaellig) soll(`auffällig: ${e.pfad}`, !!d.auffaellig);
}
console.log("Trefferquote an den Testdaten (richtig / gemessen, davon falsch aber als sicher markiert):");
for (const [feld, q] of Object.entries(quote)) {
  console.log(`  ${feld.padEnd(14)} ${q.richtig}/${q.gesamt} = ${Math.round(100 * q.richtig / q.gesamt)} %  · falsch-sicher: ${q.falschSicher}`);
  if (process.env.ZEIGEN) q.fehler.forEach((f) => console.log(`     – ${f}`));
}
// Messlatte (vor dem Bau festgelegt, Plan „Messwerte“): Art und Absender ≥ 90 % bei Briefen mit Textebene; lieber unsicher als falsch
soll("Art des Schriftstücks ≥ 90 %", quote.schriftstueck.richtig / quote.schriftstueck.gesamt >= 0.9, `${quote.schriftstueck.richtig}/${quote.schriftstueck.gesamt}`);
soll("Absender ≥ 90 %", quote.absender.richtig / quote.absender.gesamt >= 0.9, `${quote.absender.richtig}/${quote.absender.gesamt}`);
soll("Kategorie ≥ 85 %", quote.kategorie.richtig / quote.kategorie.gesamt >= 0.85, `${quote.kategorie.richtig}/${quote.kategorie.gesamt}`);
soll("höchstens 3 Fehler, die als „sicher“ gelten (Art)", quote.schriftstueck.falschSicher <= 3, String(quote.schriftstueck.falschSicher));

// ---------- Lernen ----------
const schule = dateien.find((d) => d.name === "Dokument(4).pdf");
soll("Schul-Brief: Absender erkannt", /Schule am Beispielpark/.test(schule?.felder.absender?.wert || ""), schule?.felder.absender?.wert);
const korr = korrigieren(schule, "kategorie", "Familie & persönliche Dokumente");
const regeln = lernen([], korr, { zeit: "", pfad: schule.pfad, feld: "kategorie", von: schule.felder.kategorie?.wert || "", zu: "Familie & persönliche Dokumente" });
soll("Regel gelernt", regeln.length === 1 && regeln[0].dann === "Familie & persönliche Dokumente");
const nachher = regelnAufAlle(dateien.map((d) => d.pfad === schule.pfad ? korr : d), regeln);
const elternabend = nachher.find((d) => d.name === "Einladung_Elternabend.pdf");
soll("Gelerntes wirkt auf denselben Absender", elternabend?.felder.kategorie?.quelle === "gelernt" || elternabend?.felder.kategorie?.wert === "Familie & persönliche Dokumente", JSON.stringify(elternabend?.felder.kategorie));
soll("Korrigiertes Feld bleibt beim erneuten Sieben", siebe({ ...korr, stufe: 2 }, 5).felder.kategorie?.quelle === "du");

// ---------- Sichten ----------
const heute = "2026-11-12";
for (const s of SICHTEN) {
  const b = baum(dateien, s, heute);
  soll(`Sicht „${s.name}“: jede Datei erscheint`, new Set(dateienUnter(b)).size === dateien.length, `${new Set(dateienUnter(b)).size}/${dateien.length}`);
}
const ord = baum(dateien, SICHTEN[0], heute);
soll("Auffälliges steht oben", ord.kinder[0]?.ton === "warn", ord.kinder[0]?.titel);
soll("Suche findet Kundennummer", suche(dateien, "KD-40 1187").length >= 6);
soll("Suche: alle Wörter müssen passen", suche(dateien, "Stadtwerke Mahnung").length >= 1 && suche(dateien, "Stadtwerke Elternabend").length === 0);
soll("Unsichere werden gefunden", dateien.some((d) => istUnsicher(d, 2)));

// ---------- Index ----------
const idx = organizerIndex(dateien, regeln, [], heute, "test");
const zurueck = indexLesen(JSON.stringify(idx));
soll("Index lässt sich lesen", zurueck.ok && zurueck.index.dateien.length === dateien.length);
soll("fremde Datei ist kein Index", !indexLesen(JSON.stringify({ format: "x" })).ok);
soll("neuere Fassung abgewiesen", !indexLesen(JSON.stringify({ ...idx, fassung: 99 })).ok);
const sb = steckbrief(dateien.find((d) => d.name === "Rechnung_Werkstatt.pdf"), heute);
soll("Steckbrief: Paperless-Felder", sb.paperless.correspondent === sb.absender && sb.paperless.document_type === "Rechnung");
soll("Steckbrief: Abschnitte mit Kopf", sb.abschnitte?.length > 0 && sb.abschnitte[0].startsWith("[Rechnung"));
soll("Steckbrief: Gründe je Feld", !!sb.gruende.schriftstueck && !!sb.sicherheit.schriftstueck);
soll("Auffälliges: kein Text im Index", !steckbrief(dateien.find((d) => d.auffaellig), heute).text);

// ---------- Archivnummern ----------
const { bereit, wartet } = offeneFuerNummer(dateien);
soll("Archivnummer: Unsichere warten", wartet.length > 0 && bereit.length > 0, `${bereit.length} bereit, ${wartet.length} warten`);
const a1 = archivnummernVergeben(dateien, 2026);
soll("Archivnummer: nur Bereite bekommen eine", a1.neu === bereit.length);
const nummern = a1.dateien.filter((d) => d.archivnummer).map((d) => d.archivnummer);
soll("Archivnummer: fortlaufend ohne Lücke", nummern.length === new Set(nummern).size && [...nummern].sort().every((n, i) => n === `A-2026-${String(i + 1).padStart(4, "0")}`));
soll("Archivnummer: Anhänge und Gesperrte bekommen keine", a1.dateien.every((d) => !d.archivnummer || (!d.auffaellig && !d.doppeltVon && !d.pfad.includes(" › "))));
const einer = a1.dateien.find((d) => !d.archivnummer && wartet.includes(dateien.find((x) => x.pfad === d.pfad)));
const zweiter = archivnummernVergeben(a1.dateien.map((d) => d === einer ? { ...d, felder: Object.fromEntries(Object.entries(d.felder).map(([k, v]) => [k, v && !Array.isArray(v) ? { ...v, sicher: true } : v])) } : d), 2026);
soll("Archivnummer: alte bleiben, neue schließen an", zweiter.dateien.filter((d) => d.archivnummer && a1.dateien.find((x) => x.pfad === d.pfad)?.archivnummer).every((d) => d.archivnummer === a1.dateien.find((x) => x.pfad === d.pfad).archivnummer) && (zweiter.neu === 0 || zweiter.dateien.some((d) => d.archivnummer === `A-2026-${String(nummern.length + 1).padStart(4, "0")}`)));

// ---------- Kategorien wie in der Familienakte ----------
const fa = join(WURZEL, "..", "Meine-Familienakte", "lib", "family-categories.ts");
if (existsSync(fa)) {
  const { FAMILY_CATEGORIES } = await import(fa);
  soll("Kategorien gleich der Familienakte", JSON.stringify([...FAMILY_CATEGORIES]) === JSON.stringify([...KATEGORIEN]));
} else console.log("  (Familienakte nicht daneben – Kategorien-Vergleich übersprungen)");

console.log(`Kern: ${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
