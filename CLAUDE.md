# CLAUDE.md — Datei-Organizer

Diese Datei liest jede Sitzung zuerst.

## Was das ist

Prüf- und Sortierwerkzeug neben Auslieferungsprüfer und Sende-Prüfer (Eingangskontrolle). Dateien von Scanner, Kamera, E-Mail
oder Altbestand kommen in **einen** Ordner; der Organizer sortiert sie Klick für Klick feiner (Siebe: Art → Kopf → Kategorie und
Nummern → Absender → Inhalt) und zeigt sie als Baum nach vielen Gesichtspunkten. Zuerst für die Familienakte gemacht: der Ordner
wird dort nur übernommen und automatisch zugeordnet (`organizer-index.json`). Plan und alle Entscheidungen: `docs/PLAN.md`.

## Stand (14.11.2026 nachts, Fassung 0.4.1, Windows-App und Android-Lücken, nicht veröffentlicht)

- **Datei-Organizer Pro für Windows** (Auftrag aus dem Brief vom 13.11.): `windows/` nach dem Muster von BookLedgerPro – Tauri 2 + Java-Engine
  (`windows/engine/src/`: `DesktopOrdner` = Vertrag `FamilyFolders`, `DesktopEingang` = „Öffnen mit“, `DesktopUpdates` = eigener Server,
  Speichern unter), Brücke `windows/bridge/` (Verträge in `contracts.json`), Installer (NSIS, „Öffnen mit“ nur für diesen Benutzer),
  `windows.yml` (Prüfbau installiert, zweimal gestartet) und `windows-release.yml` (nur von Hand, Feld „ja“). Alles in `docs/WINDOWS.md`.
- **Android-Lücken geschlossen:** dauerhafte Ordnerfreigabe („Zuletzt: …“, die letzten 5), Teilen an die App und „Öffnen mit“ (`DoEingangPlugin`,
  Kopie in einen Stapel, `EingangStapel`), „Speichern unter …“ (`DoDateienPlugin`) – gleiche Verträge wie Windows; Oberfläche in `src/quellen.ts`/`src/app.tsx`.
- **Ein Update-Schlüssel für Android und Windows** (`UpdateFeed.SCHLUESSEL` = `DesktopUpdates.SCHLUESSEL`, geprüft) – noch leer, bis Klaus ihn gibt
  (Anleitung Schritt für Schritt im Chat; Block in `docs/ANDROID.md` (b)).
- ⚠ Kein Windows-PC, kein Android-Gerät, kein Rust- oder Gradle-Bau in der Sitzung: erst `windows.yml`/`android.yml` zeigen, ob es baut.
  Offen: große Mengen in Blöcken mit Weitermachen (Klaus: die nächsten 2–3 Wochen). Brief: `docs/BRIEF_ABSCHLUSS_2026-11-14_ORGANIZER-PRO-WINDOWS.md`.

## Stand (13.11.2026 nachts, Fassung 0.4.0, Android-App, nicht veröffentlicht)

- **Freibrief zum Mergen (Klaus 13.11. nachts, „auch an die neue Sitzung weitergeben“):** eigene geprüfte PRs (CI und Proben grün) selbst
  nach `main` mergen, in allen Repos dieser Arbeit. Veröffentlichen (APK, Windows, Releases) weiter nur mit Klaus' Wort.

- **Datei-Organizer Pro für Android (Klaus 13.11.: „die APK-App und die Windows-App mit der Download-Funktion … oder Update-Funktionen“):**
  Capacitor-Hülle `android/` (Paket `de.familyprojekt.dateiorganizer`, Vorbild BookLedgerPro), Web-Paket aus `app/` über
  `tools/native/prepare-web.mjs` (ohne `sw.js`, mit Testordner), **Ordner auf dem Gerät** (`DoOrdnerPlugin`, Name `FamilyFolders` wie in
  der Familienakte), **Updates vom eigenen Server** (`UpdateFeed`/`DoUpdatesPlugin`, Fähnchen und Fassung laden direkt, `src/nativ.ts`),
  Signieren und Veröffentlichen (`tools/signing/`, `android.yml`, `signing-identity.yml`, `android-release.yml` – nur von Hand).
  **Namen (Klaus 13.11.):** Web-App „Datei-Organizer Basic“, App „Datei-Organizer Pro“ – festgelegt nur in `src/nativ.ts` (`APP_VARIANTE`);
  Speicher-Namen nicht umbenennen. Alles Weitere, Proben und **was Klaus einmalig tun muss** (Signier-Freigabe `DO_SIGNING_UNLOCK`,
  Update-Server, öffentlicher Schlüssel – bis dahin Platzhalter, Updates „nicht eingerichtet“): `docs/ANDROID.md`.
  ⚠ Kein Android-Bau, kein Gerät in der Sitzung – erst `android.yml` zeigt, ob Gradle/Lint bestehen. (Speichern unter, Teilen, Windows: seit 0.4.1, oben.)

