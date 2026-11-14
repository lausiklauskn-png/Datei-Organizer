// Leser für Node-Proben wie in der App: PDF-Text mit pdf.js; PDF ohne Textebene → erste Seiten als Bild (pdftoppm, 144 dpi wie
// die App mit scale 2) → Texterkennung (tesseract.js, deutsche Sprachdaten aus src/public/vendor, byte-gleich mit der Familienakte).
// Zwischenspeicher je Fingerabdruck in .ocr-cache.json (Wurzel, nicht im Repo). Mehrere Erkennungs-Worker parallel (OCR_WORKER, Standard 4).
import { readFileSync, writeFileSync, existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { pdfTextLesen } from "../lib/pdf-text.ts";

const WURZEL = fileURLToPath(new URL("..", import.meta.url));
export const LANG = join(WURZEL, "src/public/vendor/tesseract/lang");
const SCAN_SEITEN = 2; // wie src/pdf.ts
const cacheDatei = join(WURZEL, ".ocr-cache.json");
let cache = null, geaendert = 0;
const ladeCache = () => (cache ??= existsSync(cacheDatei) ? JSON.parse(readFileSync(cacheDatei, "utf8")) : {});
export function cacheSichern() { if (cache && geaendert) { writeFileSync(cacheDatei, JSON.stringify(cache)); geaendert = 0; } }

let pdfjs = null;
async function pdfJs() {
  if (!pdfjs) { pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs"); pdfjs.GlobalWorkerOptions.workerSrc = new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).href; }
  return pdfjs;
}
let planer = null;
async function ocrPlaner() {
  if (planer) return planer;
  const { createWorker, createScheduler } = await import("tesseract.js");
  planer = createScheduler();
  const n = Number(process.env.OCR_WORKER || 4);
  for (let i = 0; i < n; i++) planer.addWorker(await createWorker("deu", 1, { langPath: LANG, gzip: false, cachePath: join(tmpdir(), "do-tess") }));
  return planer;
}
export const statistik = { ocrBilder: 0, ocrMs: 0, ausCache: 0, scanPdf: 0 };
/** Texterkennung für ein Bild (Bytes); Ergebnis zwischengespeichert. */
export async function ocr(bytes) {
  const k = createHash("sha256").update(bytes).digest("hex"); const c = ladeCache();
  if (k in c) { statistik.ausCache++; return c[k]; }
  const t0 = Date.now(); const p = await ocrPlaner();
  const t = (await p.addJob("recognize", Buffer.from(bytes))).data.text;
  statistik.ocrBilder++; statistik.ocrMs += Date.now() - t0;
  c[k] = t; if (++geaendert % 25 === 0) cacheSichern();
  return t;
}
/** PdfLeser wie die App: Textebene, sonst Seitenbilder per Texterkennung (mitOcr = false: nur Textebene). */
export function pdfLeser(mitOcr = true) {
  return async (bytes) => {
    const t = await pdfTextLesen(await pdfJs(), bytes);
    if (t.voll.trim() || !mitOcr) return t;
    statistik.scanPdf++;
    const k = "scanpdf:" + createHash("sha256").update(bytes).digest("hex"); const c = ladeCache();
    let text = c[k];
    if (text === undefined) {
      const d = mkdtempSync(join(tmpdir(), "do-pdf-"));
      try {
        writeFileSync(join(d, "a.pdf"), bytes);
        execFileSync("pdftoppm", ["-r", "144", "-f", "1", "-l", String(SCAN_SEITEN), "-png", join(d, "a.pdf"), join(d, "s")]);
        const teile = await Promise.all(readdirSync(d).filter((n) => n.endsWith(".png")).sort().map((n) => ocr(readFileSync(join(d, n)))));
        text = teile.map((x) => x.trim()).filter(Boolean).join("\n\n");
      } catch { text = ""; } finally { rmSync(d, { recursive: true, force: true }); }
      c[k] = text; geaendert++;
    }
    return (text.match(/[A-Za-zÄÖÜäöüß]{3,}/g) || []).length >= 4 ? { kopf: text.slice(0, 1500), voll: text } : t;
  };
}
export async function beenden() { cacheSichern(); if (planer) { await planer.terminate(); planer = null; } }
