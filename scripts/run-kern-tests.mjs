// Proben für den Sortier-Kern (lib/) – ohne Browser. Misst zusätzlich die Trefferquote an den Testdaten.
// Aufruf: node scripts/run-kern-tests.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { erkenneArt } from "../lib/dateiart.ts";
import { exifStueck, leseExif, verbinde } from "../lib/exif.ts";
import { leseEml, kopfDekodieren } from "../lib/eml.ts";
import { officeText } from "../lib/zip.ts";
import { erkenneSchriftstueck, erkenneNummern, erkenneFrist, erkenneBetrag, erkenneBetrifft, erkenneAbsender, absenderAusGruss, erkenneKategorie, dringlichkeit, kennzeichenImText, erkenneDatum } from "../lib/erkennen.ts";
import { personZuordnen } from "../lib/personen.ts";
import { siebe, istUnsicher } from "../lib/siebe.ts";
import { einlesen, doppelteMarkieren } from "../lib/einlesen.ts";
import { pdfTextLesen } from "../lib/pdf-text.ts";
import { textPdf } from "../lib/test-pdf.ts";
import { lernen, korrigieren, regelnAufAlle, lernregelAnwenden } from "../lib/lernen.ts";
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
// Geändert 13.11.2026: eine bloße Einspruchs- oder Widerspruchsfrist ist nach der Fachregel keine Frist des Haushalts (vorher: gerechnet, unsicher).
soll("bloße Einspruchsfrist ist keine Frist", erkenneFrist("Gegen diesen Bescheid können Sie innerhalb eines Monats Einspruch einlegen.", "2026-10-08") === undefined);
soll("Zahlungsfrist in Tagen gerechnet, unsicher", (() => { const f = erkenneFrist("Der Betrag ist zahlbar innerhalb von 14 Tagen ohne Abzug.", "2026-10-08"); return f?.wert === "2026-10-22" && !f.sicher; })());
soll("Frist mit Wochentag und Monatsnamen", erkenneFrist("Bitte senden Sie uns den Fragebogen bis spätestens Freitag, 5. Februar 2027 zurück.")?.wert === "2027-02-05");
soll("Frist: die neue Zahlungsfrist, nicht die alte Fälligkeit", erkenneFrist("Die Rechnung war am 02.03.2027 fällig. Bitte überweisen Sie den offenen Betrag bis 20.03.2027.", "2027-03-10")?.wert === "2027-03-20");
soll("Frist ohne Jahr aus dem Briefdatum", erkenneFrist("Fälligkeiten: 15.02. 80,00 EUR · 15.05. 80,00 EUR", "2027-01-11")?.wert === "2027-02-15");
soll("Termin mit Wochentag und Uhrzeit", (() => { const f = erkenneFrist("Ihr Termin: Dienstag, 09.03.2027, 10:40 Uhr in unserer Praxis."); return f?.wert === "2027-03-09" && f.sicher; })());
soll("keine Frist: Abbuchung per Lastschrift", erkenneFrist("Der Beitrag von 84,00 EUR ist fällig am 01.04.2027 und wird per Lastschrift von Ihrem Konto abgebucht.", "2027-03-01") === undefined);
soll("keine Frist: Garantie und Gültigkeit", erkenneFrist("Garantie bis 14.06.2029. Der Ausweis ist gültig bis 31.12.2030.", "2027-06-14") === undefined);
soll("keine Frist: Briefdatum und Vertragsbeginn", erkenneFrist("Beispielstadt, 03.05.2027\nVersicherungsbeginn: 01.06.2027, 0 Uhr\nIhr Vertrag vom 12.04.2027", "2027-05-03") === undefined);
soll("keine Frist: Kündigungsrecht", erkenneFrist("Sie können den Vertrag bis zum 30.09.2027 kündigen.", "2027-08-01") === undefined);
soll("Betrag genannt", erkenneBetrag("Rechnungsbetrag: 1.240,00 €")?.wert === "1.240,00 €");
soll("Tausenderpunkt bleibt im Betrag", erkenneBetrag("Summe 12.345,67 EUR")?.wert === "12.345,67 €");
soll("betrifft aus Anrede", erkenneBetrifft("Sehr geehrte Frau Beispiel,")?.wert === "Frau Beispiel");
soll("betrifft Familie aus Anschrift", erkenneBetrifft("Familie Beispiel\nMusterweg 1")?.wert === "Familie Beispiel");
soll("Absender aus Absenderzeile", erkenneAbsender("Stadtwerke Beispielstadt GmbH\nStadtwerke Beispielstadt GmbH · Werkstraße 5 · 00001 Beispielstadt")?.wert === "Stadtwerke Beispielstadt GmbH");
soll("Absender: Aktenzeichen in der zweiten Spalte fällt weg", erkenneAbsender("Wasserverband Musterau            Az. WV-27-0042\nUferweg 3, 00002 Musterau\n\nHerrn Max Beispiel")?.wert === "Wasserverband Musterau");
soll("Absender: Abteilung und Werbespruch fallen weg", erkenneAbsender("Beispielbank eG – Ihre Bank vor Ort\nHerrn Max Beispiel\nMusterweg 1")?.wert === "Beispielbank eG" && erkenneAbsender("Muster Versicherung AG · Schadenservice\nFrau Erika Beispiel")?.wert === "Muster Versicherung AG");
soll("Absender: Behörde behält die Stelle", erkenneAbsender("Stadt Beispielstadt – Ordnungsamt\nRathausplatz 1, 00001 Beispielstadt")?.wert === "Stadt Beispielstadt – Ordnungsamt");
soll("Absender: erste Zeile vor der Abteilungszeile", erkenneAbsender("Musterwerke Energie GmbH\nKundenservice · Werkstraße 5 · 00001 Beispielstadt\n\nHerrn Max Beispiel")?.wert === "Musterwerke Energie GmbH");
soll("Absender: Überschrift ist kein Absender", erkenneAbsender("KAUFVERTRAG über ein gebrauchtes Fahrrad\nVerkäufer:  Paul Probe, Testgasse 4, 00003 Probstadt\nKäufer:     Max Beispiel")?.wert === "Paul Probe");
soll("Absender: Inh. und Anschrift fallen weg", erkenneAbsender("Radladen Speiche · Inh. P. Probe · Testgasse 4 · 00003 Probstadt\nRechnung Nr. 12")?.wert === "Radladen Speiche");
soll("Absender: privater Brief, Unterschrift unter dem Gruß, unsicher", (() => { const t = "                         Musterau, 3. März 2027\n\nLiebe Erika,\n\nvielen Dank für die Karte.\n\nHerzliche Grüße\nTante Berta"; const a = erkenneAbsender(t) || absenderAusGruss(t); return a?.wert === "Tante Berta" && !a.sicher; })());
soll("Absender: gespeicherte Mail, Fußzeile passt zur Adresse", (() => { const t = "Von: service@musterversand.example\nAn: max.beispiel@post.example\nBetreff: Ihre Bestellung\nDatum: 04.03.2027 09:00\n\nHallo Herr Beispiel,\nIhr Paket ist unterwegs.\n\nIhr Serviceteam\nMusterversand Handels GmbH · Lagerweg 2 · 00004 Lagerstadt"; return erkenneAbsender(t) === undefined && absenderAusGruss(t)?.wert === "Musterversand Handels GmbH"; })());
soll("Absender: gespeicherte Mail, Anzeigename", absenderAusGruss("Von: Paul Probe <paul.probe@post.example>\nBetreff: Samstag\n\nHallo Max,\nklappt es?\nGruß\nPaul")?.wert === "Paul Probe");
const hh = { name: "Familie Beispiel", personen: [{ vorname: "Max", name: "Beispiel", anrede: "Herr" }, { vorname: "Erika", name: "Beispiel", anrede: "Frau" }, { vorname: "Lina", name: "Beispiel", anrede: "Kind" }, { vorname: "Tom", name: "Beispiel", anrede: "Kind" }], fahrzeuge: ["Kombi BSP-MB 12"] };
soll("Person: einziges genanntes Kind, auch wenn der Brief an die Mutter geht", personZuordnen("Frau\nErika Beispiel\nMusterweg 1\n\nSehr geehrte Frau Beispiel,\nIhre Tochter Lina hat den Schwimmkurs bestanden.", "Frau Beispiel", hh)?.wert === "Lina Beispiel");
soll("Person: Rollenwort mit „Name, Vorname“", (() => { const p = personZuordnen("Pat.: Beispiel, Tom, geb. 01.02.2018\nBefund unauffällig.", undefined, hh); return p?.wert === "Tom Beispiel" && p.sicher; })());
soll("Person: Eheleute gemeinsam → keine Person", personZuordnen("Herrn und Frau\nMax und Erika Beispiel\nMusterweg 1\n\nSehr geehrte Frau Beispiel, sehr geehrter Herr Beispiel,\nIhr Steuerbescheid.", "Frau Beispiel", hh) === undefined);
soll("Person: „V. Name“ im Text", personZuordnen("Rechnung für Herrn M. Beispiel, Musterweg 1", undefined, hh)?.wert === "Max Beispiel");
soll("Person: Haushalt mit einer Person, ohne Namen nie sicher", (() => { const p = personZuordnen("Kassenbon 12,40 EUR", undefined, { name: "Probe", personen: [{ vorname: "Paul", name: "Probe", anrede: "Herr" }] }); return p?.wert === "Paul Probe" && !p.sicher; })());
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
soll("Regel gelernt (nach Absender, dazu nach Sache)", regeln.filter((r) => !r.wenn.sache).length === 1 && regeln.length <= 2 && regeln.every((r) => r.dann === "Familie & persönliche Dokumente"));
{ // Punkt 7: dieselbe Firma, zwei Sachen – die Sach-Regel greift nur bei ihrem Vorschlag, die Absender-Regel nur ohne Widerspruch
  const d = (k) => ({ pfad: k, name: k, groesse: 1, geaendert: 0, stufe: 5, felder: { absender: { wert: "Stadtwerke Beispiel", sicher: true, grund: "", quelle: "regel" }, kategorie: { wert: k, sicher: false, grund: "", quelle: "regel" } } });
  let r = lernen([], d("Energie & Versorgung"), { zeit: "", pfad: "a", feld: "kategorie", von: "Energie & Versorgung", zu: "Energie & Versorgung" });
  r = lernen(r, d("Haus & Wohnung"), { zeit: "", pfad: "b", feld: "kategorie", von: "Haus & Wohnung", zu: "Haus & Wohnung" });
  r = lernen(r, d("Energie & Versorgung"), { zeit: "", pfad: "c", feld: "kategorie", von: "Energie & Versorgung", zu: "Haus & Wohnung" });
  const strom = d("Energie & Versorgung"), wasser = d("Haus & Wohnung"); for (const x of r) { lernregelAnwenden(strom, x); lernregelAnwenden(wasser, x); }
  soll("Merken nach Sache: Absender mit zwei Sachen folgt der Sach-Regel", wasser.felder.kategorie.wert === "Haus & Wohnung" && /wenn „Haus & Wohnung“ vorgeschlagen war/.test(wasser.felder.kategorie.grund || "Haus & Wohnung"), JSON.stringify(wasser.felder.kategorie));
  soll("Merken nach Sache: widersprüchliche Absender-Regel wirkt nicht allein", r.some((x) => !x.wenn.sache && Object.keys(x.stimmen || {}).length > 1));
}
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

