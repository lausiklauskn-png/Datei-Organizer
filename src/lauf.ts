import type { Datei } from "../lib/typen.ts";

/**
 * Große Mengen in Blöcken (Klaus 13.11.: „Mengen über ~800 Dateien Schritt für Schritt“).
 * Das Einlesen merkt sich nach jedem Block, was schon gelesen ist (`Lauf`, in IndexedDB neben dem Zustand).
 * Bricht es ab (Knopf „Anhalten“, App geschlossen, Absturz, Akku), liest „Weitermachen“ nur den Rest:
 * dieselbe Quelle noch einmal, schon gelesene Dateien (gleicher Pfad und gleiches Änderungsdatum) werden übersprungen.
 * Reine Rechnung hier; Speichern in zustand.ts, Ablauf in app.tsx.
 */
export const BLOCK = 50;
export type Lauf = {
  fassung: 1;
  quelleName: string;
  quelleArt: string;
  /** gemerkter Ordner der App (Datei-Organizer Pro), falls bekannt – dann geht Weitermachen ohne Auswahl-Fenster */
  merkId?: string;
  /** hinzufügen (Drag and Drop, Teilen) statt neu einlesen */
  dazu: boolean;
  gesamt: number;
  /** Schlüssel der fertig gelesenen Quelldateien */
  erledigt: string[];
  /** was daraus wurde (Mail-Anhänge eingeschlossen) */
  dateien: Datei[];
  begonnen: string;
  zeit: string;
};
export const schluessel = (q: { pfad: string; geaendert: number }) => `${q.pfad}\u0000${q.geaendert}`;

/** Gehört ein angefangener Lauf zu dieser Quelle? Gleicher Name und gleiche Art, und die schon gelesenen Dateien liegen noch (fast alle) da. */
export function passt(l: Lauf | null, q: { name: string; art: string }, liste: Array<{ pfad: string; geaendert: number }>, dazu: boolean): boolean {
  if (!l || l.quelleName !== q.name || l.quelleArt !== q.art || l.dazu !== dazu || !l.erledigt.length) return false;
  const da = new Set(liste.map(schluessel));
  const noch = l.erledigt.filter((k) => da.has(k)).length;
  return noch >= Math.ceil(l.erledigt.length * 0.9);
}

/** Startpunkt: aus einem passenden Lauf die schon gelesenen Dateien übernehmen (nur die, deren Quelle noch da ist) und den Rest nennen. */
export function fortsetzen(l: Lauf, liste: Array<{ pfad: string; geaendert: number }>): { fertig: Datei[]; erledigt: Set<string>; rest: number } {
  const da = new Set(liste.map(schluessel));
  const erledigt = new Set(l.erledigt.filter((k) => da.has(k)));
  const pfade = new Set([...erledigt].map((k) => k.split("\u0000")[0]));
  // Mail-Anhänge heißen „Mail.eml › Anhang“: sie gehören zur Quelldatei vor dem ersten „ › “.
  const fertig = l.dateien.filter((d) => pfade.has(d.pfad.split(" › ")[0]));
  return { fertig, erledigt, rest: liste.filter((q) => !erledigt.has(schluessel(q))).length };
}

/** Text für die Meldung „angefangen“. */
export const laufText = (l: Lauf) => `Einlesen von „${l.quelleName}“ angefangen: ${l.erledigt.length} von ${l.gesamt} Dateien gelesen.`;
