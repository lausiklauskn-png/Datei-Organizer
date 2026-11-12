/**
 * Woher die Dateien kommen. Die Originale bleiben, wo sie sind – gelesen wird nur; zurückgeschrieben wird
 * höchstens organizer-index.json (und nur, wo der Ordner das erlaubt).
 *
 * 1 Ordner am PC (Chrome/Edge): Ordnerwahl des Browsers, lesen und schreiben.
 * 2 Familienakte Pro (Android/Windows): der Ordnerzugriff der App (FamilyFolders, Android-Ordnerwahl, auch SD-Karte).
 *   So kommt der Organizer an „SD-Karte › Datei-Organizer“. Am Gerät noch ungeprüft.
 * 3 Dateien oder Ordner wählen (jeder Browser, auch am Handy): nur lesen, der Index wird heruntergeladen.
 * 4 Testordner: die erfundenen Testdaten aus dem Repo.
 */
export type QuellDatei = { pfad: string; name: string; geaendert: number; lesen: () => Promise<Uint8Array> };
export type Quelle = {
  art: "ordner" | "nativ" | "auswahl" | "test";
  name: string;
  dateien: () => Promise<QuellDatei[]>;
  /** Index in den Ordner schreiben; fehlt, wenn der Ordner nur gelesen werden kann. */
  schreiben?: (name: string, text: string) => Promise<void>;
  /** Vorhandenen Index lesen, falls da. */
  indexLesen?: () => Promise<string | null>;
};

export const INDEX_NAME = "organizer-index.json";
import { ueberspringen as UEBERSPRINGEN } from "../lib/einlesen.ts";

// ---------- 1 Ordner am PC ----------
type DirHandle = { name: string; kind: "directory"; values: () => AsyncIterable<FileHandle | DirHandle>; getFileHandle: (n: string, o?: { create?: boolean }) => Promise<FileHandle>; queryPermission?: (o: { mode: string }) => Promise<string>; requestPermission?: (o: { mode: string }) => Promise<string> };
type FileHandle = { name: string; kind: "file"; getFile: () => Promise<File>; createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }> };
type FensterMitOrdner = Window & { showDirectoryPicker?: (o?: { mode?: string; id?: string }) => Promise<DirHandle> };

export const ordnerWahlMoeglich = () => typeof window !== "undefined" && typeof (window as FensterMitOrdner).showDirectoryPicker === "function";

export async function ordnerWaehlen(): Promise<Quelle | null> {
  try {
    const h = await (window as FensterMitOrdner).showDirectoryPicker!({ mode: "readwrite", id: "datei-organizer" });
    return ausHandle(h);
  } catch (e) { if ((e as Error).name === "AbortError") return null; throw e; }
}

export function ausHandle(h: DirHandle): Quelle {
  return {
    art: "ordner", name: h.name,
    async dateien() {
      const aus: QuellDatei[] = [];
      const lauf = async (d: DirHandle, pfad: string, tiefe: number) => {
        if (tiefe > 12) return;
        for await (const e of d.values()) {
          if (UEBERSPRINGEN(e.name)) continue;
          const p = pfad ? `${pfad}/${e.name}` : e.name;
          if (e.kind === "directory") await lauf(e, p, tiefe + 1);
          else { const fh = e; const f = await fh.getFile(); aus.push({ pfad: p, name: e.name, geaendert: f.lastModified, lesen: async () => new Uint8Array(await (await fh.getFile()).arrayBuffer()) }); }
        }
      };
      await lauf(h, "", 0);
      return aus.sort((a, b) => a.pfad.localeCompare(b.pfad, "de"));
    },
    async schreiben(name, text) { const f = await h.getFileHandle(name, { create: true }); const w = await f.createWritable(); await w.write(text); await w.close(); },
    async indexLesen() { try { return await (await (await h.getFileHandle(INDEX_NAME)).getFile()).text(); } catch { return null; } },
  };
}

export async function erlaubnisPruefen(h: DirHandle): Promise<boolean> {
  try {
    if ((await h.queryPermission?.({ mode: "readwrite" })) === "granted") return true;
    return (await h.requestPermission?.({ mode: "readwrite" })) === "granted";
  } catch { return false; }
}

// ---------- 2 Familienakte Pro: nativer Ordnerzugriff ----------
type Eintrag = { name: string; art: "datei" | "ordner"; groesse: number };
type OrdnerPlugin = {
  ordnerWaehlen(a: { titel?: string }): Promise<{ token?: string; name?: string; cancelled?: boolean }>;
  ordnerListe(a: { token: string; pfad: string }): Promise<{ eintraege: Eintrag[] }>;
  dateiLesen(a: { token: string; pfad: string; offset: number; laenge: number }): Promise<{ data: string }>;
  dateiBeginn(a: { token: string; pfad: string }): Promise<{ id: string }>;
  dateiAnhaengen(a: { id: string; offset: number; data: string }): Promise<{ size: number }>;
  dateiFertig(a: { id: string; size: number }): Promise<{ size: number; sha256: string }>;
};
type CapFenster = Window & { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { FamilyFolders?: OrdnerPlugin } } };
export const nativerOrdner = (): OrdnerPlugin | null => {
  const cap = typeof window !== "undefined" ? (window as CapFenster).Capacitor : undefined;
  return cap?.isNativePlatform?.() && cap.Plugins?.FamilyFolders?.ordnerWaehlen ? cap.Plugins.FamilyFolders : null;
};
const STUECK = 1024 * 1024;
const b64zuBytes = (s: string) => { const bin = atob(s); const o = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i); return o; };
const bytesZuB64 = (b: Uint8Array) => { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(s); };

