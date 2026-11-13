import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, Download, File, FileImage, FileText, FolderOpen, FolderTree, HelpCircle, History, ListChecks, Mail, Pencil, RotateCcw, Search, ShieldAlert, Smartphone, Undo2 } from "lucide-react";
import type { Datei, FeldName } from "../lib/typen.ts";
import { STUFEN, offeneFelder, gesperrt } from "../lib/siebe.ts";
import { SICHTEN, baum, dateienUnter, suche, type BaumKnoten } from "../lib/sichten.ts";
import { KATEGORIEN, FOTOS, UNKLAR } from "../lib/kategorien.ts";
import { SCHRIFTSTUECKE, dringlichkeit } from "../lib/erkennen.ts";
import { offeneFuerNummer } from "../lib/archivnummer.ts";
import { stichprobe, anteilText } from "../lib/stichprobe.ts";
import { deutsch, kurzfassung, INDEX_DATEI } from "../lib/index-format.ts";
import { Ablaufbild, FesterBaum, Info, OrdnerBaum, Seitentitel, type Schritt } from "./ui.tsx";
import { ausAuswahl, nativWaehlen, nativerOrdner, ordnerWaehlen, ordnerWahlMoeglich, testOrdner } from "./quellen.ts";
import { heute, type AppZustand, type SeitenId } from "./app.tsx";

type P = { z: AppZustand; gehe: (s: SeitenId) => void };

const FELD_NAMEN: Record<FeldName, string> = { schriftstueck: "Art", kategorie: "Bereich", absender: "Absender", betrifft: "Betrifft", datum: "Datum", frist: "Frist" };
const AUSWAHL: Partial<Record<FeldName, string[]>> = { kategorie: [...KATEGORIEN, FOTOS, UNKLAR], schriftstueck: [...SCHRIFTSTUECKE] };
const offenBei = (d: Datei) => offeneFelder(d).length > 0;

function Meldung({ z }: P) {
  if (!z.meldung) return null;
  return <p className={`meldung ${z.meldung.art || ""}`} role="status" data-meldung>{z.meldung.text}</p>;
}

function DateiSymbol({ d }: { d: Datei }) {
  if (d.auffaellig) return <ShieldAlert size={18} className="ico" color="#b42318"/>;
  if (d.art === "bild") return <FileImage size={18} className="ico"/>;
  if (d.art === "email") return <Mail size={18} className="ico"/>;
  if (d.art === "pdf" || d.art === "text" || d.art === "office") return <FileText size={18} className="ico"/>;
  return <File size={18} className="ico"/>;
}

function Zustand({ d }: { d: Datei }) {
  if (d.auffaellig) return <span className="badge warn">gesperrt</span>;
  if (d.doppeltVon) return <span className="badge">doppelt</span>;
  if (d.archivnummer) return <span className="badge gut">{d.archivnummer}</span>;
  if (offenBei(d)) return <span className="badge pruefen">bitte prüfen</span>;
  if (d.stufe >= 5) return <span className="badge gut">fertig</span>;
  return <span className="badge">Sieb {d.stufe}</span>;
}

// ---------------- Ordner ----------------
const SD_BAUM = { titel: "SD-Karte", kinder: [
  { titel: "Family_Projekt_de", unter: "Pro-Tresor (verschlüsselt) – hier nicht hinein" },
  { titel: "Datei-Organizer", unter: "diesen Ordner wählen", kinder: [
    { titel: "Eingang", unter: "Scanner, Handy, Mail-Anhänge – alles durcheinander" },
    { titel: INDEX_DATEI, unter: "schreibt der Organizer, sonst nichts" },
  ] },
] };

