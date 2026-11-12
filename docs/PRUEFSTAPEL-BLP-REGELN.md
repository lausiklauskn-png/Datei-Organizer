# Blindtest BookLedgerPro – Regeln, vorab festgelegt (12.11.2026)

Festgelegt und eingecheckt, bevor der Stapel geschrieben und bevor gemessen wird. Grundlage: die Prüfung der Vorgehensweise vom
12.11. (Fehlerspannen, zweiter Einordner, eindeutige Listen, einmal messen).

1. **Gegenstand:** BookLedgerPro, Stand `a705ed5` (main zum Zeitpunkt dieser Festlegung). Gemessen werden die reinen Bausteine
   `src/ai/extract.js` (`extractFromText`: Betrag brutto, Datum, USt-Satz) und `src/ai/categorize.js` (`categorize`: Konto,
   Richtung Einnahme/Ausgabe). Nichts daran wird vor der Messung geändert.
2. **Stapel:** Ein Hilfs-Agent ohne Zugang zu BookLedgerPro, zum Datei-Organizer und zu allen bisherigen Testdaten schreibt
   120 erfundene Belege eines kleinen Betriebs als Text (wie nach Texterkennung): Kassenbons, Tankquittungen, Lieferanten- und
   Ausgangsrechnungen, Abrechnungen von Kartenterminal und Bank, Miete, Versicherung, Beiträge, Telefon, Porto, Bewirtung,
   Reisekosten, Fortbildung, Beratung. Die Kontenliste bekommt er als JSON-Liste (keine Kommas im Fließtext). Ordner
   `pruefstapel-blp/`.
3. **Zweiter Einordner:** Ein zweiter Hilfs-Agent ordnet dieselben 120 Belege unabhängig einem Konto zu, ohne die Soll-Werte des
   ersten zu sehen. Die Übereinstimmung beider (Anteil gleich und Cohens Kappa) zeigt, wie viel Treffer überhaupt erreichbar ist.
   Soll-Wert für die Messung ist der des ersten Agenten; Belege, bei denen beide uneins sind, werden zusätzlich getrennt ausgewiesen.
4. **Einmal messen**, Zahlen wie gemessen, mit 95-%-Fehlerspanne (Wilson). Felder: Betrag brutto (auf den Cent), Datum, USt-Satz,
   Richtung, Konto. Außerdem eine Verwechslungstabelle der Konten.
5. **Nicht gemessene Felder heißen „nicht gemessen“, nie 0 %.** Ein Beleg ohne Soll-Wert für ein Feld zählt bei diesem Feld nicht mit.
6. **Danach** dürfen die Regeln von BookLedgerPro an den Fehlern lernen (eigener Zweig, Entwurfs-PR dort, vorhandene Proben grün).
   Der Stapel ist dann verbraucht; für einen neuen Blindtest braucht es einen neuen Stapel.

## Ergänzung, festgelegt vor dem ersten Beleg (12.11.2026, Klaus: „Kern übernehmen, wenn nachweislich besser“)

7. **Datei-Organizer-Kern als zweite Spalte:** Am selben Stapel wird der Kern (Stand Commit `85526fe`, `lib/` unverändert seit
   `44a88c1`) gemessen: Betrag (`erkenneBetrag`), Datum (`erkenneDatum`), Aussteller (`erkenneAbsender`/Grußformel, nach
   `absenderVereinheitlichen`). Vergleich je Feld mit BookLedgerPro, beide mit Fehlerspanne; dazu McNemar-Test auf den Belegen,
   bei denen beide einen Wert liefern. „Besser“ gilt nur, wenn der Unterschied bei 5 % Irrtum gesichert ist.
8. **Kein Gewinner wird nachträglich gewählt:** Feld für Feld zählt die gemessene Zahl, auch wenn sie gegen den Kern ausfällt.
9. **Verbesserungen am Kern** (aus dem ersten Blindtest des Datei-Organizers) gelten erst als nachgewiesen, wenn alter und neuer
   Kern an einem **neuen**, von einem anderen Agenten geschriebenen Stapel je einmal gemessen sind (McNemar, 5 %).
