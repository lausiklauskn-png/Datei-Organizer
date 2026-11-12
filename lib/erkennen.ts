import type { Nummer, Wert } from "./typen.ts";
import { KATEGORIE_WOERTER, UNKLAR } from "./kategorien.ts";

/**
 * Regeln für Sieb 2 bis 5 – schnell, nachvollziehbar, ohne Sprachmodell. Jede Erkennung trägt ihren Grund.
 * „sicher“ heißt: ein eindeutiges Merkmal an einer starken Stelle (Betreff, Briefkopf). Sonst „bitte prüfen“.
 */
const w = (wert: string, sicher: boolean, grund: string): Wert => ({ wert, sicher, grund, quelle: "regel" });
const klein = (s: string) => s.toLowerCase();

// ---------- Sieb 2: Art des Schriftstücks ----------
export const SCHRIFTSTUECKE = ["Mahnung", "Rechnung", "Bescheid", "Kündigung", "Vertrag", "Kontoauszug", "Abrechnung", "Befund", "Termin", "Aufforderung", "Angebot/Werbung", "Kassenbon", "Bescheinigung", "Brief", "Foto", "Unklar"] as const;

const ART_REGELN: Array<{ art: string; muster: RegExp; wort: string }> = [
  { art: "Mahnung", muster: /\b(\d\.\s*)?mahnung\b|zahlungserinnerung|letzte zahlungsaufforderung/, wort: "Mahnung" },
  { art: "Kontoauszug", muster: /kontoauszug/, wort: "Kontoauszug" },
  { art: "Abrechnung", muster: /\w*abrechnung\b/, wort: "Abrechnung" },
  { art: "Bescheid", muster: /\bbescheid\b|steuerbescheid|bewilligungsbescheid/, wort: "Bescheid" },
  { art: "Kündigung", muster: /\bkündigung\b|kündigungsbestätigung/, wort: "Kündigung" },
  { art: "Befund", muster: /\bbefund|arztbrief|laborwerte|laborbefund|entlassungsbrief/, wort: "Befund" },
  { art: "Rechnung", muster: /\brechnung\b|rechnungsnummer|rechnungsbetrag|beitragsrechnung|rechnungsdatum|zahlbar bis|your receipt/, wort: "Rechnung" },
  { art: "Termin", muster: /terminbestätigung|\beinladung\b|ihr termin|terminvereinbarung|\btermin am\b/, wort: "Termin/Einladung" },
  { art: "Aufforderung", muster: /bitte teilen sie uns|aufforderung|wir bitten sie,? (uns|bis)|bitte reichen sie|bitte senden sie/, wort: "Aufforderung" },
  { art: "Vertrag", muster: /\b\w*vertrag\b|vertragsbestätigung|vertragsunterlagen|versicherungsschein/, wort: "Vertrag" },
  { art: "Bescheinigung", muster: /\bbescheinigung\b|meldebescheinigung|lohnsteuerbescheinigung|zuwendungsbestätigung|eheurkunde|geburtsurkunde|\burkunde\b|arbeitsunfähigkeitsbescheinigung/, wort: "Bescheinigung" },
  { art: "Kassenbon", muster: /kassenbon|\bbon-nr|summe eur|bar gegeben|kartenzahlung/, wort: "Kassenbon" },
  { art: "Angebot/Werbung", muster: /angebot der woche|nur für kurze zeit|jetzt bestellen|newsletter|rabatt|gutschein/, wort: "Werbung" },
];

/** kopf = Anfang des Textes (Betreff steht dort), betreff = E-Mail-Betreff falls vorhanden */
export function erkenneSchriftstueck(kopf: string, betreff = ""): Wert {
  const vorne = klein(`${betreff}\n${kopf.slice(0, 700)}`);
  const alles = klein(kopf);
  for (const r of ART_REGELN) if (r.muster.test(vorne)) return w(r.art, true, `„${r.wort}“ im Kopf oder Betreff`);
  for (const r of ART_REGELN) if (r.muster.test(alles)) return w(r.art, false, `„${r.wort}“ erst weiter unten im Text`);
  if (/sehr geehrte|liebe |hallo /.test(alles)) return w("Brief", false, "Anrede gefunden, aber kein klares Wort für die Art");
  return w(UNKLAR, false, "kein Merkmal für die Art gefunden");
}

