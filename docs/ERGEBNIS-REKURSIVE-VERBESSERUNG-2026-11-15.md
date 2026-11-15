# Rekursive Verbesserung des Sortier-Kerns – Ergebnis (15.11.2026)

Auftrag: `docs/BRIEF_SITZUNG_2026-11-15_REKURSIVE-VERBESSERUNG.md` · Recherche: `docs/RECHERCHE-REKURSIVE-VERBESSERUNG-2026-11-15.md` ·
Regeln vorab und Einfrieren: `docs/PRUEFSTAPEL-REKURSIV-REGELN.md`. Nichts veröffentlicht, nichts in die Familienakte übertragen.

## Kurz

- Die Schleife „raten → Korrektur → lernen“ ist gebaut: zwei **gelernte Bausteine** im Kern, die nur aus Fehlern lernen
  (gemitteltes Perzeptron): **Art des Schriftstücks** (`lib/artmodell.ts`, Wörter nach Lage im Brief) und **Absender-Wahl**
  unter den Zeilen des Schriftstücks (`lib/absenderwahl.ts`, greift nur, wenn die feste Regel unsicher ist). Daten erzeugt von
  `scripts/artmodell-lernen.mjs` und `scripts/absenderwahl-lernen.mjs` (nie von Hand ändern).
- **Prüfstadt (einmal gemessen, Text):** neu gegen 0.4.4 **+1,17 Punkte** über alle Feld-Urteile (82,60 → 83,78 %),
  **nicht gesichert** (90-%-Spanne −0,10 bis +2,29, p ≈ 0,07). Neu gegen das bisherige Vorgehen (nur Wortmodell neu lernen)
  **+1,17 Punkte, gesichert** (Spanne +0,12 bis +2,25, p ≈ 0,04).
- Getragen von der **Art: 74,5 → 80,5 %** (McNemar 11 gegen 23, p = 0,058). Absender +0,5, Bereich **−1** (das neu gelernte
  Wortmodell; das bisherige Vorgehen verliert dort genauso), Person und Frist unverändert.
- Nach den vorab festgelegten Regeln (Punkt 8 **und** 10) darf das **nicht** in die Familienakte. Der Kern dieses Zweigs bleibt
  ein Kandidat; ein zweiter unabhängiger Nachweis wäre nötig.

## Was gemacht wurde

1. **Recherche** mit acht Agenten (sechs Themen, Zusammenfassung, Gegenprüfung der Quellen): stärkstes passendes Verfahren ist das
   fehlergetriebene Lernen nach Brill; Warnungen vor Selbst-Training und vor Tests an der eigenen Welt; „einfach → schwer“ bringt laut
   Quellen kaum Genauigkeit.
2. **Zwei Städte von getrennten Agenten:** Lernstadt „Beispielhafen“ (Planer, vier Absender-Gruppen, Fallen-Autor mit 60 bewusst
   schweren Stücken; 240 Stücke, `pruefstapel-stadt-lern/`) und Prüfstadt „Musterbach“ (anderer Planer, andere Absender-Agenten,
   drei Einordner; 200 Stücke, `pruefstapel-stadt-pruef/`).
3. **Versuche reihum** an sieben verbrauchten Stapeln (alles Abstimmung, kein Nachweis):

| Versuch | Ergebnis reihum |
| --- | --- |
| Brill-Regelschicht über der Ausgabe | +0,25 Punkte – zu wenig; Placebo (vertauschte Korrekturen) verdirbt stark → braucht saubere Korrekturen |
| Regel/Modell-Zusammenspiel lernen (Schwelle, Zuverlässigkeit je Regel) | nichts |
| **Perzeptron für die Art** (Lage im Brief) | Art im ganzen Kern 80,4 → 84,8 % |
| Perzeptron für den Bereich | nicht besser als das Wortmodell (85,0 gegen 85,3) – bleibt |
| **Absender-Wahl gelernt** | Absender 81,9 → 84,1 % (Stapel „anderes Schreibsystem“ 58 → 79 %) |
| Gesamt (alle fünf Felder) | 0.4.4 85,65 · bisheriges Vorgehen 86,04 · **neu 87,48 %**, an jedem Stapel ≥ bisheriges Vorgehen bis auf −0,1 |

4. **Messgrundlage geprüft:** Die drei Einordner sind sich je Paar zu 94–100 % einig (Prüfstadt: Bereich 97,7, Art 97,0,
   Absender 94,0, Person 94,3, Frist 99,7) – Luft nach oben ist da (Kern 81–92 %).

## Was die Prüfstadt zeigt (Grenzen)

- Der Gewinn reihum (+1,4 bis +1,8 Punkte) schrumpft an der fremden Stadt auf +1,2 – erwartbar (Recherche: frische Welten sind schwerer).
- Von 39 Absender-Fehlern sind 16 nur Zusatz/Abteilung („Stadt Musterbach“ statt „Stadt Musterbach Bürgerbüro“) – das genaue Maß ist streng.
- Die Lernstadt half nicht als Lernmaterial (Soll nur vom Schreiber, eigenwillige Absender-Angaben wie „… Onlinehändler“) und blieb
  Teststapel. Die Fallen-Stücke waren für den Kern schwer (Lernstadt gesamt 75–76 %).
- Kosten: App-Paket +245 KB (Art-Modell 453 KB als Daten, gzip 222 KB gesamt).
- Erfundene Unterlagen von Claude-Agenten; die gesetzte Fassung (Barcode/QR) steht unten als Nebenzahl.

## Gesetzte Fassung (Nebenzahl, Simulator 3 mit Barcode/QR)

(folgt)

## Nächste Schritte (Vorschlag)

- Einen zweiten, unabhängigen Nachweis bauen, bevor etwas in die Familienakte geht (Regel 8 der Gruppe).
- Art: die häufigsten Restfehler sind „Aufforderung ← Brief“ und „Mahnung ← Rechnung“ – mehr Lehrmaterial mit drei Einordnern genau dafür.
- Bereich: das neu gelernte Wortmodell verliert an der Prüfstadt 1 Punkt – nicht übernehmen, ohne es eigens zu prüfen.
