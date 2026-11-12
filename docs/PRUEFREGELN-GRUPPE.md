# Prüfregeln für die Gruppe der Pro-Apps

Klaus 12.11.2026: „Die Prüfung soll für die ganze Gruppe gelten.“ Gruppe im Sinn des Mycels: **Familienakte**, **BookLedgerPro**,
**Private Brain Pro** und der **Datei-Organizer** als Prüf- und Sortierwerkzeug. Klaus 12.11. (Nachtrag): Die **Basic-Fassungen gehören
dazu** – Familienakte Basic (die Web-App aus demselben Repo), BookLedger Basic (eigenes Repo, byte-gleich aus Pro nachgezogen) und
Private Brain Basic. Ein Nachweis gilt für eine Basic-Fassung nur, wenn dort derselbe Code läuft (byte-gleich nachgezogen oder
derselbe Bau); weicht sie ab, wird sie eigens gemessen. Ob Workflow PDF Pro dazugehört, ist noch nicht entschieden. Dieses Dokument ist die gemeinsame Prüfquelle: Wer eine Erkennung, Zuordnung oder ein gelerntes Modell
in einer dieser Apps verbessert, weist es nach diesen Regeln nach. Die Einzelheiten je Test stehen in
`docs/PRUEFSTAPEL-REGELN.md` (Briefe) und `docs/PRUEFSTAPEL-BLP-REGELN.md` (Belege).

## Die Regeln

1. **Vorab festlegen.** Gegenstand, Felder, Soll-Festlegungen und Auswertung stehen eingecheckt im Repo, bevor der Prüfstapel
   existiert. Was nachträglich geändert wird, steht als Nachtrag mit Datum und Grund dabei.
2. **Fremder Stapel.** Die Prüfunterlagen schreibt ein Agent, der weder die App noch die Lehrdaten noch frühere Stapel kennt.
   Der Stapel wird ungelesen eingecheckt.
3. **Drei unabhängige Einordner**, mindestens einer aus einem anderen KI-System (Briefkasten, siehe Sage-Protokoll
   `docs/ZUSAMMENARBEIT_ANDERES_KI_SYSTEM.md`). Soll = Mehrheit; ohne Mehrheit „strittig“ und getrennt ausgewiesen. Übereinstimmung
   je Paar und Fleiss' Kappa werden berichtet.
4. **Einmal messen**, alter gegen neuen Stand am selben Stapel, jede Zahl mit 95-%-Spanne (Wilson), der Unterschied mit McNemar
   (5 %). „Besser“ heißt gesichert besser. Was nicht gemessen ist, heißt „nicht gemessen“, nie 0 %.
5. **Verbraucht ist verbraucht.** An einem gemessenen Stapel darf danach gelernt werden; als Nachweis taugt er nicht mehr.
6. **Abstimmwerte sind kein Nachweis.** Einstellungen werden nur an verbrauchten Stapeln gewählt und vor dem neuen Stapel eingefroren.
7. **Nichts schönen.** Auch Verschlechterungen, blinde Proben und eigene Fehler stehen im Bericht. Bringt eine Änderung nichts,
   wird sie nicht eingebaut.
8. **Bausteine wandern nur mit Nachweis.** Ein Baustein aus einem Knoten wird in einen anderen nur übernommen, wenn er dort am
   fremden Stapel gesichert besser ist als das Vorhandene – und dann byte-gleich mit Pin, keine zweite Fassung.
9. **Grenze der Aussage.** Solange Prüfstapel von KI-Agenten geschrieben sind, gilt jede Zahl für „erfundene Unterlagen dieser
   Machart“. Für eine Aussage über echte Unterlagen braucht es eine Stichprobe echter Unterlagen, die das Gerät des Nutzers nie
   verlässt; berichtet werden nur Zahlen.
10. **Keine echten Daten in Repos, keine Forschung außerhalb von KimHub.** Stapel und Lehrdaten sind erfunden; Sitzungs-Befunde und
    Stunden stehen in KimHub.

## Die Suche über die Knoten (Klaus 12.11.: „sowohl intern als auch extern muss die Suche valide sein“)

Die Knoten wirken über die Suche zusammen: Wer ein Dokument sucht und nicht weiß, ob es in BookLedgerPro, Private Brain Pro, der
Familienakte oder in den E-Mails liegt, muss es über „Überall suchen“ bzw. das eigene Netz finden. Dafür gilt dasselbe Muster,
mit einem anderen Maß:

11. **Suchprüfstapel:** erfundene Unterlagen, verteilt auf die Knoten (und Mail-Anhänge), dazu Fragen in Alltagssprache, je mit dem
    Dokument, das die Antwort ist. Fragen und Unterlagen schreibt ein Agent, der die Suche nicht kennt; drei Einordner bestätigen
    unabhängig, welches Dokument zur Frage gehört (Fragen ohne Mehrheit zählen nicht).
12. **Gemessen wird je Frage:** steht das richtige Dokument an erster Stelle, unter den ersten drei, oder gar nicht – getrennt für
    Wortsuche und Bedeutungssuche, **intern** (im Knoten, in dem es liegt) und **extern** (von einem anderen Knoten aus über das Netz),
    und ob der richtige Knoten genannt wird. Dazu: wie oft ein falsches Dokument als sicher ausgegeben wird.
13. **Verschiedene Arten zu fragen:** wörtlich, umschrieben, mit Tippfehler, nur mit Datum oder Betrag, mit dem Namen einer Person.
    Jede Art wird getrennt ausgewiesen.
14. Für die Bedeutungssuche zählt nur eine Messung mit dem **echten** Modell der App; eine gestellte Antwort ist kein Nachweis.

## Stand je Knoten (12.11.2026)

| Knoten | Was nach diesen Regeln nachgewiesen ist | Offen |
| --- | --- | --- |
| BookLedgerPro und BookLedger Basic (byte-gleich nachgezogen, Stand Pro `2a3d653`) | Kontoregeln (Stapel 2), Datum und Steuersatz (Stapel 3), Wortmodell (Stapel 4) – je drei Einordner | Kreuztest mit Lehrdaten eines anderen Systems (Auftrag 002), echte Stichprobe; native Pro-Apps erst mit neuer Fassung |
| Datei-Organizer | erster Blindtest Briefe mit **einem** Einordner (Bereich 51–65 %, Absender 54 %); Soll seither von vier Einordnern geprüft: Schriftstück, Absender, Person, Frist tragen (Kappa 0,91–0,98), **Bereich nicht** (Kappa 0,80, Stapel-Autor gegen die anderen 68–76 %) | feste Regel für überschneidende Fächer, dann neuer Stapel und Verbesserung des Kerns |
| Familienakte Pro und Basic (ein Repo, derselbe Kern) | Vergleich am selben Briefstapel mit einem Einordner (Bereich 28–36 %, Absender 36 %) | Übernahme des Kerns erst nach Nachweis; Messung mit gefüllter Akte |
| Private Brain Pro und Basic | nichts gemessen; ob Basic denselben Code trägt, ist nicht nachgesehen | Dokumentart-Vorschlag gegen denselben Briefstapel |
| Suche über die Knoten | nichts gemessen (Proben bisher nur mit gestellter Hülle und gestelltem Modell) | Suchprüfstapel nach Regel 11–14, intern und extern |