// ---------- Datum ----------
const MONATE = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];

export function datumeImText(t: string): Array<{ iso: string; pos: number }> {
  const aus: Array<{ iso: string; pos: number }> = [];
  for (const m of t.matchAll(/\b(\d{1,2})\.\s?(\d{1,2})\.\s?(\d{4}|\d{2})\b/g)) {
    const j = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    const iso = isoDatum(j, Number(m[2]), Number(m[1]));
    if (iso) aus.push({ iso, pos: m.index ?? 0 });
  }
  for (const m of klein(t).matchAll(/\b(\d{1,2})\.\s?(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)\s(\d{4})\b/g)) {
    const iso = isoDatum(Number(m[3]), MONATE.indexOf(m[2]) + 1, Number(m[1]));
    if (iso) aus.push({ iso, pos: m.index ?? 0 });
  }
  return aus.sort((a, b) => a.pos - b.pos);
}

export function isoDatum(j: number, m: number, t: number): string | null {
  if (j < 1990 || j > 2100 || m < 1 || m > 12 || t < 1 || t > 31) return null;
  const d = new Date(Date.UTC(j, m - 1, t));
  if (d.getUTCMonth() !== m - 1) return null;
  return d.toISOString().slice(0, 10);
}

export function erkenneDatum(kopf: string): Wert | undefined {
  const m = kopf.match(/(?:datum|den|vom)\s*:?\s*(\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4})/i) || kopf.match(/[A-ZÄÖÜ][a-zäöüß-]+,\s*(?:den\s*)?(\d{1,2}\.\s?\d{1,2}\.\s?\d{4})/);
  if (m) { const d = datumeImText(m[1])[0]; if (d) return w(d.iso, true, `Briefdatum „${m[0].trim()}“`); }
  const erstes = datumeImText(kopf.slice(0, 900))[0];
  return erstes ? w(erstes.iso, false, "erstes Datum im Kopf") : undefined;
}

// ---------- Sieb 3: Nummern ----------
const NUMMER_REGELN: Array<{ art: string; muster: RegExp }> = [
  { art: "Kundennummer", muster: /(?:kunden(?:-?nr\.?|nummer)|kd\.?-?nr\.?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ ]{2,20}[A-Z0-9])/i },
  { art: "Rechnungsnummer", muster: /(?:rechnungs(?:-?nr\.?|nummer)|rg\.?-?nr\.?|beleg(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i },
  { art: "Vertragsnummer", muster: /(?:vertrags(?:-?nr\.?|nummer)|versicherungs(?:-?nr\.?|nummer|schein-?nr\.?)|police(?:n-?nr\.?|nummer)?)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ ]{2,20}[A-Z0-9])/i },
  { art: "Aktenzeichen", muster: /(?:aktenzeichen|\baz\.?|geschäftszeichen|zeichen)\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ .]{2,24}[A-Z0-9])/i },
  { art: "Steuernummer", muster: /(?:steuer(?:-?nr\.?|nummer))\s*[:.]?\s*(\d{2,3}\/\d{3}\/\d{4,5})/i },
  { art: "Mitgliedsnummer", muster: /(?:mitglieds(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{2,20})/i },
  { art: "Auftragsnummer", muster: /(?:auftrags(?:-?nr\.?|nummer)|bestell(?:-?nr\.?|nummer)|order(?:-?nr\.?| number))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{2,24})/i },
  { art: "Personalnummer", muster: /(?:personal(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/]{1,15})/i },
  { art: "Zählernummer", muster: /(?:zähler(?:-?nr\.?|nummer))\s*[:.]?\s*([A-Z0-9][A-Z0-9\-/ ]{3,20}[A-Z0-9])/i },
  { art: "Sendungsnummer", muster: /(?:sendungs(?:-?nr\.?|nummer)|tracking)\s*[:.]?\s*([A-Z0-9]{8,30})/i },
];

