import type { Datei, Korrektur, Lernregel } from "../lib/typen.ts";

/**
 * Was sich die App merkt – nur in diesem Browser (IndexedDB), nie auf einem Server:
 * die gesiebten Dateien (ohne die Originale), Korrekturen, gelernte Regeln, den gewählten Ordner (am PC).
 */
export type Gespeichert = { fassung: 1; ordnerName: string; quelle: string; stufe: number; dateien: Datei[]; verlauf: Korrektur[]; regeln: Lernregel[]; zeit: string };
const DB = "DateiOrganizer1", STORE = "kv";

function oeffnen(): Promise<IDBDatabase> {
  return new Promise((ok, nein) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error);
  });
}
async function mit<T>(modus: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await oeffnen();
  return new Promise((ok, nein) => { const t = db.transaction(STORE, modus); const r = f(t.objectStore(STORE)); r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); });
}
export async function laden(): Promise<Gespeichert | null> { try { return (await mit("readonly", (s) => s.get("zustand"))) as Gespeichert || null; } catch { return null; } }
export async function speichern(z: Gespeichert) { try { await mit("readwrite", (s) => s.put(z, "zustand")); } catch { /* ohne Speicher: nur für diese Sitzung */ } }
export async function loeschen() { try { await mit("readwrite", (s) => s.delete("zustand")); await mit("readwrite", (s) => s.delete("ordner")); await mit("readwrite", (s) => s.delete("lauf")); } catch { /* egal */ } }
export async function ordnerMerken(h: unknown) { try { await mit("readwrite", (s) => s.put(h, "ordner")); } catch { /* manche Browser speichern Ordner nicht */ } }
export async function ordnerHolen(): Promise<unknown> { try { return await mit("readonly", (s) => s.get("ordner")); } catch { return null; } }
// Angefangenes Einlesen (große Mengen in Blöcken, src/lauf.ts): nach jedem Block gemerkt, nach dem Ende gelöscht.
export async function laufLaden(): Promise<import("./lauf.ts").Lauf | null> { try { return ((await mit("readonly", (s) => s.get("lauf"))) as import("./lauf.ts").Lauf) || null; } catch { return null; } }
export async function laufSpeichern(l: import("./lauf.ts").Lauf) { try { await mit("readwrite", (s) => s.put(l, "lauf")); } catch { /* ohne Speicher: Weitermachen nur in dieser Sitzung nicht möglich */ } }
export async function laufLoeschen() { try { await mit("readwrite", (s) => s.delete("lauf")); } catch { /* egal */ } }
