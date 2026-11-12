# CLAUDE.md — Datei-Organizer

Diese Datei liest jede Sitzung zuerst.

## Was das ist

Prüf- und Sortierwerkzeug neben Auslieferungsprüfer und Sende-Prüfer (Eingangskontrolle). Dateien von Scanner, Kamera, E-Mail
oder Altbestand kommen in **einen** Ordner; der Organizer sortiert sie Klick für Klick feiner (Siebe: Art → Kopf → Kategorie und
Nummern → Absender → Inhalt) und zeigt sie als Baum nach vielen Gesichtspunkten. Zuerst für die Familienakte gemacht: der Ordner
wird dort nur übernommen und automatisch zugeordnet (`organizer-index.json`). Plan und alle Entscheidungen: `docs/PLAN.md`.

## Stand (12.11.2026, Fassung 0.1.0)

- **Erste Fassung gebaut** (Freibrief Klaus 12.11.): Kern `lib/`, Oberfläche `src/` → gebaut nach `app/` (Pages:
  https://lausiklauskn-png.github.io/Datei-Organizer/ leitet auf `app/` weiter). `app/` nie von Hand ändern: `npm run build`.
- Testordner `testdaten/Eingang/` (101 erfundene Dateien, `node scripts/testdaten-bauen.mjs`), Erwartung `testdaten/ERWARTUNG.json`.
- Installierbar als Web-App (PWA): `src/public/sw.js` (Offline-Vorrat nur der App; Nummer `VORRAT` bei jeder Fassung erhöhen),
  Symbole `src/public/icon-192.png`/`icon-512.png`.
- Proben: `npm run build` (Kern + Typen + Bau), `node tests/ui-probe.mjs` (Browser, 43 Prüfungen). CI `.github/workflows/pruefung.yml`.
- Entschieden: S1–S11 (S8: Archivnummern parallel, fortlaufend erst wenn die Reihenfolge steht). Einzelheiten `docs/PLAN.md`,
  Abschnitt „Stand 0.1.0“.
- Offen: Klaus' Gerätetest (SD-Karte über Familienakte Pro, PC), OCR, Lehrer-Dienst, Übernahme des Index in der Familienakte.

## Feste Regeln

- **Keine echten Dokumente, keine personenbezogenen Daten im Repo** – nur erfundene Beispiele (Kennzeichen ungültig, Firmen erfunden).
  Das Repo ist öffentlich lesbar (Pages).
- Keine Schlüssel, PINs, Passwörter im Repo oder im Chat. Der Claude-Schlüssel liegt nur auf dem Server.
- Sichtbare Änderungen erst als Vorschau zeigen, Klaus sagt Ja je Punkt.
- Bausteine aus Familienakte/Workflow PDF (Briefkopf-Leser, Prüfkern, Modul 25) byte-gleich mit Pin übernehmen, nie nachbauen.
- Der Sortier-Kern wird **einmal** gebaut und in der Familienakte byte-gleich genutzt – keine zweite Fassung.
- Forschungseinträge gehören nur nach KimHub, nicht hierher.
- Kein Merge nach `main` ohne Klaus' Wort; eigener Zweig, Entwurfs-PR.
