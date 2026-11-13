# CLAUDE.md — Datei-Organizer

Diese Datei liest jede Sitzung zuerst.

## Was das ist

Prüf- und Sortierwerkzeug neben Auslieferungsprüfer und Sende-Prüfer (Eingangskontrolle). Dateien von Scanner, Kamera, E-Mail
oder Altbestand kommen in **einen** Ordner; der Organizer sortiert sie Klick für Klick feiner (Siebe: Art → Kopf → Kategorie und
Nummern → Absender → Inhalt) und zeigt sie als Baum nach vielen Gesichtspunkten. Zuerst für die Familienakte gemacht: der Ordner
wird dort nur übernommen und automatisch zugeordnet (`organizer-index.json`). Plan und alle Entscheidungen: `docs/PLAN.md`.

## Stand (13.11.2026, Fassung 0.2.0)

- **Lauf „Vermieterin“ (13.11., PR #3 Entwurf):** Regeln und alle Ergebnisse in `docs/PRUEFSTAPEL-VERMIETERIN-REGELN.md`. Stapel
  `pruefstapel-vermieterin/` (2025, drei Einordner, verbraucht) und `pruefstapel-vermieterin-2026/` (zwei Einordner, Codex-Auftrag 010
  offen), je mit `-ocr` (Text aus der Texterkennung). Werkzeuge: `scripts/scan-setzen.py`, `ocr-stapel.mjs`, `messen-bank.mjs`,
  `messen-fristkette.mjs`, `messen-privatebrain.mjs`, `merken.mjs`, alles zusammen `bash scripts/lauf-vermieterin.sh`.
  **Der Kern liegt seit 13.11. byte-gleich in der Familienakte** (`lib/sortierkern/` dort, @ `534cc08`): Änderungen an `lib/` hier
  wirken dort erst nach `tools/sortierkern-nachziehen.mjs` in der Familienakte – nach jeder Kernänderung nachziehen und dort messen.

- **Fassung 0.2.0 (13.11.):** Kern verbessert und nachgewiesen. Wortmodell für Bereich und Art (`lib/wortmodell.ts`, Daten erzeugt von
  `scripts/briefmodell-abstimmen.mjs` – nie von Hand ändern), neue Regeln für Absender, Frist, Person. An vier fremden Stapeln mit je
  drei Einordnern (Stapel-Autor, Claude-Agent, Codex) in allen fünf Feldern gesichert besser als 0.1.0; Zahlen und Grenzen in
  `docs/PRUEFREGELN-GRUPPE.md` („Ergebnis“). **Fachregel** `docs/FACHREGEL.md` (Klaus: acht Punkte Ja; Vorgabe ab Werk, eigene Muster
  gehen vor – Bedienung dafür noch nicht gebaut, erst Vorschau). **Prüfreihe** A–H in `docs/PRUEFREGELN-GRUPPE.md`; verbraucht:
  `pruefstapel-unabhaengig`, `pruefstapel-briefe-2/-a/-b/-h`. Lehrdaten `lehrdaten-briefe/`. Messen: `scripts/messen-briefe.mjs`.
  Offen: Runden C (Familien im Wandel), D (Schreiber eines anderen Systems), E (Foto/OCR), G (echte Stichprobe); Zweitfach im Kern;
  gespeicherte Mails mit englischem Kopf werden nicht gelesen; Übernahme in die Familienakte.

- **Erste Fassung gebaut** (Freibrief Klaus 12.11.): Kern `lib/`, Oberfläche `src/` → gebaut nach `app/` (Pages:
  https://lausiklauskn-png.github.io/Datei-Organizer/ leitet auf `app/` weiter). `app/` nie von Hand ändern: `npm run build`.
- Testordner `testdaten/Eingang/` (101 erfundene Dateien, `node scripts/testdaten-bauen.mjs`), Erwartung `testdaten/ERWARTUNG.json`.
- Installierbar als Web-App (PWA): `src/public/sw.js` (Offline-Vorrat nur der App; Nummer `VORRAT` bei jeder Fassung erhöhen),
  Symbole `src/public/icon-192.png`/`icon-512.png`.
- Proben: `npm run build` (Kern + Typen + Bau), `node tests/ui-probe.mjs` (Browser, 43 Prüfungen). CI `.github/workflows/pruefung.yml`.
- Entschieden: S1–S11 (S8: Archivnummern parallel, fortlaufend erst wenn die Reihenfolge steht). Einzelheiten `docs/PLAN.md`,
  Abschnitt „Stand 0.1.0“.
- **Training (12.11.):** Generator mit 10 erfundenen Haushalten, Messung, Großlauf und Übersicht – siehe `docs/PLAN.md`,
  Abschnitt „Training“. Proben: `node scripts/messen.mjs testdaten-haushalte`, `node scripts/grosslauf.mjs`.
  Texterkennung in den Proben über tesseract.js mit den deutschen Sprachdaten der Familienakte (Nachbarordner).
- Offen: Klaus' Gerätetest (SD-Karte über Familienakte Pro, PC), OCR, Lehrer-Dienst, Übernahme des Index in der Familienakte.

- **Nächste Sitzungen:** `docs/BRIEF_SITZUNG_2026-11-13_KERN-IN-DIE-GRUPPE.md` (Kern in die übrigen Apps, Jahr 2026 abschließen),
  danach `docs/BRIEF_SITZUNG_2026-11-13_PUNKTE-3-9.md` (Punkte 3–9 der Empfehlung, Anleitung Zusammenarbeit mit Codex).

## Feste Regeln

- **Keine echten Dokumente, keine personenbezogenen Daten im Repo** – nur erfundene Beispiele (Kennzeichen ungültig, Firmen erfunden).
  Das Repo ist öffentlich lesbar (Pages).
- Keine Schlüssel, PINs, Passwörter im Repo oder im Chat. Der Claude-Schlüssel liegt nur auf dem Server.
- Sichtbare Änderungen erst als Vorschau zeigen, Klaus sagt Ja je Punkt.
- Bausteine aus Familienakte/Workflow PDF (Briefkopf-Leser, Prüfkern, Modul 25) byte-gleich mit Pin übernehmen, nie nachbauen.
- Der Sortier-Kern wird **einmal** gebaut und in der Familienakte byte-gleich genutzt – keine zweite Fassung.
- Forschungseinträge gehören nur nach KimHub, nicht hierher.
- Kein Merge nach `main` ohne Klaus' Wort; eigener Zweig, Entwurfs-PR.