export function OrdnerSeite({ z, gehe }: P) {
  const dateiWahl = useRef<HTMLInputElement>(null), ordnerWahl = useRef<HTMLInputElement>(null);
  const [laeuft, setLaeuft] = useState(false);
  const los = async (f: () => Promise<unknown>) => { setLaeuft(true); try { await f(); } catch (e) { z.setMeldung({ text: (e as Error).message, art: "fehler" }); } finally { setLaeuft(false); } };
  const nativ = nativerOrdner(), pc = ordnerWahlMoeglich();
  const zahlen = useMemo(() => ({
    gesamt: z.dateien.length, auff: z.dateien.filter((d) => d.auffaellig).length, dopp: z.dateien.filter((d) => d.doppeltVon).length,
    offen: z.dateien.filter(offenBei).length, fertig: z.dateien.filter((d) => d.stufe >= 5 && !offenBei(d) && !gesperrt(d)).length,
  }), [z.dateien]);
  return <>
    <Seitentitel symbol={<FolderOpen size={24}/>} titel="Ordner" info={<Info titel="Ein Ordner für alles" punkte={[
      "Alles kommt in einen Ordner: Scans, Fotos, Mail-Anhänge, alte Dateien.",
      "Die Originale bleiben, wo sie sind. Der Organizer liest nur.",
      `Er schreibt nur eine Datei dazu: ${INDEX_DATEI} (die Sortierung).`,
      "Die Familienakte holt sich Kopien und ordnet sie nach dieser Datei zu.",
    ]} mehr={<FesterBaum wurzel={SD_BAUM} label="Wo der Ordner auf der SD-Karte liegt"/>}/>}/>
    <section className="card" data-ordner-wahl>
      <div className="card-heading"><h2>{z.ordnerName ? `Ordner: ${z.ordnerName}` : "Ordner wählen"}</h2>
        <Info titel="Welcher Weg?" punkte={[
          "Handy/Tablet mit Familienakte Pro: „Ordner auf dem Gerät“ – auch SD-Karte.",
          "PC mit Chrome oder Edge: „Ordner am PC“ – lesen und Sortierung zurückschreiben.",
          "Jeder Browser: „Dateien wählen“ – nur lesen, die Sortierung wird heruntergeladen.",
          "„Testordner“: 101 erfundene Dateien zum Ausprobieren.",
        ]}/></div>
      <div className="button-row">
        {nativ && <button type="button" className="button primary" disabled={laeuft} onClick={() => los(async () => { const q = await nativWaehlen(); if (q) await z.einlesenAus(q); })}><Smartphone size={18}/>Ordner auf dem Gerät</button>}
        {pc && <button type="button" className={`button ${nativ ? "" : "primary"}`} disabled={laeuft} onClick={() => los(async () => { const q = await ordnerWaehlen(); if (q) { await z.einlesenAus(q); } })} data-pc-ordner><FolderOpen size={18}/>Ordner am PC</button>}
        <button type="button" className="button" disabled={laeuft} onClick={() => ordnerWahl.current?.click()}><FolderTree size={18}/>Ordner hochladen</button>
        <button type="button" className="button" disabled={laeuft} onClick={() => dateiWahl.current?.click()}><File size={18}/>Dateien wählen</button>
        <button type="button" className="button" disabled={laeuft} onClick={() => los(() => z.einlesenAus(testOrdner()))} data-testordner><Archive size={18}/>Testordner</button>
      </div>
      <input ref={dateiWahl} type="file" multiple hidden onChange={(e) => { const l = e.target.files; if (l?.length) void los(() => z.einlesenAus(ausAuswahl(l, "Ausgewählte Dateien"))); e.target.value = ""; }}/>
      <input ref={ordnerWahl} type="file" multiple hidden {...{ webkitdirectory: "" }} onChange={(e) => { const l = e.target.files; if (l?.length) { const n = (l[0] as File & { webkitRelativePath?: string }).webkitRelativePath?.split("/")[0] || "Ordner"; void los(() => z.einlesenAus(ausAuswahl(l, n))); } e.target.value = ""; }}/>
      {z.fortschritt && <div className="fortschritt" role="progressbar" aria-valuemin={0} aria-valuemax={z.fortschritt.gesamt} aria-valuenow={z.fortschritt.fertig} aria-label="Einlesen"><span style={{ width: `${(100 * z.fortschritt.fertig) / z.fortschritt.gesamt}%` }}/></div>}
      {z.fortschritt && <p className="leise">{z.fortschritt.fertig} von {z.fortschritt.gesamt} gelesen …</p>}
      <Meldung z={z} gehe={gehe}/>
    </section>
    {zahlen.gesamt > 0 && <section className="card" data-ueberblick>
      <div className="card-heading"><h2>Überblick</h2><button type="button" className="text-link" onClick={() => { if (confirm("Sortierung in diesem Browser vergessen? Die Originale im Ordner bleiben.")) void z.neuBeginnen(); }}><RotateCcw size={15}/>Neu beginnen</button></div>
      <Ablaufbild label="Stand der Siebe" schritte={STUFEN.map((s): Schritt => ({ titel: s.name, unter: s.kurz, art: s.nr < z.stufe ? "gut" : s.nr === z.stufe ? "hervor" : "aus" }))}/>
      <div className="chips" style={{ marginTop: 12 }}>
        <span className="chip" data-zahl="gesamt">{zahlen.gesamt} Dateien</span>
        <span className="chip" data-zahl="fertig">{zahlen.fertig} fertig</span>
        {zahlen.offen > 0 && <span className="chip" data-zahl="offen">{zahlen.offen} bitte prüfen</span>}
        {zahlen.auff > 0 && <span className="chip" data-zahl="auffaellig">{zahlen.auff} gesperrt</span>}
        {zahlen.dopp > 0 && <span className="chip" data-zahl="doppelt">{zahlen.dopp} doppelt</span>}
      </div>
      <div className="button-row" style={{ marginTop: 12 }}>
        <button type="button" className="button primary" onClick={() => gehe("sortieren")}><ListChecks size={18}/>Weiter sortieren</button>
        <button type="button" className="button" onClick={() => gehe("finden")}><FolderTree size={18}/>Ansehen</button>
      </div>
    </section>}
  </>;
}

