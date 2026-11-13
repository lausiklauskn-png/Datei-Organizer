import type { BildLeser, KernLeser } from "../lib/einlesen.ts";
import type { DateiArt } from "../lib/typen.ts";

/**
 * Bausteine aus src/public/vendor/ (byte-gleich mit Pin, scripts/vendor-nachziehen.mjs): der Prüfkern des Auslieferungsprüfers und die
 * Texterkennung (tesseract.js, deutsche Sprachdaten). Beide werden erst geladen, wenn die erste passende Datei kommt – kein Abruf aus
 * dem Netz außer von der eigenen Seite, nichts verlässt das Gerät.
 */
type PF = { pruefePdf: (b: Uint8Array, erlaubt: string[]) => Promise<{ stellen: Array<{ kennung: string; satz: string }> }> };
type PA = { pruefe: (name: string, b: Uint8Array) => Promise<{ befunde: Array<{ kennung: string; satz: string }>; text: string | null }> };
type Welt = typeof globalThis & { PrueferFormate?: PF; PrueferAnhang?: PA; Tesseract?: { createWorker: (s: string, o: number, x: object) => Promise<TessWorker> } };
type TessWorker = { recognize: (b: Blob) => Promise<{ data: { text: string } }> };
const welt = globalThis as Welt;
const basis = () => new URL("vendor/", document.baseURI).href;

const geladen = new Map<string, Promise<void>>();
function skript(rel: string): Promise<void> {
  if (!geladen.has(rel)) geladen.set(rel, new Promise((ok, nein) => {
    const s = document.createElement("script"); s.src = basis() + rel;
    s.onload = () => ok(); s.onerror = () => { geladen.delete(rel); nein(new Error(`${rel} nicht geladen`)); };
    document.head.appendChild(s);
  }));
  return geladen.get(rel)!;
}

/** Prüfkern: PDF → Metadaten-Befunde (ohne Seitentext, den liest pdf.js schon); Office → Befunde und Text (auch Excel/PowerPoint). */
export const kernLeser: KernLeser = async (name: string, bytes: Uint8Array, art: DateiArt) => {
  await skript("pruefkern/pruefer-formate.js");
  if (art === "pdf") {
    const r = await welt.PrueferFormate!.pruefePdf(bytes, []);
    return { befunde: r.stellen.map((x) => ({ kennung: x.kennung, satz: x.satz.replace(/ \([^()]*\)$/, "") })) };
  }
  await skript("pruefkern/pruefer-anhang.js");
  const r = await welt.PrueferAnhang!.pruefe(name, bytes);
  return { befunde: r.befunde.map((x) => ({ kennung: x.kennung, satz: x.satz })), text: r.text };
};

/** Texterkennung für Fotos und Scans – ein Arbeiter für alle Bilder, deutsch, Frist je Bild. */
let arbeiter: Promise<TessWorker> | null = null;
export const bildLeser: BildLeser = async (bytes: Uint8Array) => {
  if (!arbeiter) arbeiter = skript("tesseract/tesseract.min.js").then(() => welt.Tesseract!.createWorker("deu", 1, {
    workerPath: basis() + "tesseract/worker.min.js", corePath: basis() + "tesseract/", langPath: basis() + "tesseract/lang", gzip: false, cacheMethod: "none",
  }));
  arbeiter.catch(() => { arbeiter = null; });
  const w = await arbeiter;
  const frist = new Promise<never>((_, nein) => setTimeout(() => nein(new Error("Texterkennung dauerte zu lange")), 60000));
  const r = await Promise.race([w.recognize(new Blob([bytes as BlobPart])), frist]);
  return r.data.text || "";
};
