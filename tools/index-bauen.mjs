// Baut index.html (für GitHub Pages) aus vorschau/seite.html: dieselbe Seite, nur mit eigenem Dokumentgerüst.
// vorschau/seite.html bleibt die eine Quelle; index.html nie von Hand ändern.
import { readFileSync, writeFileSync } from "node:fs";
const seite = readFileSync(new URL("../vorschau/seite.html", import.meta.url), "utf8");
const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${seite}
</body>
</html>
`;
writeFileSync(new URL("../index.html", import.meta.url), html);
console.log("index.html gebaut");