// ---------------- Sortieren ----------------
function PruefZeile({ z, d }: { z: AppZustand; d: Datei }) {
  const felder = offeneFelder(d) as FeldName[];
  const [feld, setFeld] = useState<FeldName>(felder[0]);
  const [aendern, setAendern] = useState(false);
  const [wert, setWert] = useState("");
  useEffect(() => { if (!felder.includes(feld)) setFeld(felder[0]); }, [felder.join(), feld]);
  if (!feld) return null;
  const w = d.felder[feld];
  const liste = AUSWAHL[feld];
  return <div className="pruef-zeile" data-pruef={d.pfad}>
    <div><strong>{d.name}</strong>
      <span className="grund">{FELD_NAMEN[feld]}: <b>{w?.wert || "–"}</b> · {w?.grund || "nicht erkannt"}</span>
      {felder.length > 1 && <span className="grund">Noch offen: {felder.map((f) => FELD_NAMEN[f as FeldName]).join(", ")}</span>}
    </div>
    <div className="pruef-aktionen">
      {!aendern ? <>
        {w?.wert && <button type="button" className="button klein" onClick={() => z.aendern(d.pfad, feld, w.wert)} data-stimmt><Check size={15}/>Stimmt</button>}
        <button type="button" className="button klein" onClick={() => { setWert(w?.wert || ""); setAendern(true); }} data-korrigieren><Pencil size={15}/>Ändern</button>
      </> : <>
        {liste ? <select value={wert} onChange={(e) => setWert(e.target.value)} aria-label={FELD_NAMEN[feld]} data-wert>{!liste.includes(wert) && <option value={wert}>{wert || "–"}</option>}{liste.map((k) => <option key={k}>{k}</option>)}</select>
          : <input value={wert} onChange={(e) => setWert(e.target.value)} aria-label={FELD_NAMEN[feld]} type={feld === "datum" || feld === "frist" ? "date" : "text"} data-wert style={{ padding: "6px 8px", borderRadius: 9, border: "1px solid var(--line)" }}/>}
        <button type="button" className="button klein primary" disabled={!wert.trim()} onClick={() => { z.aendern(d.pfad, feld, wert.trim()); setAendern(false); }} data-uebernehmen>Übernehmen</button>
        <button type="button" className="button klein" onClick={() => setAendern(false)}>Abbrechen</button>
      </>}
    </div>
  </div>;
}

