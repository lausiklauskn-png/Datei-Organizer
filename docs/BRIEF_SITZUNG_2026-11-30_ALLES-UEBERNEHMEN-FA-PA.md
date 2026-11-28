# Brief: „Alles übernehmen“ in Familienakte und Private Akte (Stand 28.11.2026 abends)

Klaus ist kein Programmierer: Deutsch, kurz, wenig Ausgabetext (Klaus 28.11.: „Ausgabetoken sparen“).
Vorgänger: `docs/BRIEF_SITZUNG_2026-11-30_NACH-DER-KETTE.md` (Stand dort).

## Klaus' Entscheidung (28.11., Freibrief)

Die große KI übernimmt das Sortieren; der Mensch prüft nur, was die KI selbst „niedrig“ nennt. Jede Korrektur wird Lehrfall.
Vorschau: https://claude.ai/artifact/MddgDp1KRQfaais6Ao4cnv – Fragen 1–10 gelten als Ja (Freibrief), Frage 6: Akte wird vorgeschlagen,
angelegt erst auf Tipp.

## Fertig (Datei-Organizer #89, #90, #91)

- Kern Fassung 2 (`lib/ki-sortieren.ts`): Art (inkl. AGB, Police, Gehaltsabrechnung, Steuerbescheid → `artKern`), Absender, Vorgang,
  betrifft (nur Platzhalter), Betrag, Richtung. Lernen aus Lehrfällen `lib/lehrmodell.ts`.
- Organizer-Oberfläche: „Alles übernehmen“, „niedrig“ ohne Haken, nach Vorgang gruppiert.
- Test mit frischer KI, 40 Stücke Prüfstadt: Bereich KI 37/40, Kern 33/40 (Skripte nicht im Repo; Ablauf: Auftrag mit
  `auftragMaskieren` + `sortierAuftrag`, KI-Antwort durch `planPruefen`, gegen `SOLL.json`). Ein Lauf ≈ 300 000 Tokens.

## Zu tun (der Reihe nach)

1. **Familienakte** (`app/ki-sortieren-eingang.tsx`, `lib/ki-sortieren-eingang.ts`): Kern liegt schon als Pin (#242). Plan nach Vorgang
   gruppieren; „Alles übernehmen“ legt Bereich, Art, Absender (Organisation), betrifft (Person), Fristen direkt ab statt nur Vorschlag im
   Prüf-Fenster; „niedrig“ bleibt Vorschlag. Vorgang → Vorgang (case) nur auf Tipp anlegen. Summen je Vorgang (Betrag/Richtung) auf dem Gerät.
2. **Private Akte:** Klon `datei-organizer` auf den Stand von #91 nachziehen; Eingang der Akte bekommt den Weg (Haken, „Mit großer KI
   sortieren“), Vorschlag gelb an der Zeile, „Alles übernehmen“ setzt Bereich und Person; Akte als Vorschlag.
3. **Muster ins Repo (ohne Wörter):** Fehlermuster aus Lehrfällen („Kern X, bestätigt Y, n-mal“) zählen; daraus erfundene Briefe
   schreiben lassen und den Kern damit nachlernen – nur wenn genug Lehrfälle vom Gerät da sind.

## Startauftrag

```
Lies im Datei-Organizer docs/BRIEF_SITZUNG_2026-11-30_ALLES-UEBERNEHMEN-FA-PA.md und arbeite „Zu tun“ der Reihe nach ab.
Freibrief für Entscheidungen, tokensparend, kurze Antworten. Je Schritt frisch von origin/main, Proben grün, selbst mergen.
Nichts veröffentlichen ohne mein Wort.
```
