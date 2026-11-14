// Teile mehrerer Stapel-Autoren zu einem Prüfstapel zusammenführen und die Pakete für die Einordner bauen (Training 14.11.2026).
// Jeder Teil: <teil>/*.txt, <teil>/ERWARTUNG.json ({dateien:[{datei, haushalt, bereich, zweitfach, schriftstueck, absender, person, frist, …}]}),
// <teil>/HAUSHALTE.json ({haushalte:[…]}). Gleiche Dateinamen bekommen „ (2)“; Bereich und Art werden gegen die Listen geprüft.
// Aufruf: node scripts/stapel-zusammen.mjs <ziel> <teil>[,<teil>…] [--pakete <wurzel>] [--haelften 2]
//   → <ziel>/ (Texte, ERWARTUNG.json = Soll des Autors, HAUSHALTE.json), <wurzel>/haelfte-<n>/ (Paket ohne Soll, scripts/einordner-paket.mjs)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const WURZEL = fileURLToPath(new URL("..", import.meta.url));
const arg = (n, v) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : v; };
const ziel = resolve(WURZEL, process.argv[2]), teile = process.argv[3].split(",").map((t) => resolve(t));
const { KATEGORIEN } = await import("../lib/kategorien.ts"); const { SCHRIFTSTUECKE } = await import("../lib/erkennen.ts");
mkdirSync(ziel, { recursive: true });
const alle = [], haushalte = [], namen = new Set(), maengel = [];
for (const [ti, t] of teile.entries()) {
  const e = JSON.parse(readFileSync(join(t, "ERWARTUNG.json"), "utf8")).dateien;
  for (const h of JSON.parse(readFileSync(join(t, "HAUSHALTE.json"), "utf8")).haushalte) haushalte.push(h);
  for (const x of e) {
    if (!existsSync(join(t, x.datei))) { maengel.push(`Teil ${ti + 1}: ${x.datei} fehlt`); continue; }
    let n = x.datei; for (let k = 2; namen.has(n); k++) n = x.datei.replace(/(\.txt)$/, ` (${k})$1`);
    namen.add(n); copyFileSync(join(t, x.datei), join(ziel, n));
    if (!KATEGORIEN.includes(x.bereich)) maengel.push(`${n}: Bereich „${x.bereich}“ nicht in der Liste`);
    if (x.zweitfach && !KATEGORIEN.includes(x.zweitfach)) maengel.push(`${n}: Zweitfach „${x.zweitfach}“ nicht in der Liste`);
    if (!SCHRIFTSTUECKE.includes(x.schriftstueck)) maengel.push(`${n}: Art „${x.schriftstueck}“ nicht in der Liste`);
    if (x.frist && !/^\d{4}-\d{2}-\d{2}$/.test(x.frist)) maengel.push(`${n}: Frist „${x.frist}“ kein Datum`);
    alle.push({ ...x, datei: n, autor: `autor-${ti + 1}` });
  }
}
writeFileSync(join(ziel, "ERWARTUNG.json"), JSON.stringify({ hinweis: "Soll der Stapel-Autoren (erfunden). Gewertet wird die Mehrheit der drei Einordner (docs/PRUEFSTAPEL-TRAINING-WOCHENENDE-REGELN.md).", dateien: alle }, null, 1));
writeFileSync(join(ziel, "HAUSHALTE.json"), JSON.stringify({ haushalte }, null, 1));
console.log(`${alle.length} Stücke, ${haushalte.length} Haushalte → ${ziel}`); for (const m of maengel) console.log("  Mangel:", m);
const pw = arg("--pakete");
if (pw) {
  const H = Number(arg("--haelften", 1)), sortiert = [...alle].sort((a, b) => a.datei.localeCompare(b.datei, "de"));
  for (let h = 0; h < H; h++) {
    const q = join(resolve(pw), `_quelle-${h + 1}`), p = join(resolve(pw), `haelfte-${h + 1}`);
    rmSync(q, { recursive: true, force: true }); mkdirSync(q, { recursive: true });
    const teil = sortiert.filter((_, i) => i % H === h);
    for (const x of teil) copyFileSync(join(ziel, x.datei), join(q, x.datei));
    writeFileSync(join(q, "ERWARTUNG.json"), JSON.stringify({ dateien: teil.map((x) => ({ datei: x.datei, haushalt: x.haushalt })) }));
    copyFileSync(join(ziel, "HAUSHALTE.json"), join(q, "HAUSHALTE.json"));
    execFileSync("node", [join(WURZEL, "scripts/einordner-paket.mjs"), q, p], { stdio: "inherit" });
    rmSync(q, { recursive: true, force: true });
  }
}
