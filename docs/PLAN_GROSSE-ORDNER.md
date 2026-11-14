# Plan: sehr große Ordner (Klaus 14.11.2026) – Vorschau, noch nicht gebaut

Klaus 14.11.: „dass eine freie Ordnerwahl stattfindet bei größeren Dateien … einen sehr großen Ordner mit sehr vielen Bytes zu sortieren …
auf die SD-Karte … und verarbeitet sie da … nicht, dass sie in diese Browser-Problematik hineinrutscht, was wir deswegen gemacht haben,
diese APK-App zu bauen.“

## Heute (0.4.2, im Code nachgesehen)

- Freie Ordnerwahl gibt es (Android-Ordnerwahl inkl. SD-Karte, Windows-Ordnerdialog). Originale werden **nicht** kopiert; geschrieben wird nur
  `organizer-index.json`.
- **Bricht bei großen Ordnern:**
  1. Jede Datei wird **ganz** in den Arbeitsspeicher der Oberfläche geladen (`QuellDatei.lesen` → `einlesen`, Fingerabdruck über alle Bytes),
     auch über 30 MB, wo kein Text mehr gelesen wird. Ein Video von mehreren GB bringt die App zum Absturz.
  2. Die Arbeitsdaten (Liste, gelesene Texte, Sortierung, Stand der Blöcke) liegen in IndexedDB der WebView = App-interner Speicher
     (Größe begrenzt, beim Deinstallieren weg).
  3. Die ganze Liste samt Texten liegt gleichzeitig im Arbeitsspeicher.

## Vorschlag (Ja/Nein je Punkt bei Klaus)

- **A** Große Dateien nie ganz laden: Fingerabdruck rechnet die App selbst (Java / Windows-Engine), stückweise am Ort; in die Oberfläche nur der
  Dateikopf und bei Dokumenten bis 30 MB der Text.
- **B** Arbeitsordner frei wählbar (z. B. SD-Karte): Liste, Texte, Stand blockweise als Dateien dorthin; in der App nur der Merker, welcher
  Arbeitsordner gilt. Deinstallieren verliert nichts; Grenze ist die SD-Karte. Offen: **(1) eigener Arbeitsordner** (empfohlen) oder
  (2) versteckter Unterordner im Dateiordner (bricht die Regel „nur organizer-index.json“).
- **C** Schlanke Liste im Arbeitsspeicher; Texte nur bei Bedarf aus dem Arbeitsordner.
- **D** Speicherprüfung vor jedem Block; zu wenig frei → anhalten mit Meldung, Weitermachen später.

Proben nur mit erfundenen Dateien (auch eine sehr große, erzeugt), keine Massenprüfung mit echten Dateien (Klaus 14.11.).
Veröffentlichen erst danach (Empfehlung; Klaus entscheidet).
