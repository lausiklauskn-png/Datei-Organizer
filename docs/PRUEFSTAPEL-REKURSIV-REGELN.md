# Rekursive Verbesserung – Regeln, vorab festgelegt (15.11.2026)

Eingecheckt, **bevor** die Prüfstadt existiert. Auftrag: `docs/BRIEF_SITZUNG_2026-11-15_REKURSIVE-VERBESSERUNG.md`. Es gelten
`docs/PRUEFREGELN-GRUPPE.md` (Regeln 1–10), `docs/FACHREGEL.md` und die Lehre aus `docs/PRUEFBERICHT-EHRLICHKEIT-2026-11-14.md`
(kein Nachweis an einer Welt, die der eigene Setzer oder Schreiber gebaut hat). Recherche dazu: `docs/RECHERCHE-REKURSIVE-VERBESSERUNG-2026-11-15.md`.

## Zwei getrennte Städte

1. **Lernstadt** (`pruefstapel-stadt-lern/`): eine erfundene Stadt mit Ämtern, Kasse, Vermietern, Firmen, Ärzten, Vereinen und
   Haushalten. Ein **Stadtplaner**-Agent legt Stadt, Haushalte und Ereignisse eines Jahres fest; **mehrere Absender-Agenten**
   (je eine Gruppe: Ämter, Geld und Versicherung, Wohnen und Verträge, Gesundheit und Schule, Privates und Vereine) schreiben die
   Schriftstücke aus ihrer Sicht; ein **Fallen-Autor** schreibt bewusst schwere Stücke (Klaus: „bewusst Fehler einbauen“), z. B. ein
   Brief, der einen Kontoauszug erwähnt, Werbung im Gewand einer Rechnung, Mahnung ohne das Wort „Mahnung“, Absender nur im Logo.
   Soll = Angabe der Schreiber. Die Lernstadt ist **zum Lernen** da und wird angesehen.
2. **Prüfstadt** (`pruefstapel-stadt-pruef/`): gleiche Bauart, aber **andere** Agenten (eigener Planer, eigene Absender-Agenten,
   kein Fallen-Autor), andere Stadt. Kein Agent der Prüfstadt sieht die Lernstadt, das Repo oder den Kern. Bis zur Messung liegt
   sie außerhalb des Repos und wird von mir nicht geöffnet. Soll = Mehrheit von **drei unabhängigen Einordnern** (zwei Sonnet,
   ein Opus) nach den Trainings-Regeln Punkt 3–4; bei drei verschiedenen Urteilen entscheidet der Schreiber, wenn er einem folgt.
3. Alles erfunden (Namen, Firmen mit „Beispiel“ oder sichtbar erfunden, IBAN nur Nullen, Kennzeichen „BSP-…“). Öffentliche Vorlagen
   (Bescheid-Aufbau, Rechnungsfelder, DIN-Brief) nur als Aufbau, nichts wörtlich.

## Schleife (nur an Lerndaten)

4. Lerndaten = alle verbrauchten Stapel (Runden C–F, Rest, Absender, Briefe, Vermieterin, Familie K3) und die Lernstadt.
   Die Schleife ist „raten → Korrektur → lernen“: der Kern rät, das Soll korrigiert, gelernt wird nur aus den Fehlern.
5. Jede Methode wird **reihum** gewählt (ein Stapel ausgelassen, dort gemessen). Die Lernstadt zählt dabei als eigener Stapel.
   Eine Methode kommt in den Kandidaten nur, wenn sie reihum **über alle Stapel zusammen** besser ist und an keinem Stapel um mehr
   als 2 Punkte schlechter. Zahlen reihum sind Abstimmwerte, kein Nachweis.
6. Vor der Messung wird der Kandidat **eingefroren** (Commit-Kennung unten). Danach ändert sich am Kern nichts mehr.

## Nachweis (einmal, an der Prüfstadt)

7. **Alt** = Kern `079dd6d` (Fassung 0.4.4). **Neu** = eingefrorener Kandidat. Gemessen am reinen Text der Prüfstadt,
   `scripts/messen-briefe.mjs` mit dem Soll aus den Einordnern.
8. **Hauptkennzahl (eine):** Anteil richtiger Feld-Urteile über die fünf Felder Bereich, Schriftstück, Absender, Person (nur wo das
   Soll eine nennt), Frist. Test: gepaarte Differenz je Stück, Bootstrap über **Absender** (10 000 Ziehungen), einseitig 5 %.
   Gilt als besser, wenn die untere Grenze der 90-%-Spanne der Differenz über 0 liegt.
9. **Nebenzahlen:** je Feld Wilson-Spanne und McNemar, mit Holm über fünf Felder; nur als Hinweis, kein Nachweis.
   Verschlechterungen werden genannt.
10. **Gegenprobe der Methode:** Mit denselben Lerndaten wird auch das **bisherige Vorgehen** gerechnet (nur das Wortmodell neu
    abstimmen mit `scripts/briefmodell-abstimmen.mjs --verbraucht …`, ohne neue Schicht). Es wird ebenfalls eingefroren und an
    der Prüfstadt einmal gemessen. Die neue Methode gilt erst dann als besser als das alte Vorgehen, wenn sie dort auch dieses
    schlägt (gleicher Test wie Punkt 8).
11. **Übertragung:** In die Familienakte nur nach Punkt 8 **und** 10 und mit Klaus' Ja. Veröffentlicht wird nichts ohne sein Wort.
12. **Grenze:** erfundene Unterlagen von Claude-Agenten, reiner Text (kein Scan in dieser Runde). Die Zahlen gelten für diese Machart.

## Eingefroren

(wird vor der Messung eingetragen: Kern neu, Kern Gegenprobe, Hash der Lerndaten)
