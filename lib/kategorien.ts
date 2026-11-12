/**
 * Lebensbereiche – dieselbe Liste wie in der Familienakte (`lib/family-categories.ts`, Stand 2.28.65), damit ein
 * vorsortierter Ordner dort ohne Umbenennen ankommt. Ändert sich die Liste dort, wird sie hier nachgezogen
 * (Probe `kategorien gleich der Familienakte` in scripts/run-kern-tests.mjs vergleicht, wenn die Familienakte daneben liegt).
 */
export const KATEGORIEN = [
  "Familie & persönliche Dokumente",
  "Finanzen & Konten",
  "Versicherungen",
  "Steuern & Behörden",
  "Haus & Wohnung",
  "Energie & Versorgung",
  "Garten & Grundstück",
  "Einkäufe, Rechnungen & Garantien",
  "Gesundheit & Pflege",
  "Rente, Arbeit & Sozialversicherung",
  "Auto & Mobilität",
  "Motorrad",
  "Technik, Geräte & Reparaturen",
  "Verträge & Abonnements",
  "Erbschaft, Vollmachten & Vorsorge",
  "Reisen & Freizeit",
  "Korrespondenz",
  "Archiv",
] as const;

/** Eigene Gruppe für Fotos ohne lesbaren Text (keine Kategorie der Familienakte; dort entscheidet die Zuordnung). */
export const FOTOS = "Fotos";
export const UNKLAR = "Unklar";

/** Schlüsselwörter je Lebensbereich. Treffer im Absender zählen doppelt. */
export const KATEGORIE_WOERTER: Record<string, string[]> = {
  "Familie & persönliche Dokumente": ["schule", "kita", "kindergarten", "elternabend", "liebe eltern", "geburtsurkunde", "personalausweis", "reisepass", "standesamt", "zeugnis"],
  "Finanzen & Konten": ["kontoauszug", "bank", "sparkasse", "volksbank", "kreditkarte", "depot", "girokonto", "darlehen", "kredit"],
  "Versicherungen": ["versicherung", "police", "versicherungsnummer", "beitragsrechnung", "schadenmeldung", "haftpflicht", "hausrat"],
  "Steuern & Behörden": ["finanzamt", "steuernummer", "steuerbescheid", "bürgeramt", "landratsamt", "stadtverwaltung", "bescheid", "aktenzeichen", "behörde", "rundfunkbeitrag"],
  "Haus & Wohnung": ["miete", "vermieter", "nebenkosten", "hausverwaltung", "wohnung", "mietvertrag", "zählerstand", "eigentümerversammlung"],
  "Energie & Versorgung": ["stadtwerke", "strom", "gas", "wasser", "fernwärme", "abschlag", "zähler", "energie", "netzbetreiber"],
  "Garten & Grundstück": ["garten", "grundstück", "grundsteuer", "baum", "zaun"],
  "Einkäufe, Rechnungen & Garantien": ["möbel", "angebot der woche", "rabatt", "kassenbon", "garantie", "bestellung", "lieferschein", "quittung", "kaufbeleg", "onlineshop", "artikel"],
  "Gesundheit & Pflege": ["praxis", "arzt", "ärztin", "dr. med", "klinik", "krankenhaus", "labor", "befund", "krankenkasse", "rezept", "pflege", "zahnarzt", "therapie", "diagnose", "aok", "tk ", "barmer"],
  "Rente, Arbeit & Sozialversicherung": ["rentenversicherung", "renteninformation", "rente", "entgelt", "netto", "gehalt", "entgeltabrechnung", "lohnabrechnung", "arbeitgeber", "personalnummer", "arbeitsvertrag", "jobcenter", "agentur für arbeit"],
  "Auto & Mobilität": ["autohaus", "kfz", "fahrzeug", "kennzeichen", "tüv", "hauptuntersuchung", "werkstatt", "zulassung", "fahrzeugschein", "kfz-steuer"],
  "Motorrad": ["motorrad", "kraftrad"],
  "Technik, Geräte & Reparaturen": ["reparatur", "gerät", "seriennummer", "elektromarkt", "handy", "laptop", "drucker", "kundendienst"],
  "Verträge & Abonnements": ["vertrag", "abonnement", "abo", "mitglied", "mitgliedsnummer", "kündigung", "mobilfunk", "internet", "fitness", "streaming"],
  "Erbschaft, Vollmachten & Vorsorge": ["vollmacht", "bevollmächtige", "testament", "erbschein", "patientenverfügung", "vorsorge", "notar"],
  "Reisen & Freizeit": ["reise", "buchung", "flug", "hotel", "urlaub", "ticket", "eintrittskarte", "verein"],
  "Korrespondenz": [],
  "Archiv": [],
};