## Stand (13.11.2026 nachts, Fassung 0.3.4, nicht veröffentlicht)

- **Landkarte und Dashboard in der App (Klaus 13.11.: „Landkarte ist okay … mit dem Landkarten-Button wie bei der Familienakte“):** Knopf
  (Kartensymbol) im Kopf → Seite `#landkarte` (`src/landkarte.tsx`): Dashboard live aus der Liste – jeder Kasten ist ein Link (zu entscheiden →
  Sortieren, eingeordnet/doppelt/gesperrt/Bereich/Format → der passende Ordner im Baum, `oeffne(sicht, knoten)`); Landkarten im Rahmen aus
  `src/public/landkarte.html`, erzeugt von `scripts/landkarte-bauen.mjs` aus `docs/landkarte/…` (= Artefakt; im Bau geprüft). **Auge, Stift,
  Papierkorb** nur als Strichsymbol an jeder Datei (Finden, grüne Liste, Steckbrief); Stift ändert jedes Feld auch nachträglich (`FeldAendern`).
  Behoben: Finden zeigte nach einer Änderung den alten Ordnerinhalt; der Worker legte jede Nebenseite als index.html in den Vorrat (v9).

- **PDF-Kennung und Abgleich (Klaus 13.11.):** `lib/pdfkennung.ts` liest das /ID-Paar aus dem Trailer (erste = Herkunft); gleiche Herkunft bei
  anderem Inhalt → „ähnlich: fassung“ (über 20 Dateien mit derselben Kennung = feste Gerätekennung, übergangen). Eigener Code, Prüfkern
  unverändert. **Abgleich** in beide Richtungen: `docs/ABGLEICH.md`, Prüfung `node scripts/abgleich.mjs`.

- **0.3.4 (Klaus 13.11.: „das, was noch fehlt im Code, soll mit eingebaut werden“):** **Texterkennung in der App** (Fotos und gescannte
  PDFs ohne Textebene, erste 2 Seiten; `src/vendor.ts`, `src/pdf.ts`), **Prüfkern des Auslieferungsprüfers eingebunden** (Merkmale aus
  dem Datei-Innern: Autor, Programm, Titel, Erstelldatum, Befunde → `d.innen`, `lib/innen.ts`; Text aus Excel/PowerPoint), **Doppelungen
  über den gleichen Inhalt hinaus** (`lib/aehnlich.ts`: ältere Fassung, gleicher Text, gleicher Beleg, gleiches Foto, gleicher Name – nur
  markiert, nicht entfernt; `gleicheGroesse` für große Bestände). Prüfkern und Tesseract (nur Deutsch) **byte-gleich mit Pin** aus der
  Familienakte: `src/public/vendor/` + `HERKUNFT.json`, nur über `node scripts/vendor-nachziehen.mjs`, im Bau geprüft (`--pruefen`).
  Proben: Kern 141 (17 neu, gegengeprüft 5/5 nach Schärfen), UI 58 (2 neu, OCR-Probe gegengeprüft). ⚠ Noch nicht: Mengen über ~800
  Dateien (Klaus: die nächsten 2–3 Wochen Schritt für Schritt), Outlook-MSG/PST, PDF-/ID, Familienakte-Kern nicht nachgezogen.

## Stand (13.11.2026 abends, Needs mit Rahmen, Runde 2)

- Needs-Vorschau: Klaus Ja zu allen 14 Punkten, gebaut in Workflow-Needs #36. **Runde 2** des Rückwärtstests mit sieben Marktideen
  (zehn Berufs-Agenten, `rueckwaertstest/runde-2/`): alle bestehen (81–100 % Kern). Brief `docs/BRIEF_ABSCHLUSS_2026-11-13_NEEDS-RAHMEN-RUNDE-2.md`.

## Stand (13.11.2026 spät, Fassung 0.3.3)

- **0.3.3 (Klaus 13.11., Bild vom Tablet: „6 bitte prüfen“ bei 18 in der Liste, Fertige nicht zu sehen):** Seite Sortieren – die Meldung nennt
  „N neu zu prüfen, M insgesamt offen“; neu hängen Gebliebenes steht zuerst mit Marke „neu in Sieb N“; eigene grüne Liste „Sicher bis hierher“
  bzw. „Fertig“ (`SicherZeile`, mit Auge). UI-Probe 56. Brief nächste Sitzung: `docs/BRIEF_SITZUNG_2026-11-14_NEEDS-RUECKWAERTSTEST.md`.

## Stand (13.11.2026, Fassung 0.3.2)

