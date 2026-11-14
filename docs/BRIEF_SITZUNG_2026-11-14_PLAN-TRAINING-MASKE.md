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

## Nachtrag (Klaus 14.11.2026, später am Morgen)

**Pseudo-Ordner – Maske in beide Richtungen.** Der Gmail-Konnektor wird getrennt; die Mails liest nur Private Brain.
Private Brain maskiert heute nur auf dem Weg hinaus (Schreiben mit KI). Neu: eine App (Android und Windows) mit **zwei Ordnern**:
Original-Ordner (echte Dateien, unverändert) und Pseudo-Ordner (dieselben Dateien mit Platzhaltern „Person A“, „Konto 1“ …).
Hineinziehen → pseudonymisiert im anderen Ordner. Mit dem Pseudo-Ordner arbeitet jede KI (sortieren, nach Wichtigkeit ordnen,
Antworten entwerfen); der Datei-Organizer lernt nur daraus. **Zurück** (eine Antwort mit „Person A“ wieder mit echtem Namen) nur auf
dem Gerät; die Zuordnung liegt verschlüsselt dort und verlässt es nie (wie `reidentify` beim Schreiben mit KI in Private Brain).
Name offen: Pseudo-Ordner, Maskenordner, Doppelordner.

**Profile, damit die Maske sich nicht irrt.** Man legt sein **eigenes Profil** an (Name, Anschrift, Geburtsdatum, Konten,
Versicherten-/Kunden-/Steuernummern) und **Profile der Menschen, mit denen man zu tun hat** (Familie, Kontakte), dazu
**Stellen** (Krankenkasse, Arzt, Vermieter, Bank) mit ihren Anschriften und Nummern. Was in einem Profil steht, wird immer sicher
erkannt und ersetzt; das Muster-Erkennen bleibt nur für Unbekanntes. Beim ersten Fehler: **„Korrigieren“** – „das hier verdecken“
oder „das darf bleiben“; die Maske merkt es sich (wie in BookLedgerPro „Weitere Namen“ und „Nie verdecken“).
Profile liegen nur verschlüsselt auf dem Gerät, nie im Repo, nie bei einer KI. Vorhandenes nutzen: Familienakte (Personen,
Organisationen), BookLedgerPro (Stammdaten, Weitere Namen, `namensmuster.js`), Private Brain (Modul 25).

**Offene Punkte dazu für die Plansitzung**

9. **Gesundheitsdaten:** ICD-Code bleibt · wird zur Gruppe („Herz-Kreislauf“) · wird ersetzt – je Nutzer wählbar? (DSGVO Art. 9.)
10. **Datum:** bleibt (sonst kein Sortieren), außer Geburtsdatum → z. B. nur Geburtsjahr.
11. **Scans und Fotos:** Texterkennung, dann Stellen im Bild schwärzen (Bausteine Reinigung/OCR aus Workflow PDF) – größter Teil.
12. **Stellen:** Krankenkasse, Bank, Vermieter als Firmen stehen lassen (wichtig fürs Sortieren) oder verdecken? Je Profil wählbar.
13. **Profile teilen:** zwischen Private Brain, Familienakte, BookLedgerPro und Datei-Organizer über den gemeinsamen Pro-Tresor?

**Reihenfolge (Klaus 14.11.2026: „Genauso machen wir das“)**

14. **Erst Marktcheck:** was es schon gibt (Microsoft Presidio, Google Sensitive Data Protection, Private AI, Tonic, Browser-
    Erweiterungen, Schwärzen in PDF-Programmen …), aktuell recherchiert, mit Stärken und Grenzen. Dann **das Beste übernehmen**
    (Erkennungsregeln, deutsche Nummernformate, Umkehr-Verfahren) – Lizenzen prüfen, nichts blind kopieren.
15. **Dann Modul 25 verbessern** (Quelle bleibt Sage, byte-gleich mit Pin) und **in alle Apps nachziehen**, die es enthalten oder nutzen
    (Familienakte `lib/ki-auftrag.ts`, Private Brain, BookLedgerPro, weitere) – je App eine Probe und Gegenprobe.
16. **Nie doppelt pseudonymisieren:** schon pseudonymisierte Dateien müssen sicher erkennbar sein (z. B. feste Marke im Kopf/Metadaten
    und einheitliche Platzhalter-Form wie `⟦Person A⟧`), damit der Pseudo-Ordner sie nicht ein zweites Mal verarbeitet und
    Platzhalter nicht selbst für Namen hält. Probe: eine pseudonymisierte Datei erneut hineinziehen → unverändert.

17. **Als Knopf in jeder App (Klaus 14.11.2026):** derselbe Baustein (Modul 25 + Profile + Erkennung der Marke) steckt in jeder
    Pro-App als Knopf **„Pseudonymisieren“** an Datei, Mail oder Auswahl (und **„Zurückführen“** für Antworten), nach den gemeinsamen
    Profilen. Der Pseudo-Ordner ist dann nur eine weitere Art, denselben Baustein zu benutzen (Hineinziehen statt Knopf).
    Eine Quelle, byte-gleich mit Pin in allen Apps, nie nachbauen. Klären: wo die Profile liegen (Pro-Tresor?), welche App zuerst.

**Entscheidungen Klaus (14.11.2026, Vorplansitzung)**

- **Profile liegen in der Familienakte.** Sie arbeitet ohnehin mit den anderen Apps zusammen; jede Pro-App (BookLedgerPro,
  Private Brain Pro, Workflow PDF Pro und alle im Verbund) holt sich dort die Daten **für** die Pseudonymisierung (Weg über den
  gemeinsamen Pro-Tresor klären; ohne Familienakte: was dann?).
