import type { Datei, FeldName, Korrektur, Lernregel } from "./typen.ts";

/**
 * Lernen aus Bestätigtem (nie aus eigenen Vorschlägen): korrigiert oder bestätigt der Nutzer bei einer Datei
 * Kategorie, Art oder „betrifft“, gilt das als Beispiel für alle Dateien desselben Absenders.
 * Ein Absender, der umbenannt wird, nimmt seine Regeln mit.
 */
const LERNBAR = ["kategorie", "schriftstueck", "betrifft"] as const;
type Lernbar = (typeof LERNBAR)[number];
const lernbar = (f: FeldName): f is Lernbar => (LERNBAR as readonly string[]).includes(f);

export const schluessel = (absender: string) => absender.toLowerCase().replace(/\s+/g, " ").trim();

export function lernen(regeln: Lernregel[], datei: Datei, k: Korrektur): Lernregel[] {
  if (!lernbar(k.feld)) return regeln;
  const abs = datei.felder.absender?.wert;
  if (!abs || abs === "unbekannt" || /^eigenes foto/i.test(abs)) return regeln;
  const s = schluessel(abs);
  const alt = regeln.find((r) => schluessel(r.wenn.absender) === s && r.feld === k.feld);
  if (alt) return regeln.map((r) => r === alt ? { ...r, dann: k.zu, anzahl: r.dann === k.zu ? r.anzahl + 1 : 1 } : r);
  return [...regeln, { wenn: { absender: abs }, feld: k.feld, dann: k.zu, anzahl: 1 }];
}

/** Regel anwenden, wenn der Absender passt und das Feld nicht vom Nutzer gesetzt ist. */
export function lernregelAnwenden(d: Datei, r: Lernregel) {
  if (!d.felder.absender || schluessel(d.felder.absender.wert) !== schluessel(r.wenn.absender)) return;
  if (d.bestaetigt?.[r.feld]) return;
  const jetzt = d.felder[r.feld];
  if (jetzt?.wert === r.dann && jetzt.sicher) return;
  d.felder[r.feld] = { wert: r.dann, sicher: true, grund: `von dir gelernt: bei „${r.wenn.absender}“ ${r.anzahl === 1 ? "einmal" : `${r.anzahl}-mal`} so eingeordnet`, quelle: "gelernt" };
}

/** Eine Korrektur oder Bestätigung auf eine Datei anwenden. */
export function korrigieren(d: Datei, feld: FeldName, zu: string): Datei {
  const n: Datei = { ...d, felder: { ...d.felder }, bestaetigt: { ...d.bestaetigt, [feld]: true } };
  const alt = d.felder[feld];
  n.felder[feld] = { wert: zu, sicher: true, grund: alt && alt.wert === zu ? "von dir bestätigt" : `von dir korrigiert (vorher „${alt?.wert ?? "–"}“)`, quelle: "du" };
  return n;
}

/** Nach einer neuen Regel: auf alle schon gesiebten Dateien desselben Absenders anwenden. */
export function regelnAufAlle(dateien: Datei[], regeln: Lernregel[]): Datei[] {
  return dateien.map((d) => {
    if (d.stufe < 4) return d;
    const n: Datei = { ...d, felder: { ...d.felder } };
    for (const r of regeln) if (r.feld !== "betrifft" || d.stufe >= 5) lernregelAnwenden(n, r);
    return n;
  });
}