- **0.3.2 (Klaus 13.11.):** Block „Dateien einfügen per Drag and Drop“ (Dateien und ganze Ordner, `ausZiehen` in `src/quellen.ts`; kommt zum
  Bestand **dazu**, gleiche Inhalte werden als doppelt markiert, `einlesenAus(q, true)`), **Entfernen** einzelner Dateien (Steckbrief) und ganzer
  Ordner/Treffer (Seite Finden, „Entfernen“ über der Liste; `entfernen` – nur die Liste, Originale unberührt, „Zurück“ holt sie wieder),
  **Auge** an jeder Prüfzeile (Steckbrief mit Ansehen/vergrößern, Teilen, Entfernen). UI-Probe 54.
  Noch offen: umbenennen, verschieben per Drag and Drop; Familienakte: Blöcke hinzufügen, Doppelte zusammenführen (Index-Übernahme dort nicht gebaut).

## Stand (13.11.2026, Fassung 0.3.1)

- **Ladebalken und Aktualisieren (Klaus 13.11.: „sofort veröffentlichen“):** Ladeanzeige oben im Kopf auf jeder Seite und in der Ordner-Karte
  (`Ladebalken` in `src/app.tsx`: gemerkter Stand · Ordner wird durchgesehen (laufender Streifen) · Datei für Datei mit Prozent und Dateiname);
  Knopf „Aktualisieren“ (⟳) im Kopf holt die neueste Fassung und lädt neu, die Sortierung bleibt gemerkt. Leere Auswahl bei „Ordner hochladen“
  sagt jetzt, dass nichts übergeben wurde. Der Worker löscht nur noch eigene Vorräte (`datei-organizer-v…`, vorher alle am gemeinsamen Ursprung).
  **Update-Fähnchen** neben der Fassung (`useNeueFassung`, fragt `version.json` – bei jeder Fassung mit erhöhen, die UI-Probe vergleicht),
  **„Organizer leeren“** (Seite Familienakte und Überblick; Liste und Verlauf weg, Gelerntes bleibt, Originale unberührt). UI-Probe 50.
  Offen (Klaus 13.11., nächste Fassung): einzelne Dateien/Ordner entfernen mit Auge-Ansicht, umbenennen/teilen/verschieben, Block „Dateien
  einfügen per Drag and Drop“; in der Familienakte Blöcke hinzufügen statt überschreiben, Doppelte anzeigen und zusammenführen. Klaus' Befund „Ordner hochladen lädt scheinbar den Testordner“ im Test-Browser nicht nachstellbar (Upload lädt den gewählten Ordner);
  am Tablet offen. Codex 011/012 übernommen, Zahlen mit drei Einordnern in den Regeldateien.

## Stand (13.11.2026 abends, Fassung 0.3.0)

- **Sitzung Punkte 3–9 (13.11., Freibrief):** Brief `docs/BRIEF_ABSCHLUSS_2026-11-13_PUNKTE-3-9.md`. Neue fremde Stapel `pruefstapel-familie-k3`
  (+`-ocr`, Punkte 3–5), `pruefstapel-vermieter-2` (+`-ocr`, Punkt 6), `pruefstapel-anfragen` (Punkt 8) – je Regeln vorab
  (`docs/PRUEFSTAPEL-FAMILIE-K3-REGELN.md`, `-VERMIETER-2-`, `-CALCULATE-`), vorläufig zwei Einordner (Codex-Aufträge 011/012 im Briefkasten).
  Kern 0.3.0: Fristen, Briefdatum, Wortmodell aus verbrauchten Stapeln (`briefmodell-abstimmen.mjs --verbraucht …`), **Merken nach Sache**
  (`lib/lernen.ts`), **Stichprobe nur Zahlen** (`lib/stichprobe.ts`, Seite „Verlauf“). **Kern als JavaScript** für Apps ohne Bau-Schritt:
  `kern-js/` (`node scripts/kern-js.mjs`, im Bau geprüft) – BookLedgerPro zieht `erkennen.js`/`kategorien.js` mit Pin.
  Ergebnisse: Familienakte-Absender 45 → 97 % (gesichert), Fristen und Art am fremden Stapel **nicht** besser; Calculate erster Blindtest.

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
- Installierbar als Web-App (PWA, „Datei-Organizer Basic“): `src/public/sw.js` (Offline-Vorrat nur der App; Nummer `VORRAT` bei jeder Fassung erhöhen),
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
- Kein Merge nach `main` ohne Klaus' Wort; eigener Zweig, Entwurfs-PR. **Klaus 13.11. (Rückwärtstest Needs): Freibrief —
  eigene geprüfte PRs (CI und Proben grün) selbst mergen und den Auftrag selbstständig zu Ende führen; Veröffentlichen weiter nur
  mit seinem Wort.** Brief: `docs/BRIEF_ABSCHLUSS_2026-11-13_NEEDS-RUECKWAERTSTEST.md`.
