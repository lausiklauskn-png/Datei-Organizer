# Brief: Plansitzung „Training mit echten Daten über eine Maske“ (14.11.2026)

Eine **Plansitzung**: nichts bauen, nichts veröffentlichen. Am Ende steht ein Plan mit Fragen an Klaus, der je Punkt Ja sagt.

## Klaus' Idee (14.11.2026, sinngemäß)

- Der Datei-Organizer (Name wird später geändert) soll mit **echten, eigenen Dokumenten** angelernt werden statt mit erfundenen.
  Ein Freund hat 200–300 Dateien in die Familienakte gescannt und das Nachordnen einzeln aufgegeben – das soll leichter werden.
- **Pseudonymisieren, nicht anonymisieren:** jedes Dokument wird vor dem Training pseudonymisiert; Claude wertet den Lernprozess aus;
  danach werden die eigenen Daten wieder gelöscht und das **Gelernte** in Familienakte und BookLedgerPro übertragen.
- **Private Brain als Maske:** dort laufen schon mehrere Mail-Konten (auch T-Online). Greift eine KI zu, liest sie nur noch die
  pseudonymisierten Daten („Google und Microsoft bauen so etwas in ihre Browser ein“).
- **Trainingszentrum / Demo-Dokumente:** die Testdokumente oben heißen künftig Demo-Dokumente und wechseln; jedes Einordnen trainiert
  den Organizer weiter – auch für Menschen mit wenigen eigenen Dateien.
- Frage: muss jeder Nutzer selbst trainieren, oder lässt sich das Training im Organizer festschreiben?
- Frage: kann Claude direkt auf den Datei-Organizer auf Klaus' Rechner zugreifen?
- Mail: Werbung (Aldi, Yfood …) in einen eigenen Ordner, Bank und Wichtiges nicht; Anthropic-Abrechnungen in ein eigenes Fach für die
  Kostenanalyse des Projekts.

## Was es schon gibt (in der Plansitzung nachlesen, nicht neu erfinden)

- **Festes Grundwissen:** Wortmodell `lib/wortmodell.ts`, erzeugt von `scripts/briefmodell-abstimmen.mjs` aus Lehrdaten, als Datei
  ausgeliefert, byte-gleich in der Familienakte (`lib/sortierkern/`) und BookLedgerPro (`kontoModellDaten.js`). Ja: einmal anlernen,
  allen mitgeben, geht schon.
- **Lernen je Nutzer:** `lib/lernen.ts` (Merken nach Sache) – bleibt auf dem Gerät, kommt oben drauf.
- **Pseudonymisierer:** Modul 25 (`lib/ki-auftrag.ts` Familienakte, Private Brain „KI beim Schreiben“, `native/native-mail-ai.js`),
  Namensmuster in BookLedgerPro (`src/ai/namensmuster.js`), Vorschau „Das sieht die KI“, Halt bei KI-Anweisung.
- **Private Brain:** mehrere Konten (IMAP, Gmail), „Aufräumen“ mit Freigabe je Absender, Newsletter abmelden.
- **Zugriff auf einen Ordner am Rechner:** Remote Control (Claude-App → Einstellungen → Claude Code → Remote Control), die Sitzung
  sieht dann nur den freigegebenen Ordner.

## Was Claude am 14.11. festgestellt hat

- Gmail-Konnektor: nur lesen; Ordner anlegen scheiterte (fehlende Berechtigung). Im Gmail-Konto liegen weder Aldi/Yfood noch
  Anthropic – die liegen vermutlich bei T-Online. Für T-Online gibt es keinen Konnektor.
- Der Gmail-Konnektor liest **im Klartext** und geht an jeder Maske vorbei. Für das Training nur den Weg über Private Brain offen lassen.

## Harte Grenzen (stehen fest)

- Das Repo Datei-Organizer ist **öffentlich**: keine echten Dokumente, keine pseudonymisierten Texte darin – höchstens das fertige
  Modell, und das nur mit Wörtern aus vielen Dokumenten (keine Namen, Nummern, Adressen, IBAN, Kundennummern).
- Keine Schlüssel, PINs, Passwörter in Dateien oder im Chat.
- Pseudonymisieren ist nicht perfekt (ungewöhnliche Schreibweisen, Nummern im Fließtext) → Stichproben mit Vorschau, Halt bei Unsicherem.

## Fragen für die Plansitzung (je Punkt Klaus' Ja)

1. **KI-Sicht in Private Brain:** Was gibt sie heraus (Text, Absender-Art, Datum, Betrag, Dateiart)? Wohin (Ordner am Rechner über
   Remote Control, privater Server, nie das öffentliche Repo)? Wer löscht wann?
2. **Was bleibt stehen:** Firmen (Aldi, Telekom, Krankenkasse) ja, Personen nein? Wie mit Kleinunternehmern umgehen, deren Firma
   ein Personenname ist?
3. **Prüfung der Maske:** Stichprobe wie groß, wer schaut („Das sieht die KI“), was passiert bei einem Fund?
4. **Lernen:** Wortmodell neu abstimmen mit echten Stapeln + Einordner (Klaus, Claude, Codex) wie bisher; Mindestzahl Dokumente je
   Wort; Messung gegen die bisherigen fremden Stapel (darf nicht schlechter werden).
5. **Übertragung:** gleicher Kern byte-gleich in Familienakte und BookLedgerPro (bestehender Weg `sortierkern-nachziehen`).
6. **Trainingszentrum / Demo-Dokumente:** wechselnde Demo-Stapel, Einordnen = Lernen auf dem Gerät; für wen, wie viele, Name.
7. **Mail-Aufräumen:** in Private Brain (Aufräumen, Freigabe je Absender) oder über einen neu verbundenen Gmail-Konnektor mit
   Schreibrecht? Fach „Abrechnung KI-Projekt“ für Anthropic/OpenAI.
8. **Reihenfolge und Umfang:** Vorschlag KI-Sicht (1 Sitzung) → Lernen und Übertragung (1 Sitzung) → echte Stapel in Runden.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Datei-Organizer (eigener Zweig). PLANSITZUNG – nichts bauen, nichts veröffentlichen.
Zuerst lesen: CLAUDE.md, docs/BRIEF_SITZUNG_2026-11-14_PLAN-TRAINING-MASKE.md, docs/PLAN.md,
docs/PRUEFREGELN-GRUPPE.md; in Private Brain Pro docs/KI-BEIM-SCHREIBEN.md und docs/AUFRAEUMEN-NEWSLETTER.md.
Ziel: Plan „Training mit echten, pseudonymisierten Dokumenten über eine Maske in Private Brain“ mit den
Fragen 1–8 aus dem Brief; Klaus sagt je Punkt Ja. Plan als docs/PLAN_TRAINING-MASKE.md + Vorschau (HTML) wenn sichtbar.
Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo (öffentlich), keine Schlüssel/PINs im Chat oder in Dateien,
Gmail-Konnektor nicht als Trainingsquelle (liest Klartext), nichts veröffentlichen.
```
