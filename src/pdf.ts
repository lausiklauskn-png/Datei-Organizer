import { pdfTextLesen } from "../lib/pdf-text.ts";

/** pdf.js erst laden, wenn das erste PDF kommt (gehört zur App, kein Abruf aus dem Netz). */
let bereit: Promise<Parameters<typeof pdfTextLesen>[0]> | null = null;
export async function pdfLeser() {
  if (!bereit) bereit = (async () => {
    const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.mjs?url")]);
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs as unknown as Parameters<typeof pdfTextLesen>[0];
  })();
  const pdfjs = await bereit;
  return (b: Uint8Array) => pdfTextLesen(pdfjs, b);
}
