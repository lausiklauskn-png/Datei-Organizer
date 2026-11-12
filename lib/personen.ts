/**
 * Wer ist gemeint – mit dem, was der Nutzer beim Start angegeben hat (Start-Assistent der Familienakte):
 * Personen des Haushalts, Fahrzeuge (Kennzeichen), feste Nummern. Diese Angaben bleiben auf dem Gerät.
 * Reine Rechnung, ohne Browser. Unsicher heißt: kein Name, nie geraten.
 */
import type { Wert } from "./typen.ts";

export type HaushaltPerson = { vorname: string; name: string; anrede: "Herr" | "Frau" | "Kind" | string; titel?: string };
export type Haushalt = { name: string; personen: HaushaltPerson[]; fahrzeuge?: Array<string | { kennzeichen: string; halter?: string }>; nummern?: Array<{ wert: string; person: string }> };

const voll = (p: HaushaltPerson) => `${p.vorname} ${p.name}`;
const kurz = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");
const w = (wert: string, sicher: boolean, grund: string): Wert => ({ wert, sicher, grund, quelle: "regel" });

export function personZuordnen(text: string, betrifft: string | undefined, h: Haushalt | null | undefined): Wert | undefined {
  if (!h?.personen?.length) return undefined;
  const t = text || "";
  // 1. Ausdrücklich genannte Person (Patient, Schüler, Kind, Versicherte, „für …“) mit Vor- und Nachname
  for (const p of h.personen) {
    const re = new RegExp(`(patient(in)?|schüler(in)?|kind|versicherte[r]?|mitglied|für|von)\\s*:?\\s*${p.vorname}\\s+${p.name}`, "i");
    if (re.test(t)) return w(voll(p), true, `„${p.vorname} ${p.name}“ ausdrücklich genannt`);
  }
  // 1b. Mail-Adresse „vorname.name@…“
  for (const p of h.personen) if (new RegExp(`\\b${p.vorname}[._-]?${p.name}@`, "i").test(t)) return w(voll(p), true, "Empfängeradresse der Mail");
  // 2. Hinterlegte Nummer (Versicherten-, Kunden-, Personalnummer …)
  for (const n of h.nummern || []) if (n.wert && kurz(t).includes(kurz(n.wert))) return w(n.person, true, `Nummer ${n.wert} gehört zu ${n.person}`);
  // 3. Anrede / Anschrift aus Sieb 5
  if (betrifft) {
    if (/^familie\b/i.test(betrifft)) return w(`Familie ${h.name}`, true, "an die Familie gerichtet");
    const m = betrifft.match(/^(herr|frau)\s+(?:dr\.\s+)?(.+)$/i);
    if (m) {
      const passend = h.personen.filter((p) => p.anrede.toLowerCase() === m[1].toLowerCase() && m[2].toLowerCase().includes(p.name.toLowerCase()));
      if (passend.length === 1) return w(voll(passend[0]), true, `${betrifft} – einzige ${m[1].toLowerCase() === "herr" ? "männliche" : "weibliche"} erwachsene Person im Haushalt`);
      if (passend.length > 1) {
        const mitVorname = passend.filter((p) => new RegExp(`\\b${p.vorname}\\b`).test(t));
        if (mitVorname.length === 1) return w(voll(mitVorname[0]), true, `${betrifft}, Vorname im Text`);
        return w(betrifft, false, `${passend.length} Personen passen zu „${betrifft}“`);
      }
    }
    const direkt = h.personen.find((p) => betrifft.toLowerCase() === voll(p).toLowerCase());
    if (direkt) return w(voll(direkt), true, "Name aus dem Schreiben");
  }
  // 4. Kennzeichen eines eigenen Fahrzeugs
  for (const f of h.fahrzeuge || []) {
    const kz = typeof f === "string" ? f : f.kennzeichen;
    if (kz && kurz(t).includes(kurz(kz))) return w(typeof f === "string" || !f.halter ? `Fahrzeug ${kz}` : f.halter, typeof f !== "string" && !!f.halter, `Kennzeichen ${kz}`);
  }
  // 5. Genau ein voller Name aus dem Haushalt im Text
  const genannt = h.personen.filter((p) => new RegExp(`\\b${p.vorname}\\s+${p.name}\\b`).test(t));
  if (genannt.length === 1) return w(voll(genannt[0]), false, "Name im Text gefunden");
  return undefined;
}
