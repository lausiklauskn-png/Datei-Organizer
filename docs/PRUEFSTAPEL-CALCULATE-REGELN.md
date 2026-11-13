# Prüfstapel „Anfragen“ (Punkt 8: Workflow Calculate und Workflow Needs) – Regeln, vorab festgelegt (13.11.2026)

Eingecheckt, bevor es den Stapel gibt. Es gelten `docs/PRUEFREGELN-GRUPPE.md`. Auftrag Klaus 13.11. (Brief Punkte 3–9, Punkt 8, Freibrief).

## Bestandsaufnahme (was die Apps selbst erkennen)

- **Workflow Calculate** liest Anfragen selbst (`assets/kern/anfrage.js`, `lesen(roh, katalog, kunden)`, ohne KI): Absender (Name, E-Mail),
  Kundennummer, Mengen, Maße (B × H), Farbenzahl, passende Produkte aus dem Katalog, dazu den Kunden aus der Kundenliste.
  Preise kommen nur aus dem Katalog bzw. der freiwilligen Recherche, nie aus der Anfrage – sie werden nicht gemessen.
- **Workflow Needs** erkennt aus Dokumenten nichts selbst (E-Mails und PDF nur zur Ansicht/als Anhang). Gemessen wird dort nichts;
  das steht so im Bericht („liest die App nicht“), nicht als 0 %.

## Frage

Wie gut liest Workflow Calculate (Stand main `c6b8dd9`, eingefroren beim Messen) fremde Anfragen? Erster Blindtest, Standmessung.

## Stapel `pruefstapel-anfragen/`

- Ein Agent ohne Zugang zu Apps und früheren Stapeln schreibt **60 Anfragen** (E-Mails als .eml und als Text, Kontaktformular, Notiz
  nach Telefonat) an einen erfundenen Werbetechnik- und Gravurbetrieb; er kennt nur die Liste der Produktarten (`SORTIMENT.json`).
  Mischung: Vereine, Firmen, Privatleute (Hochzeit, Geburtstag), Stammkunden mit Kundennummer, mehrere Produkte in einer Anfrage,
  Mengen als Zahl und als Wort („zwei Dutzend“), Staffelfragen („50 oder 100“), Maße in mm/cm/m, Farbenzahl, Rückfragen ohne Menge.
- Soll je Anfrage (`ERWARTUNG.json`): absender (Name), email, kundennr, produkte [{art, menge}], masse {breiteMm, hoeheMm}, farben.

## Einordner und Messung

Stapel-Autor, zweiter Claude-Agent (Codex optional über den Briefkasten). Soll = Übereinstimmung; ohne sie strittig, nicht gewertet.
Je Feld: richtig, falsch, leer (Wilson-Spanne). Produkt: Produktart der erkannten Katalogvorlage gegen die Soll-Art; Menge je Produkt.
Einmal gemessen, danach verbraucht.

## Grenzen

Erfunden, von einem KI-Agenten geschrieben; kein Gerät. Erster Stand, kein Alt-gegen-Neu-Vergleich.