export async function nativWaehlen(): Promise<Quelle | null> {
  const p = nativerOrdner();
  if (!p) return null;
  const r = await p.ordnerWaehlen({ titel: "Ordner „Datei-Organizer“ wählen (z. B. auf der SD-Karte)" });
  if (r.cancelled || !r.token) return null;
  const token = r.token;
  const lesen = async (pfad: string, groesse: number) => {
    const teile: Uint8Array[] = [];
    for (let off = 0; off < groesse; off += STUECK) teile.push(b64zuBytes((await p.dateiLesen({ token, pfad, offset: off, laenge: Math.min(STUECK, groesse - off) })).data));
    const o = new Uint8Array(groesse); let k = 0; for (const t of teile) { o.set(t, k); k += t.length; } return o;
  };
  return {
    art: "nativ", name: r.name || "Ordner",
    async dateien() {
      const aus: QuellDatei[] = [];
      const lauf = async (pfad: string, tiefe: number) => {
        if (tiefe > 12) return;
        for (const e of (await p.ordnerListe({ token, pfad })).eintraege) {
          if (UEBERSPRINGEN(e.name)) continue;
          const pp = pfad ? `${pfad}/${e.name}` : e.name;
          if (e.art === "ordner") await lauf(pp, tiefe + 1);
          else aus.push({ pfad: pp, name: e.name, geaendert: 0, lesen: () => lesen(pp, e.groesse) });
        }
      };
      await lauf("", 0);
      return aus.sort((a, b) => a.pfad.localeCompare(b.pfad, "de"));
    },
    async schreiben(name, text) {
      const bytes = new TextEncoder().encode(text);
      const { id } = await p.dateiBeginn({ token, pfad: name });
      for (let off = 0; off < bytes.length; off += STUECK) await p.dateiAnhaengen({ id, offset: off, data: bytesZuB64(bytes.subarray(off, off + STUECK)) });
      await p.dateiFertig({ id, size: bytes.length });
    },
    async indexLesen() {
      try { const e = (await p.ordnerListe({ token, pfad: "" })).eintraege.find((x) => x.name === INDEX_NAME); return e ? new TextDecoder().decode(await lesen(INDEX_NAME, e.groesse)) : null; } catch { return null; }
    },
  };
}

// ---------- 3 Auswahl ----------
export function ausAuswahl(liste: FileList | File[], name: string): Quelle {
  const dateien = [...liste];
  return {
    art: "auswahl", name,
    async dateien() {
      return dateien.filter((f) => !UEBERSPRINGEN(f.name)).map((f) => {
        const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
        const pfad = rel ? rel.split("/").slice(1).join("/") || f.name : f.name;
        return { pfad, name: f.name, geaendert: f.lastModified, lesen: async () => new Uint8Array(await f.arrayBuffer()) };
      }).sort((a, b) => a.pfad.localeCompare(b.pfad, "de"));
    },
    async indexLesen() { const f = dateien.find((x) => x.name === INDEX_NAME); return f ? f.text() : null; },
  };
}

// ---------- 4 Testordner ----------
export function testOrdner(vorgabe?: string): Quelle {
  // Im Repo liegt der Testordner neben app/ (../testdaten/), in einer Vorschau neben der Seite (./testdaten/).
  let basis = vorgabe || "";
  return {
    art: "test", name: "Testordner (erfunden)",
    async dateien() {
      let r: Response | null = null;
      for (const b of vorgabe ? [vorgabe] : ["../testdaten/", "./testdaten/"]) {
        basis = new URL(b, document.baseURI).href;
        r = await fetch(new URL("dateien.json", basis)).catch(() => null);
        if (r?.ok && (r.headers.get("content-type") || "").includes("json")) break;
      }
      if (!r?.ok) throw new Error("Testordner nicht gefunden.");
      const liste: string[] = await r.json();
      return liste.map((pfad) => ({ pfad, name: pfad.split("/").pop()!, geaendert: datumAusName(pfad), lesen: async () => { const a = await fetch(new URL(pfad.split("/").map(encodeURIComponent).join("/"), basis)); if (!a.ok) throw new Error(`${pfad} fehlt`); return new Uint8Array(await a.arrayBuffer()); } }));
    },
  };
}
/** Im Testordner gibt es kein Änderungsdatum über HTTP; ein festes, damit „Doppelt“ und Datum ohne Text gleich bleiben. */
const datumAusName = (pfad: string) => { const m = pfad.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})/); return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : Date.UTC(2026, 10, 1); };

export function herunterladen(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
