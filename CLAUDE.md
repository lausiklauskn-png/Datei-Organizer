# CLAUDE.md — Datei-Organizer

Diese Datei liest jede Sitzung zuerst.

## Was das ist

Prüf- und Sortierwerkzeug neben Auslieferungsprüfer und Sende-Prüfer (Eingangskontrolle). Dateien von Scanner, Kamera, E-Mail
oder Altbestand kommen in **einen** Ordner; der Organizer sortiert sie Klick für Klick feiner (Siebe: Art → Kopf → Kategorie und
Nummern → Absender → Inhalt) und zeigt sie als Baum nach vielen Gesichtspunkten. Zuerst für die Familienakte gemacht: der Ordner
wird dort nur übernommen und automatisch zugeordnet (`organizer-index.json`). Plan und alle Entscheidungen: `docs/PLAN.md`.

## Stand (12.11.2026)

- Nur Plan und **Vorschau** (Stufe A): `vorschau/seite.html` (eine Quelle) → `node tools/index-bauen.mjs` → `index.html`
  (GitHub Pages, https://lausiklauskn-png.github.io/Datei-Organizer/). 20 erfundene Dateien, keine echte Funktion.
  `index.html` nie von Hand ändern.
- Entschieden: S1 eigene App · S2 ein Ordner, Baum als Sicht · S3–S6 wie vorgeschlagen · S7 Format kompatibel mit der Familienakte ·
  S9 Lehrer = Claude Haiku 5.5 · S10/S11 über Klaus' Hetzner-Server (KimHub `schicht/api.mjs`) mit Schlüssel, pseudonymisiert.
- Offen: S8 (Archivnummer für Papier), Klaus' Ja zur Vorschau, dann Stufe B (Kern, rein, in Node prüfbar).

## Feste Regeln

- **Keine echten Dokumente, keine personenbezogenen Daten im Repo** – nur erfundene Beispiele (Kennzeichen ungültig, Firmen erfunden).
  Das Repo ist öffentlich lesbar (Pages).
- Keine Schlüssel, PINs, Passwörter im Repo oder im Chat. Der Claude-Schlüssel liegt nur auf dem Server.
- Sichtbare Änderungen erst als Vorschau zeigen, Klaus sagt Ja je Punkt.
- Bausteine aus Familienakte/Workflow PDF (Briefkopf-Leser, Prüfkern, Modul 25) byte-gleich mit Pin übernehmen, nie nachbauen.
- Der Sortier-Kern wird **einmal** gebaut und in der Familienakte byte-gleich genutzt – keine zweite Fassung.
- Forschungseinträge gehören nur nach KimHub, nicht hierher.
- Kein Merge nach `main` ohne Klaus' Wort; eigener Zweig, Entwurfs-PR.