export function erkenneNummern(t: string): Nummer[] {
  const aus: Nummer[] = [];
  const gesehen = new Set<string>();
  const neu = (art: string, wert: string) => { const k = `${art}|${wert}`; if (!gesehen.has(k)) { gesehen.add(k); aus.push({ art, wert }); } };
  for (const r of NUMMER_REGELN) { const m = t.match(r.muster); if (m) neu(r.art, m[1].trim().replace(/\s{2,}/g, " ")); }
  const iban = t.match(/\b([A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?)\b/);
  if (iban) { const roh = iban[1].replace(/\s/g, ""); neu("IBAN", `${roh.slice(0, 4)} … ${roh.slice(-4)}`); }
  for (const k of kennzeichenImText(t)) neu("Kennzeichen", k);
  return aus;
}

/** Deutsche Kennzeichen „HH-AB 1234“, „BSP-FA 12“ (mit Bindestrich oder Leerzeichen, optional E/H). */
export function kennzeichenImText(t: string): string[] {
  const aus = new Set<string>();
  for (const m of t.matchAll(/\b([A-ZÄÖÜ]{1,3})[- ]([A-Z]{1,2})[ -]?(\d{1,4})([EH])?\b/g)) {
    // „Kennzeichen“ in der Nähe oder typisches Format; vermeidet „IBAN DE12“ u. ä.
    const umfeld = klein(t.slice(Math.max(0, (m.index ?? 0) - 40), (m.index ?? 0)));
    if (/kennzeichen|kfz|fahrzeug|amtl/.test(umfeld) || m[0].includes("-")) aus.add(`${m[1]}-${m[2]} ${m[3]}${m[4] || ""}`);
  }
  return [...aus];
}

// ---------- Sieb 3: Kategorie ----------
const NACH_ART: Record<string, string> = { Kontoauszug: "Finanzen & Konten", Befund: "Gesundheit & Pflege", Kassenbon: "Einkäufe, Rechnungen & Garantien" };

/** Eindeutige Schriftstück-Namen schlagen einzelne Wörter (z. B. „Krankenversicherung“ auf jeder Gehaltsabrechnung). */
const STARKE_SIGNALE: Array<[RegExp, string]> = [
  [/lohnsteuerbescheinigung/, "Steuern & Behörden"], [/umsatzsteuer-voranmeldung/, "Steuern & Behörden"], [/einnahmenüberschussrechnung|jahresabschluss|betriebswirtschaftliche auswertung/, "Steuern & Behörden"],
  [/zuwendungsbestätigung/, "Steuern & Behörden"], [/schenkungsteuer/, "Steuern & Behörden"], [/rundfunkbeitrag/, "Steuern & Behörden"],
  [/meldebescheinigung zur sozialversicherung|jahresmeldung/, "Rente, Arbeit & Sozialversicherung"], [/renteninformation|rentenanpassung|bezügemitteilung/, "Rente, Arbeit & Sozialversicherung"],
  [/schenkungsvertrag|vorsorgevollmacht|testament/, "Erbschaft, Vollmachten & Vorsorge"], [/arbeitsunfähigkeitsbescheinigung|befundbericht|arztbrief/, "Gesundheit & Pflege"],
  [/kindergeld|unterhaltsvorschuss|elterngeld/, "Familie & persönliche Dokumente"], [/medizinischen rehabilitation|\breha\b|mutter-kind/, "Gesundheit & Pflege"], [/wohngeld/, "Haus & Wohnung"], [/\bliter\b|eur\/l\b|zapfsäule|tankstelle/, "Auto & Mobilität"],
];
const WORT_ZEICHEN = /[a-zäöüß0-9]/;
function wortAnfang(text: string, wort: string): boolean {
  for (let i = text.indexOf(wort); i >= 0; i = text.indexOf(wort, i + 1)) if (i === 0 || !WORT_ZEICHEN.test(text[i - 1])) return true;
  return false;
}

export function erkenneKategorie(text: string, absender = "", art = ""): Wert {
  const t = ` ${klein(text)} `, a = ` ${klein(absender)} `;
  const punkte: Array<{ k: string; p: number; worte: string[] }> = [];
  for (const [k, worte] of Object.entries(KATEGORIE_WOERTER)) {
    let p = 0; const treffer: string[] = [];
    for (const wort of worte) {
      // Wortanfang zählt (versicherung… trifft „Versicherungsnummer“), Wortmitte nicht („gas“ nicht in „Gast“, „abo“ nicht in „Labor“).
      if (a.includes(wort.trim())) { p += 3; treffer.push(wort); }
      else if (wortAnfang(t, wort)) { p += 1; treffer.push(wort); }
    }
    if (NACH_ART[art] === k) { p += 2; treffer.push(art); }
    for (const [signal, kat] of STARKE_SIGNALE) if (kat === k && signal.test(t)) { p += 6; treffer.unshift(signal.source.replace(/\\b|\\/g, "")); }
    if (p) punkte.push({ k, p, worte: treffer });
  }
  punkte.sort((x, y) => y.p - x.p);
  if (!punkte.length) return w(art === "Brief" || art === "Unklar" ? "Korrespondenz" : UNKLAR, false, "kein Wort eines Lebensbereichs gefunden");
  const [erster, zweiter] = punkte;
  const sicher = erster.p >= 3 && (!zweiter || erster.p - zweiter.p >= 2);
  return w(erster.k, sicher, `Wörter: ${erster.worte.slice(0, 3).join(", ")}${zweiter && !sicher ? ` – knapp vor „${zweiter.k}“` : ""}`);
}

// ---------- Sieb 4: Absender ----------
const FIRMA = /\b(gmbh|ag|kg|ggmbh|e\.\s?v\.|eg|ohg|mbh|ug|se|mvz|stadtwerke|dr\.|zahnarzt|kita|hort|markt|stadt|gemeinde|landkreis|landesbetrieb|jobcenter|agentur|universität|hochschule|notariat|studierendenwerk|gewerkschaft|apotheke|optik|inkasso|auskunftei|tankstelle|bäckerei|drogerie|baumarkt|discount|frischmarkt)\b|(amt|kasse|schule|gymnasium|gericht|werke|versicherung|gesellschaft|zentrum|stelle|behörde|kammer|genossenschaft|service|praxis|klinik|klinikum|labor|verein|verband|büro|institut|kanzlei|beratung|verwaltung|bank|sparkasse|verlag|haus|therapie|rentenversicherung)\b/i;

/** Absender unter der Grußformel (wenn der Briefkopf fehlt): „Mit freundlichen Grüßen / Firma GmbH“. */
export function absenderAusGruss(text: string): Wert | undefined {
  const m = text.match(/(?:mit freundlichen grüßen|freundliche grüße|mit freundlichem gruß|viele grüße|herzliche grüße)\s*\n+\s*([^\n]{3,70})/i);
  if (m && FIRMA.test(m[1])) return w(m[1].trim(), true, "unter der Grußformel");
  return undefined;
}

export function erkenneAbsender(kopf: string): Wert | undefined {
  const zeilen = kopf.split(/\r?\n/).map((z) => z.trim()).filter(Boolean).slice(0, 18);
  // Absenderzeile über dem Anschriftfeld: „Firma · Straße · PLZ Ort“
  for (const z of zeilen) {
    const m = z.match(/^(.+?)\s+[·|•]\s+.+\d{5}\s/);
    if (m && FIRMA.test(m[1])) return w(m[1].trim(), true, "Absenderzeile über der Anschrift");
  }
  for (const roh of zeilen.slice(0, 6)) { const z = roh.replace(/^(arbeitgeber|absender|von|aussteller)\s*:\s*/i, "");
    if (FIRMA.test(z) && z.length <= 70 && !/^(herrn|frau|familie)\b/i.test(z)) return w(z.replace(/[,;]$/, ""), true, "Briefkopf oben"); }
  const erste = zeilen[0];
  if (erste && erste.length <= 60 && !/sehr geehrte|^(herrn|frau|familie|an die)\b|\d{2}\.\d{2}\.|\d,\d{2}/i.test(erste)) return w(erste, false, "erste Zeile, ohne Firmenmerkmal");
  return undefined;
}

// ---------- Sieb 5: wer ist gemeint, Frist, Betrag ----------
export function erkenneBetrifft(text: string): Wert | undefined {
  const anrede = text.match(/sehr geehrte[r]?\s+(frau|herr)\s+((?:dr\.\s+)?[A-ZÄÖÜ][\wäöüß-]+(?:\s[A-ZÄÖÜ][\wäöüß-]+)?)/i);
  if (anrede) return w(`${anrede[1][0].toUpperCase()}${anrede[1].slice(1).toLowerCase()} ${anrede[2]}`, true, `Anrede „${anrede[0].trim()}“`);
  const anredeFamilie = text.match(/(?:sehr geehrte|liebe)\s+familie\s+([A-ZÄÖÜ][\wäöüß-]+)/i);
  if (anredeFamilie) return w(`Familie ${anredeFamilie[1]}`, true, `Anrede „${anredeFamilie[0].trim()}“`);
  // ausdrücklich genannte Person (Schüler, Kind, Patient) – vor dem Anschriftfeld, das bei Schulbriefen nur die Eltern nennt
  const rolle = text.match(/(?:patient(?:in)?|schüler(?:in)?|kind|versicherte[r]?)\s*:\s*([A-ZÄÖÜ][\wäöüß-]+(?:\s[A-ZÄÖÜ][\wäöüß-]+)?)/i);
  if (rolle) return w(rolle[1], true, `„${rolle[0].trim()}“`);
  const feld = text.match(/^(herrn|frau)\s*\n?\s*([A-ZÄÖÜ][\wäöüß-]+(?:\s[A-ZÄÖÜ][\wäöüß-]+)+)/im);
  if (feld) return w(`${/herrn/i.test(feld[1]) ? "Herr" : "Frau"} ${feld[2].split(" ").slice(-1)[0]}`, true, "Anschriftfeld");
  const familie = text.match(/^familie\s+([A-ZÄÖÜ][\wäöüß-]+)/im);
  if (familie) return w(`Familie ${familie[1]}`, true, "Anschriftfeld „Familie …“");
  const k = kennzeichenImText(text)[0];
  if (k) return w(`Fahrzeug ${k}`, true, "Kennzeichen im Text");
  if (/sehr geehrte damen und herren|liebe eltern|liebe kundin|lieber kunde/i.test(text)) return w("allgemein", false, "allgemeine Anrede");
  return undefined;
}

export function erkenneFrist(text: string, dokumentDatum?: string): Wert | undefined {
  const t = text.replace(/\s+/g, " ");
  const stark = t.match(/(?:bis (?:spätestens |zum )?|spätestens (?:am |bis )?|fällig (?:am |zum )?|zahlbar bis (?:zum )?|frist(?:ende)?:?\s*|termin am |am )(\d{1,2}\.\s?\d{1,2}\.\s?\d{4})/i);
  if (stark) { const d = datumeImText(stark[1])[0]; if (d) return w(d.iso, true, `„${stark[0].trim()}“`); }
  const tage = t.match(/innerhalb (?:von )?(\d{1,3}) tagen|binnen (\d{1,3}) tagen/i);
  if (tage && dokumentDatum) {
    const n = Number(tage[1] || tage[2]);
    const d = new Date(`${dokumentDatum}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n);
    return w(d.toISOString().slice(0, 10), false, `„${tage[0]}“ ab Briefdatum gerechnet`);
  }
  const monat = t.match(/innerhalb eines monats/i);
  if (monat && dokumentDatum) {
    const d = new Date(`${dokumentDatum}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1);
    return w(d.toISOString().slice(0, 10), false, "„innerhalb eines Monats“ ab Briefdatum gerechnet");
  }
  return undefined;
}

export function erkenneBetrag(text: string): Wert | undefined {
  const t = text.replace(/\s+/g, " ");
  const genannt = t.match(/(?:gesamtbetrag|rechnungsbetrag|zu zahlen|betrag|summe|offener betrag)[^0-9]{0,30}(\d{1,3}(?:\.\d{3})*,\d{2})\s?(?:€|eur)/i)
    || t.match(/(?:summe|gesamt|total|zu zahlen)\s*(?:eur|€)?\s*:?\s*(\d{1,3}(?:\.\d{3})*,\d{2})(?!\d)/i);
  if (genannt) return w(`${genannt[1]} €`, true, `„${genannt[0].trim()}“`);
  const alle = [...t.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s?(?:€|eur)\b/gi)].map((m) => m[1]);
  if (!alle.length) return undefined;
  const zahl = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
  const groesster = alle.sort((a, b) => zahl(b) - zahl(a))[0];
  return w(`${groesster} €`, false, "größter Betrag im Text");
}

/** Dringlichkeit aus der Frist, bezogen auf heute (ISO). */
export function dringlichkeit(frist: string | undefined, heute: string): "Frist überschritten" | "diese Woche" | "später" | "keine Frist" {
  if (!frist) return "keine Frist";
  if (frist < heute) return "Frist überschritten";
  const tage = (Date.parse(`${frist}T12:00:00Z`) - Date.parse(`${heute}T12:00:00Z`)) / 864e5;
  return tage <= 7 ? "diese Woche" : "später";
}