export function SortierenSeite({ z, gehe }: P) {
  const offen = useMemo(() => z.dateien.filter(offenBei), [z.dateien]);
  const [alle, setAlle] = useState(false);
  if (!z.dateien.length) return <><Seitentitel symbol={<ListChecks size={24}/>} titel="Sortieren"/><section className="card"><p>Noch kein Ordner gelesen.</p><button type="button" className="button primary" onClick={() => gehe("ordner")}><FolderOpen size={18}/>Ordner wählen</button></section></>;
  const sichtbar = alle ? offen : offen.slice(0, 15);
  return <>
    <Seitentitel symbol={<ListChecks size={24}/>} titel="Sortieren" info={<Info titel="Die Siebe" punkte={[
      "Jedes Sieb schaut genauer hin: erst die Art, dann der Briefkopf, dann Bereich und Nummern, dann der Absender, zuletzt der ganze Text.",
      "Was sicher ist, fällt durch. Was unsicher ist, bleibt hängen: „bitte prüfen“.",
      "Deine Korrektur gilt sofort für alle Dateien vom selben Absender.",
      "Gesperrte und doppelte Dateien bleiben liegen – sie werden nicht weitergegeben.",
    ]}/>}/>
    <section className="card" data-siebe>
      <Ablaufbild label="Siebe" schritte={STUFEN.map((s): Schritt => ({ titel: s.name, unter: s.kurz, art: s.nr < z.stufe ? "gut" : s.nr === z.stufe ? "hervor" : "aus" }))}/>
      <div className="button-row" style={{ marginTop: 14 }}>
        <button type="button" className="button primary" disabled={z.stufe >= 5} onClick={() => z.naechstes()} data-naechstes>Nächstes Sieb</button>
        <button type="button" className="button" disabled={z.stufe >= 5} onClick={() => z.naechstes(5)} data-durchsieben>Ganz durchsieben</button>
        <button type="button" className="button" disabled={!z.kannZurueck()} onClick={() => z.zurueck()} data-zurueck><Undo2 size={17}/>Sieb zurück</button>
        <Info titel="Ganz durchsieben" punkte={["Läuft alle Siebe nacheinander.", "Hält an, sobald etwas zu prüfen ist. Danach einfach noch einmal drücken."]}/>
      </div>
      <Meldung z={z} gehe={gehe}/>
    </section>
    <section className="card" data-pruefliste>
      <div className="card-heading"><h2>Bitte prüfen <span className="badge pruefen">{offen.length}</span></h2>
        <Info titel="Prüfen" punkte={["„Stimmt“ bestätigt den Vorschlag.", "„Ändern“ setzt einen eigenen Wert.", "Beides merkt sich der Organizer und lernt daraus.", "Rückgängig unter „Verlauf“."]}/></div>
      {offen.length === 0 ? <p className="leise" data-nichts-offen>Nichts zu prüfen{z.stufe >= 5 ? " – alles sortiert." : "."}</p>
        : <>{sichtbar.map((d) => <PruefZeile key={d.pfad} z={z} d={d}/>)}
          {offen.length > sichtbar.length && <button type="button" className="text-link" style={{ marginTop: 10 }} onClick={() => setAlle(true)}>Alle {offen.length} zeigen</button>}</>}
    </section>
    {z.stufe >= 5 && offen.length === 0 && <section className="card"><div className="button-row"><button type="button" className="button primary" onClick={() => gehe("akte")}><Archive size={18}/>Weiter zur Familienakte</button><button type="button" className="button" onClick={() => gehe("finden")}><FolderTree size={18}/>Ansehen</button></div></section>}
  </>;
}

