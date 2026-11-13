# Abschluss 13.11.2026 — Rückwärtstest Workflow Needs, fertige Apps als Beispiele

Auftrag Klaus 13.11.: die gebauten Apps als Beispiele in Workflow Needs, dazu der Brief
`BRIEF_SITZUNG_2026-11-14_NEEDS-RUECKWAERTSTEST.md` (Zweig claude/familienakte-bildintegration-il59yw). Nachtrag Klaus: Fehler
gleich korrigieren und die Beispiele auch rückwärts von Agenten gegenprüfen lassen.

## Freibrief (Klaus 13.11.)

Klaus: „PRs mergen und den Freibrief für das Mergen an die nächste Sitzung mit übergeben. Selbstständig handeln, bis der
Auftrag zu Ende geführt ist.“ Die nächste Sitzung darf ihre eigenen, geprüften PRs (CI grün, Proben grün) in Workflow-Needs und
Datei-Organizer selbst nach `main` mergen und arbeitet den Auftrag ohne Rückfrage zu Ende. Ausnahme bleiben Veröffentlichungen
und sichtbare Änderungen an Needs, die laut Brief erst als Vorschau zu Klaus gehen.

## Ergebnis

- **Rückwärtstest (12 simulierte Kunden):** keiner erreicht 80 % der Kern-Merkmale; Mittel 43–49 %, gesprächig 59–73 %, knapp 26–44 %.
  Zahlen und Grenzen: `rueckwaertstest/ERGEBNIS.md`; was Needs fehlt: `rueckwaertstest/NEEDS-LUECKEN.md`.
- **Vier neue Beispiele in Workflow Needs** (Familienakte, BookLedgerPro, Workflow PDF Pro, Private Brain Pro), rückwärts geprüft:
  nach Korrektur Familienakte 90 %, BookLedgerPro 83 % (bestanden), Workflow PDF Pro und Private Brain Pro 71 %.
- **In Needs behoben:** Vorname im Klartext trotz „verdeckt: ja“, unerklärte Summe, missverständlicher Kopf `repo`, unerklärte
  Grenzlinie bei Muss; neue Proben VERDECKT, SUMME, SCHLÜSSIG (je gegengeprüft).

## Was liegt wo

| | |
|---|---|
| Datei-Organizer `rueckwaertstest/` | REGELN, REFERENZ je App (eingefroren vor den Kunden), Kundenkarten (gegengelesen), je Kunde Bedarf, Gespräch, Bausteinwahl, Bauauftrag, Bauplan; Bewertungen; `werkzeug/needs-lauf.mjs` (Bauauftrag mit unverändertem Needs-Code), `werkzeug/auswertung.mjs` |
| Workflow-Needs | `assets/daten/beispiel-{familienakte,bookledgerpro,workflowpdfpro,privatebrainpro}.js`, `assets/kern/bauauftrag.js`, Proben, Cache v39 |

Beide auf Zweig `ccr-8da46c4f-nb1147`, Entwurfs-PRs. Nichts veröffentlicht, nichts an den fertigen Apps geändert.

## Offen

- Needs-Umbau nach `NEEDS-LUECKEN.md` (Fragen nach Plattform, Datenort/Sicherung, „was nicht“, Zusammenspiel; „Rahmen“-Absatz im
  Bauauftrag; Bereich 8 als Abnahmekriterien) — erst Vorschau, Klaus' Ja je Punkt. Danach **neue** Kunden für den nächsten Nachweis.
- Die letzte Nachbesserung der Beispiele BookLedgerPro und Workflow PDF Pro ist nicht neu gemessen.
- Schlüssigkeits-Meldung bisher nur als Probe; in der App selbst (Hinweis beim Umfang) nicht gebaut.
- Browser-Probe einmal von vier Läufen 1 ROT, nicht wiederholbar.
- Workflow Calculate rückwärts (eigener Brief, erst nach Needs).
- Forschungseintrag nach KimHub: **nicht gemacht** — KimHub ist in dieser Sitzung nicht zugänglich.

## Stundennachweis

Erste Spur: Lesen des Briefs und von Needs ab etwa 16:10 UTC (geschätzt, keine Datei-Spur), erster Commit 16:34 UTC, letzter
Commit gegen 17:00 UTC. Ein Block, Obergrenze rund 1 h Klaus-Zeit (er war nur zu Beginn und mit einem Nachtrag beteiligt);
die Agentenläufe (rund 70) liefen nebeneinander. Klaus' eigene Angabe geht vor.

## Startauftrag zum Einfügen

```
Repos: Workflow-Needs, Datei-Organizer (Zweig ccr-8da46c4f-nb1147 bzw. main nach Merge).
Zuerst lesen: Datei-Organizer rueckwaertstest/ERGEBNIS.md und NEEDS-LUECKEN.md, Workflow-Needs CLAUDE.md (letzter Abschnitt).
Auftrag: HTML-Vorschau für die Needs-Änderungen aus NEEDS-LUECKEN.md (neue Fragen: Plattformen, Datenort/Sicherung,
„was ausdrücklich nicht“, Zusammenspiel mit eigenen Programmen; „Rahmen“-Absatz und Abnahmekriterien im Bauauftrag;
Schlüssigkeits-Hinweis im Umfang). Erst Klaus' Ja je Punkt, dann bauen, dann den Rückwärtstest mit NEUEN Kunden wiederholen
(rueckwaertstest/werkzeug/, Regeln unverändert, Grenze 80 %).
Freibrief (Klaus 13.11.): eigene geprüfte PRs in Workflow-Needs und Datei-Organizer selbst mergen, selbstständig bis zum Ende
arbeiten. Nichts veröffentlichen. Forschungseinträge nur nach KimHub. Abschlussbrief mit Stundennachweis.
```