// Wortmodell (lib/wortmodell.ts): Zusammenspiel mit den Regeln – ausgedachte Beispiele
{
  const { mitModell, vorhersage, merkmale, wortmodellSchalter, bereichMitModell, MODELL_VOR_REGEL } = await import("../lib/wortmodell.ts");
  const { WORTMODELL_BEREICH, WORTMODELL_ART } = await import("../lib/wortmodell-daten.ts");
  const klein = { fassung: 2, konten: ["A", "B", "Archiv"], vorab: [0, 0, 0], gewichte: { apfel: [0, 6], birne: [0, 5], kirsche: [1, 9], pflaume: [1, 9], karton: [2, 9], ablage: [2, 9] }, belege: 9 };
  const sichereRegel = { wert: "B", sicher: true, grund: "Regel", quelle: "regel" }, offeneRegel = { wert: "B", sicher: false, grund: "Regel", quelle: "regel" };
  soll("Wortmodell: klares Modell überstimmt die sichere Regel", mitModell(sichereRegel, klein, "Apfel und Birne")?.wert === "A");
  soll("Wortmodell: knappes Modell lässt die sichere Regel stehen", mitModell(sichereRegel, { ...klein, gewichte: { apfel: [0, 2], birne: [0, 2] } }, "Apfel und Birne")?.wert === "B");
  soll("Wortmodell: unsichere Regel weicht dem Modell, bleibt aber unsicher bei kleinem Abstand", (() => { const w = mitModell(offeneRegel, { ...klein, gewichte: { apfel: [0, 2], birne: [0, 2] } }, "Apfel und Birne"); return w?.wert === "A" && w.sicher === false; })());
  soll("Wortmodell: ein einzelnes Wort reicht nicht", mitModell(sichereRegel, klein, "nur ein Apfel hier")?.wert === "B" && mitModell(undefined, klein, "nur ein Apfel hier") === undefined);
  soll("Wortmodell: schlägt nie „Archiv“ vor", mitModell(offeneRegel, klein, "Karton in der Ablage")?.wert === "B");
  soll("Wortmodell: Grund nennt die gelernten Wörter", /apfel|birne/.test(mitModell(offeneRegel, klein, "Apfel und Birne")?.grund || ""));
  soll("Wortmodell: abgeschaltet gilt die Regel", (() => { wortmodellSchalter.an = false; const w = mitModell(sichereRegel, klein, "Apfel und Birne"); wortmodellSchalter.an = true; return w === sichereRegel; })());
  soll("Wortmodell: Schwelle wie abgestimmt", MODELL_VOR_REGEL === 8);
  soll("Wortmodell-Daten: 18 Bereiche ohne Fotos/Unklar, 14 Arten", WORTMODELL_BEREICH.konten.length === 18 && WORTMODELL_ART.konten.length === 14 && !WORTMODELL_BEREICH.konten.includes("Unklar"));
  const hund = "Tierarztpraxis am Mühlbach\nRechnung für die Impfung und Wurmkur Ihres Hundes Bello, Behandlung vom 3. Mai. Bitte überweisen Sie den Betrag.";
  soll("Wortmodell: echter Bereich kommt aus der Liste", KATEGORIEN.includes(bereichMitModell(undefined, hund)?.wert ?? "Korrespondenz"));
  soll("Wortmodell: Vorhersage nennt Abstand und Zweites", (() => { const v = vorhersage(WORTMODELL_ART, merkmale("Letzte Mahnung: Trotz unserer Zahlungserinnerung ist der offene Betrag nicht eingegangen. Mahngebühr und Verzugszinsen kommen hinzu.")); return v?.wert === "Mahnung" && v.abstand > 0 && !!v.zweites; })());
}

console.log(`Kern: ${gruen} grün · ${rot} ROT`);
process.exit(rot ? 1 : 0);
