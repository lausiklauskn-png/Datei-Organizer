import type { Datei } from "./typen.ts";
import { erkenneArt, sha256Hex } from "./dateiart.ts";
import { leseExif } from "./exif.ts";
import { leseEml } from "./eml.ts";
import { officeText } from "./zip.ts";

/**
 * Sieb 1 und das Lesen des Textes. Die App reicht die Bytes jeder Datei herein; PDF-Text liefert eine
 * eingespritzte Funktion (im Browser pdf.js, in den Proben dieselbe Bibliothek in Node).
 * E-Mail-Anhänge werden zu eigenen Dateien „Mail.eml › Anhang“.
 */
export type PdfLeser = (bytes: Uint8Array) => Promise<{ kopf: string; voll: string }>;
export type Eingabe = { pfad: string; name: string; geaendert: number; bytes: Uint8Array };

const MAX_TEXT_BYTES = 30 * 1024 * 1024;

export async function einlesen(e: Eingabe, pdfLesen: PdfLeser, tiefe = 0): Promise<Datei[]> {
  const art = erkenneArt(e.name, e.bytes.slice(0, 600));
  const d: Datei = { pfad: e.pfad, name: e.name, groesse: e.bytes.length, geaendert: e.geaendert, art: art.art, artText: art.artText, auffaellig: art.auffaellig, stufe: 1, felder: {} };
  d.sha256 = await sha256Hex(e.bytes);
  const aus: Datei[] = [d];
  if (d.auffaellig || e.bytes.length > MAX_TEXT_BYTES) { d.textQuelle = "keiner"; return aus; }
  try {
    if (art.art === "pdf") {
      const t = await pdfLesen(e.bytes);
      d.kopfText = t.kopf; d.volltext = t.voll; d.textQuelle = t.voll.trim() ? "pdf" : "keiner";
    } else if (art.art === "bild") {
      d.bild = leseExif(e.bytes) || undefined; d.textQuelle = "keiner";
    } else if (art.art === "email" && /\.eml$/i.test(e.name)) {
      const m = leseEml(new TextDecoder("utf-8").decode(e.bytes));
      d.email = m.meta; d.volltext = `${m.meta.betreff || ""}\n\n${m.text}`.trim(); d.kopfText = d.volltext.slice(0, 1500); d.textQuelle = "email";
      if (tiefe < 3) for (const a of m.anhaenge) aus.push(...await einlesen({ pfad: `${e.pfad} › ${a.name}`, name: a.name, geaendert: e.geaendert, bytes: a.daten }, pdfLesen, tiefe + 1));
    } else if (art.art === "office" && /\.(docx|odt)$/i.test(e.name)) {
      const t = await officeText(e.bytes, e.name);
      d.volltext = t; d.kopfText = t.slice(0, 1500); d.textQuelle = t ? "office" : "keiner";
    } else if (art.art === "text") {
      const t = new TextDecoder("utf-8").decode(e.bytes.slice(0, 2_000_000));
      d.volltext = t; d.kopfText = t.slice(0, 1500); d.textQuelle = "text";
    } else d.textQuelle = "keiner";
  } catch (fehler) {
    d.textQuelle = "keiner";
    d.kopfText = undefined; d.volltext = undefined;
    d.felder.schriftstueck = { wert: "Unklar", sicher: false, grund: `Inhalt nicht lesbar (${fehler instanceof Error ? fehler.message : String(fehler)})`, quelle: "regel" };
  }
  return aus;
}

/** Doppelte am Fingerabdruck markieren: die erste (nach Pfad) bleibt, alle weiteren zeigen auf sie. */
export function doppelteMarkieren(dateien: Datei[]): Datei[] {
  const erste = new Map<string, string>();
  // Original = die ältere Datei; bei Gleichstand die ohne „Kopie“ im Namen
  const kopie = (d: Datei) => /kopie|copy|\(\d+\)/i.test(d.name) ? 1 : 0;
  for (const d of [...dateien].sort((a, b) => a.geaendert - b.geaendert || kopie(a) - kopie(b) || a.pfad.localeCompare(b.pfad, "de"))) if (d.sha256 && !erste.has(d.sha256)) erste.set(d.sha256, d.pfad);
  return dateien.map((d) => {
    const e = d.sha256 ? erste.get(d.sha256) : undefined;
    return e && e !== d.pfad ? { ...d, doppeltVon: e } : { ...d, doppeltVon: undefined };
  });
}