- **Kein eigenes Werkzeug, kein neues Repo.** Nur der Knopf in jeder App, an dem man direkt sieht, wie pseudonymisiert wird.
- **Beispiel Private Brain Pro:** Mail mit Inhalt öffnen → „Pseudonymisieren“ → Text **und Anhänge**; ein Anhang wird geöffnet,
  bei Bild/Scan läuft die Texterkennung (OCR) darüber, dann werden die Daten pseudonymisiert und können weiterverarbeitet werden.
  Gilt für empfangene und selbst gesendete Mails.

- **Profile im Pro-Tresor, in jeder App wählbar:** In der Familienakte, BookLedgerPro und allen Pro-Apps kann man Profile anlegen.
  Damit es keine Doppelungen gibt, fragt jede App: **„Profile aus einer anderen Pro-App übernehmen“ oder „selbst anlegen“**.
  Profile dürfen Gesundheits- und Bankdaten enthalten.
- **Verschlüsseln und kein Anschein von Datenabfluss** (Vorschläge Claude, je Punkt Klaus' Ja):
  a) nur im Pro-Tresor, verschlüsselt wie dort (AES-256-GCM, Schlüssel nur auf dem Gerät), nie im Klartext, nie in einem Repo;
  b) **nur Fingerabdrücke statt Klartext** für Nummern: IBAN, Versicherten-, Steuer-, Kundennummer werden als gesalzener
     Fingerabdruck gespeichert; die Maske erkennt sie im Text, ohne dass das Profil die Nummer selbst enthält; angezeigt nur
     „DE…1234“. Zurückführen braucht sie nicht (der Originaltext liegt ohnehin auf dem Gerät);
  c) der Profil-Baustein hat **keinen Netzweg** (keinen Abruf, keine KI); die App sagt das sichtbar („Profile verlassen dieses
     Gerät nie“) und zeigt, dass beim Pseudonymisieren nichts gesendet wird; Proben belegen es (kein Netzaufruf);
  d) IBAN muss man gar nicht eintragen: Muster mit Prüfziffer erkennt jede IBAN auch ohne Profil – Profile braucht es vor allem
     für Namen, Anschriften, eigene Nummern;
  e) Nachweis für Dritte: der Quelltext ist einsehbar, eine kurze Seite „Was mit deinen Profilen passiert“.

- **PWA-Apps (Basic) besonders** (Klaus: „vor allen Dingen bei den PWA-Apps“): Im Browser wird der Code bei jedem Laden vom Server
  geholt, fremde Browser-Erweiterungen können mitlesen, und es gibt keinen Pro-Tresor. Vorschläge: in Basic Profile **nur als
  Fingerabdrücke** (nie Klartext-Nummern), Speicherung verschlüsselt im Browser mit eigenem Passwort; strenge Sicherheitsregel
  der Seite (CSP `connect-src` nur zur eigenen Adresse); Hinweis „Für Gesundheits- und Bankdaten die Pro-App nehmen“;
  Frage an Klaus: Profile in Basic überhaupt anbieten oder nur in den Pro-Apps?

18. **Landkarten nachziehen:** der Pseudonymisierer (Knopf in jeder App, Profile im Pro-Tresor, Weg Familienakte → andere Apps,
    Rückweg „Zurückführen“) kommt als eigener Kasten in die Pro-Verbund-Karte (Quelle BookLedgerPro, byte-gleich in den anderen
    Apps), in die Landkarte der Familienakte und in die Landkarte des Datei-Organizers; zuerst grau „geplant“, dann je Stand.
    Danach Geschenkbox neu bauen.

## Startauftrag zum Einfügen

```
Repo lausiklauskn-png/Datei-Organizer (eigener Zweig). PLANSITZUNG – nichts bauen, nichts veröffentlichen.
Zuerst lesen: CLAUDE.md, docs/BRIEF_SITZUNG_2026-11-14_PLAN-TRAINING-MASKE.md (ganz, mit Nachtrag und Entscheidungen),
docs/PLAN.md, docs/PRUEFREGELN-GRUPPE.md; in Private Brain Pro docs/KI-BEIM-SCHREIBEN.md, docs/AUFRAEUMEN-NEWSLETTER.md.
Ziel: Plan „Pseudonymisieren in allen Pro-Apps“ – Knopf „Pseudonymisieren“/„Zurückführen“ in jeder App, Profile im
Pro-Tresor (aus der Familienakte übernehmen oder selbst anlegen, verschlüsselt, Nummern nur als Fingerabdruck),
Mail mit Anhängen samt OCR, Training des Datei-Organizers nur aus pseudonymisierten Daten.
Reihenfolge: zuerst Marktcheck (aktuell recherchieren), dann das Beste übernehmen, dann Modul 25 verbessern und in alle
Apps nachziehen, nie doppelt pseudonymisieren, Landkarten nachziehen. Punkte 1–18 aus dem Brief; Klaus sagt je Punkt Ja.
Ergebnis: docs/PLAN_PSEUDONYMISIEREN.md + HTML-Vorschau der sichtbaren Teile.
Nicht: echte Dokumente oder pseudonymisierte Texte ins Repo (öffentlich), keine Schlüssel/PINs im Chat oder in Dateien,
Gmail-Konnektor nicht als Quelle (liest Klartext), kein neues Repo, nichts veröffentlichen.
```