// ---------------- Finden ----------------
function Steckbrief({ z, d }: { z: AppZustand; d: Datei }) {
  const [bild, setBild] = useState<string | null>(null);
  useEffect(() => { setBild(null); }, [d.pfad]);
  const f = d.felder;
  const zeile = (name: string, w?: { wert: string; sicher: boolean; grund: string; quelle: string }, anzeige?: string) => w ? <><dt>{name}</dt><dd><span className="feld-wert">{anzeige ?? w.wert}{w.quelle === "du" ? <span className="badge du">von dir</span> : w.quelle === "gelernt" ? <span className="badge du">gelernt</span> : !w.sicher ? <span className="badge pruefen">unsicher</span> : null}</span><span className="grund">{w.grund}</span></dd></> : null;
  const oeffnen = async (anzeigen: boolean) => {
    const b = await z.original(d.pfad);
    if (!b) { z.setMeldung({ text: "Original nur nach dem Einlesen in dieser Sitzung erreichbar. Ordner neu wählen.", art: "halt" }); return; }
    const url = URL.createObjectURL(d.art === "bild" ? new Blob([b], { type: "image/jpeg" }) : d.art === "pdf" ? new Blob([b], { type: "application/pdf" }) : b);
    if (anzeigen && d.art === "bild") { setBild(url); return; }
    window.open(url, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  return <section className="card steckbrief" data-steckbrief={d.pfad}>
    <div className="titel-zeile"><DateiSymbol d={d}/><h2 style={{ overflowWrap: "anywhere" }}>{d.name}</h2><Zustand d={d}/></div>
    <p className="leise">{kurzfassung(d)}</p>
    <dl>
      <dt>Liegt in</dt><dd>{d.pfad}</dd>
      <dt>Datei</dt><dd>{d.artText || "–"} · {Math.max(1, Math.round(d.groesse / 1024))} KB</dd>
      {d.auffaellig && <><dt>Gesperrt</dt><dd className="grund" style={{ color: "var(--red)" }}>{d.auffaellig}</dd></>}
      {d.doppeltVon && <><dt>Doppelt von</dt><dd>{d.doppeltVon}</dd></>}
      {zeile("Art", f.schriftstueck)}{zeile("Bereich", f.kategorie)}{zeile("Absender", f.absender)}{zeile("Betrifft", f.betrifft)}
      {zeile("Datum", f.datum, f.datum && deutsch(f.datum.wert))}{zeile("Frist", f.frist, f.frist && `${deutsch(f.frist.wert)} · ${dringlichkeit(f.frist.wert, heute())}`)}{zeile("Betrag", f.betrag)}
      {f.nummern?.length ? <><dt>Nummern</dt><dd>{f.nummern.map((n) => <span key={n.art + n.wert} className="chip" style={{ marginRight: 4 }}>{n.art}: {n.wert}</span>)}</dd></> : null}
      {d.bild && <><dt>Foto</dt><dd>{[d.bild.aufnahme && deutsch(d.bild.aufnahme), [d.bild.hersteller, d.bild.modell].filter(Boolean).join(" "), d.bild.breite && `${d.bild.breite}×${d.bild.hoehe}`, d.bild.gps && "mit Ort"].filter(Boolean).join(" · ")}</dd></>}
      {d.email && <><dt>Mail</dt><dd>{d.email.betreff}{d.email.anhaenge.length ? ` · ${d.email.anhaenge.length} Anhang/Anhänge` : ""}</dd></>}
    </dl>
    <div className="button-row" style={{ marginTop: 12 }}>
      {!d.auffaellig && <button type="button" className="button klein" onClick={() => oeffnen(true)} data-original>Original ansehen</button>}
      <Info titel="Original" punkte={["Öffnet die Datei aus dem Ordner. Sie wird nicht verändert.", "Gesperrte Dateien öffnet der Organizer nicht."]}/>
    </div>
    {bild && <img src={bild} alt={`Foto ${d.name}`} className="vorschau-bild"/>}
    {d.volltext && <details style={{ marginTop: 10 }}><summary className="leise">Erkannter Text</summary><pre style={{ whiteSpace: "pre-wrap", fontSize: ".8rem", maxHeight: 260, overflow: "auto" }}>{d.volltext.slice(0, 3000)}</pre></details>}
  </section>;
}

export function FindenSeite({ z, gehe }: P) {
  const moeglich = SICHTEN.filter((s) => s.ab <= Math.max(z.stufe, 0));
  const [sichtId, setSichtId] = useState("ordnung");
  const sicht = moeglich.find((s) => s.id === sichtId) || [...moeglich].sort((a, b) => b.ab - a.ab)[0] || SICHTEN[SICHTEN.length - 1];
  const [frage, setFrage] = useState("");
  const [knoten, setKnoten] = useState<BaumKnoten | null>(null);
  const [gewaehlt, setGewaehlt] = useState<string>("");
  const wurzel = useMemo(() => baum(z.dateien, sicht, heute()), [z.dateien, sicht]);
  useEffect(() => { setKnoten(null); }, [sicht.id]);
  const nachPfad = useMemo(() => new Map(z.dateien.map((d) => [d.pfad, d])), [z.dateien]);
  const liste = useMemo(() => {
    if (frage.trim()) return suche(z.dateien, frage);
    const k = knoten || wurzel;
    return dateienUnter(k).map((p) => nachPfad.get(p)!).filter(Boolean);
  }, [frage, knoten, wurzel, z.dateien, nachPfad]);
  const datei = gewaehlt ? nachPfad.get(gewaehlt) : undefined;
  if (!z.dateien.length) return <><Seitentitel symbol={<FolderTree size={24}/>} titel="Finden"/><section className="card"><p>Noch kein Ordner gelesen.</p><button type="button" className="button primary" onClick={() => gehe("ordner")}><FolderOpen size={18}/>Ordner wählen</button></section></>;
  return <>
    <Seitentitel symbol={<FolderTree size={24}/>} titel="Finden" info={<Info titel="Sichten" punkte={["Ein Ordner, viele Bäume: nach Bereich, Absender, Person, Datum, Frist, Nummer …", "Die Dateien liegen dabei nicht doppelt – der Baum ist nur eine Ansicht.", "Weitere Sichten erscheinen, sobald das passende Sieb gelaufen ist."]}/>}/>
    <div className="werkzeug-leiste">
      <label className="suchfeld"><Search size={17}/><input type="search" placeholder="Suchen: Name, Absender, Nummer, Text …" value={frage} onChange={(e) => setFrage(e.target.value)} aria-label="Suchen" data-suche/></label>
      <label className="sicht-wahl"><span className="leise">Sicht</span><select value={sicht.id} onChange={(e) => setSichtId(e.target.value)} data-sicht>{moeglich.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    </div>
    <div className="explorer" style={{ marginTop: 14 }}>
      <section className="card"><OrdnerBaum wurzel={wurzel} gewaehlt={knoten?.id || "alle"} waehlen={(k) => { setKnoten(k); setFrage(""); }} label={`Baum: ${sicht.name}`}/></section>
      <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
        <section className="card" data-liste>
          <div className="card-heading"><h2>{frage.trim() ? `Treffer für „${frage.trim()}“` : (knoten?.titel || "Alle Dateien")}</h2><span className="badge">{liste.length}</span></div>
          <ul className="dateiliste">{liste.slice(0, 200).map((d) => <li key={d.pfad}><button type="button" className="datei-zeile" aria-current={gewaehlt === d.pfad} onClick={() => setGewaehlt(d.pfad)} data-datei={d.pfad}>
            <DateiSymbol d={d}/><span><strong>{d.felder.absender?.wert && d.felder.schriftstueck?.wert ? `${d.felder.schriftstueck.wert} · ${d.felder.absender.wert}` : d.name}</strong><small>{d.pfad}{d.felder.datum ? ` · ${deutsch(d.felder.datum.wert)}` : ""}</small></span><Zustand d={d}/>
          </button></li>)}</ul>
          {liste.length > 200 && <p className="leise">Erste 200 von {liste.length}. Suche genauer.</p>}
          {liste.length === 0 && <p className="leise">Nichts gefunden.</p>}
        </section>
        {datei && <Steckbrief z={z} d={datei}/>}
      </div>
    </div>
  </>;
}

// ---------------- Verlauf ----------------
export function VerlaufSeite({ z }: P) {
  const liste = [...z.verlauf.entries()].reverse();
  return <>
    <Seitentitel symbol={<History size={24}/>} titel="Verlauf" info={<Info titel="Verlauf" punkte={["Jede Bestätigung und Korrektur steht hier.", "„Rückgängig“ nimmt sie zurück – die Datei landet wieder bei „bitte prüfen“.", "Aus den Korrekturen lernt der Organizer Regeln je Absender."]}/>}/>
    <div className="raster-2">
      <section className="card" data-verlauf>
        <div className="card-heading"><h2>Korrekturen</h2><span className="badge">{z.verlauf.length}</span></div>
        {liste.length === 0 ? <p className="leise">Noch nichts korrigiert.</p> : <ul className="verlauf-liste">{liste.map(([i, k]) => <li key={k.zeit + i}>
          <span><strong>{FELD_NAMEN[k.feld]}</strong> {k.bestaetigt ? <>bestätigt: „{k.zu}“</> : <>„{k.von || "–"}“ → „{k.zu}“</>}<span className="grund">{k.pfad.split("/").pop()} · {new Date(k.zeit).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}</span></span>
          <button type="button" className="button klein" onClick={() => z.rueckgaengig(i)} data-rueckgaengig><Undo2 size={15}/>Rückgängig</button>
        </li>)}</ul>}
      </section>
      <section className="card" data-regeln>
        <div className="card-heading"><h2>Gelernt</h2><span className="badge du">{z.regeln.length}</span></div>
        {z.regeln.length === 0 ? <p className="leise">Noch keine Regel.</p> : <ul className="verlauf-liste">{z.regeln.map((r) => <li key={r.wenn.absender + r.feld + (r.wenn.sache || "")}><span>Absender „{r.wenn.absender}“{r.wenn.sache ? <> bei Vorschlag „{r.wenn.sache}“</> : null} → {FELD_NAMEN[r.feld]} „{r.dann}“</span><span className="leise">{r.anzahl}×</span></li>)}</ul>}
      </section>
      <StichprobeKarte z={z}/>

    </div>
  </>;
}

// ---------------- Stichprobe (Punkt 9): nur Zahlen ----------------
function StichprobeKarte({ z }: { z: AppZustand }) {
  const sp = useMemo(() => stichprobe(z.verlauf), [z.verlauf]);
  const [kopiert, setKopiert] = useState(false);
  const felder = Object.entries(sp.felder);
  return <section className="card" data-stichprobe>
    <div className="card-heading"><h2>Stichprobe – nur Zahlen</h2><span className="badge">{sp.dateien}</span></div>
    <Info titel="Stichprobe eigener Unterlagen" punkte={["Lege 30 bis 50 eigene Unterlagen ein und bestätige oder berichtige bei jeder Datei Bereich, Art, Absender und Frist.", "Hier steht nur, wie oft der erste Vorschlag stimmte – keine Namen, keine Texte, keine Dateinamen.", "Nichts verlässt das Gerät. „Zahlen kopieren“ legt nur diese Zahlen in die Zwischenablage."]}/>
    {felder.length === 0 ? <p className="leise">Noch nichts bestätigt oder berichtigt.</p> : <ul className="verlauf-liste">{felder.map(([f, w]) => <li key={f}><span><strong>{FELD_NAMEN[f as FeldName] || f}</strong> {anteilText(w)}</span><span className="leise">{w.berichtigt} berichtigt</span></li>)}</ul>}
    {felder.length > 0 && <button type="button" className="button klein" data-stichprobe-kopieren onClick={() => { void navigator.clipboard?.writeText(JSON.stringify(sp)).then(() => setKopiert(true)); }}><Check size={15}/>{kopiert ? "Kopiert" : "Zahlen kopieren"}</button>}
  </section>;
}

// ---------------- Familienakte ----------------
export function AkteSeite({ z, gehe }: P) {
  const [mitText, setMitText] = useState(true);
  const { bereit, wartet } = useMemo(() => offeneFuerNummer(z.dateien), [z.dateien]);
  const mitNummer = z.dateien.filter((d) => d.archivnummer).length;
  const gesperrt_ = z.dateien.filter(gesperrt).length;
  return <>
    <Seitentitel symbol={<Archive size={24}/>} titel="An die Familienakte" info={<Info titel="Übergabe" punkte={[
      "Die Originale bleiben im Ordner.",
      `Die Sortierung steht in ${INDEX_DATEI} im selben Ordner.`,
      "Die Familienakte holt Kopien (Sicherheit › Cloud-Ordner hereinholen) und ordnet sie danach zu.",
      "Gesperrte und doppelte Dateien gibt der Organizer nicht weiter.",
    ]} mehr={<FesterBaum label="Weg der Dateien" wurzel={{ titel: "Datei-Organizer (Ordner)", unter: "Originale bleiben", kinder: [{ titel: INDEX_DATEI, unter: "Sortierung" }, { titel: "Familienakte", unter: "holt Kopien, ordnet zu" }] }}/>}/>}/>
    <section className="card" data-archivnummern>
      <div className="card-heading"><h2>Archivnummern</h2><Info titel="Archivnummer" punkte={[
        "Für Papier im Ordner: Nummer auf das Blatt schreiben, dann findet man es wieder.",
        "Vergeben wird erst, wenn eine Datei ganz gesiebt ist und nichts mehr zu prüfen ist.",
        "Reihenfolge: Datum, dann Bereich, dann Absender.",
        "Eine Nummer ändert sich nie. Neue Dateien bekommen die nächste.",
      ]}/></div>
      <div className="chips"><span className="chip">{mitNummer} mit Nummer</span><span className="chip" data-bereit>{bereit.length} bereit</span><span className="chip">{wartet.length} warten</span>{gesperrt_ > 0 && <span className="chip">{gesperrt_} gesperrt/doppelt</span>}</div>
      <div className="button-row" style={{ marginTop: 12 }}>
        <button type="button" className="button primary" disabled={!bereit.length} onClick={() => z.nummern()} data-nummern-vergeben>{bereit.length ? `${bereit.length} Nummern vergeben` : "Keine bereit"}</button>
        {wartet.length > 0 && <button type="button" className="text-link" onClick={() => gehe("sortieren")}>Zuerst sortieren ›</button>}
      </div>
    </section>
    <section className="card" data-index>
      <div className="card-heading"><h2>Sortierung speichern</h2><Info titel={INDEX_DATEI} punkte={[
        "Steckbrief je Datei: Art, Bereich, Absender, Betrifft, Datum, Frist, Nummern, Archivnummer.",
        "Mit Text: der erkannte Text in Abschnitten – für Suche und KI.",
        "Ohne Text: kleiner, nur die Steckbriefe.",
        "Am PC und mit Familienakte Pro landet sie im Ordner, sonst als Download.",
      ]}/></div>
      <label className="titel-zeile"><input type="checkbox" checked={mitText} onChange={(e) => setMitText(e.target.checked)} data-mit-text/>Erkannten Text mitgeben</label>
      <div className="button-row" style={{ marginTop: 12 }}>
        <button type="button" className="button primary" disabled={!z.dateien.length} onClick={() => z.indexSichern(mitText)} data-index-sichern><Download size={18}/>{z.quelle?.schreiben ? "In den Ordner schreiben" : "Herunterladen"}</button>
      </div>
      <Meldung z={z} gehe={gehe}/>
    </section>
  </>;
}

// ---------------- Hilfe ----------------
export function HilfeSeite({ gehe }: P) {
  return <>
    <Seitentitel symbol={<HelpCircle size={24}/>} titel="Hilfe"/>
    <section className="card">
      <h2>So geht es</h2>
      <Ablaufbild label="Ablauf" schritte={[
        { titel: "Ordner", unter: "alles hinein" }, { titel: "Sieben", unter: "Klick für Klick" }, { titel: "Prüfen", unter: "nur das Unsichere" },
        { titel: "Nummern", unter: "wenn alles steht" }, { titel: "Familienakte", unter: "holt Kopien", art: "gut" },
      ]}/>
      <div className="button-row" style={{ marginTop: 12 }}><button type="button" className="button primary" onClick={() => gehe("ordner")}><FolderOpen size={18}/>Zum Ordner</button></div>
    </section>
    <section className="card">
      <div className="card-heading"><h2>Wo liegt was?</h2><Info titel="SD-Karte" punkte={["Den Ordner „Datei-Organizer“ neben den Tresor legen, nicht hinein.", "Der Tresor verschlüsselt – dort kann der Organizer nicht lesen."]}/></div>
      <FesterBaum wurzel={SD_BAUM} label="Ordner auf der SD-Karte"/>
    </section>
    <section className="card">
      <h2>Häufige Fragen</h2>
      <details><summary>Werden meine Dateien verändert?</summary><p className="leise">Nein. Der Organizer liest nur. Er schreibt höchstens {INDEX_DATEI} dazu.</p></details>
      <details><summary>Geht etwas ins Internet?</summary><p className="leise">Nein. Alles läuft in diesem Gerät. Die Sortierung merkt sich nur dieser Browser.</p></details>
      <details><summary>Was heißt „gesperrt“?</summary><p className="leise">Die Datei sieht anders aus, als ihr Name sagt (z. B. ein Programm mit „.pdf“). Nicht öffnen, löschen.</p></details>
      <details><summary>Was heißt „doppelt“?</summary><p className="leise">Gleicher Inhalt wie eine andere Datei. Die ältere bleibt, die Kopie wird nicht weitergegeben.</p></details>
      <details><summary>Werden Fotos gelesen?</summary><p className="leise">Aufnahmedatum, Gerät und Ort aus dem Foto ja. Text im Bild (Schrift erkennen) kommt später.</p></details>
    </section>
  </>;
}
