# Prüfregeln für die Gruppe der Pro-Apps

Klaus 12.11.2026: „Die Prüfung soll für die ganze Gruppe gelten.“ Gruppe im Sinn des Mycels: **Familienakte**, **BookLedgerPro**
(mit BookLedger Basic), **Private Brain Pro** und der **Datei-Organizer** als Prüf- und Sortierwerkzeug. Ob Workflow PDF Pro dazugehört,
ist noch nicht entschieden. Dieses Dokument ist die gemeinsame Prüfquelle: Wer eine Erkennung, Zuordnung oder ein gelerntes Modell
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

## Stand je Knoten (12.11.2026)

| Knoten | Was nach diesen Regeln nachgewiesen ist | Offen |
| --- | --- | --- |
| BookLedgerPro (und Basic) | Kontoregeln (Stapel 2, drei Einordner), Datum und Steuersatz (Stapel 3, drei Einordner) | Wortmodell (Stapel 4 läuft), Kreuztest mit Lehrdaten eines anderen Systems, echte Stichprobe |
| Datei-Organizer | erster Blindtest Briefe mit **einem** Einordner (Bereich 51–65 %, Absender 54 %) | zweiter und dritter Einordner, Verbesserung des Kerns mit neuem Stapel |
| Familienakte | Vergleich am selben Briefstapel mit einem Einordner (Bereich 28–36 %, Absender 36 %) | Übernahme des Kerns erst nach Nachweis; Messung mit gefüllter Akte |
| Private Brain Pro | nichts gemessen | Dokumentart-Vorschlag gegen denselben Briefstapel |
