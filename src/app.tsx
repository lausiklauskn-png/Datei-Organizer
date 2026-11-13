import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, FolderOpen, FolderTree, HelpCircle, History, ListChecks, RefreshCw, Search } from "lucide-react";
import type { Datei, FeldName, Korrektur, Lernregel } from "../lib/typen.ts";
import { einlesen, doppelteMarkieren } from "../lib/einlesen.ts";
import { leseEml } from "../lib/eml.ts";
import { siebe, istUnsicher, offeneFelder } from "../lib/siebe.ts";
import { absenderVereinheitlichen } from "../lib/abgleich.ts";
import { korrigieren as korrigiereDatei, lernen, regelnAufAlle } from "../lib/lernen.ts";
import { archivnummernVergeben } from "../lib/archivnummer.ts";
import { indexLesen, organizerIndex, INDEX_DATEI } from "../lib/index-format.ts";
import { pdfLeser } from "./pdf.ts";
import { ausHandle, erlaubnisPruefen, herunterladen, type Quelle, type QuellDatei } from "./quellen.ts";
import { laden, loeschen, ordnerHolen, ordnerMerken, speichern } from "./zustand.ts";
import { OrdnerSeite, SortierenSeite, FindenSeite, VerlaufSeite, AkteSeite, HilfeSeite } from "./seiten.tsx";

export const FASSUNG = "0.3.1";
// Ladeanzeige: „suchen“ = Ordner wird durchgesehen (Zahl noch unbekannt), „lesen“ = Datei für Datei, „stand“ = gemerkter Stand beim Start.
export type Fortschritt = { phase: "stand" | "suchen" | "lesen"; fertig: number; gesamt: number; name?: string };
const luft = () => new Promise<void>((r) => setTimeout(r)); // dem Browser Zeit zum Zeichnen geben
export type SeitenId = "ordner" | "sortieren" | "finden" | "verlauf" | "akte" | "hilfe";
export type Meldung = { text: string; art?: "halt" | "fehler" } | null;
export const heute = () => new Date().toISOString().slice(0, 10);

const SEITEN: Array<{ id: SeitenId; name: string; symbol: typeof FolderOpen }> = [
  { id: "ordner", name: "Ordner", symbol: FolderOpen }, { id: "sortieren", name: "Sortieren", symbol: ListChecks },
  { id: "finden", name: "Finden", symbol: FolderTree }, { id: "verlauf", name: "Verlauf", symbol: History },
  { id: "akte", name: "Familienakte", symbol: Archive }, { id: "hilfe", name: "Hilfe", symbol: HelpCircle },
];
const seiteAusHash = (): SeitenId => { const h = location.hash.replace("#", ""); return (SEITEN.some((s) => s.id === h) ? h : "ordner") as SeitenId; };

export type AppZustand = ReturnType<typeof useOrganizer>;

function useOrganizer() {
  const [dateien, setDateien] = useState<Datei[]>([]);
  const [stufe, setStufe] = useState(0);
  const [verlauf, setVerlauf] = useState<Korrektur[]>([]);
  const [regeln, setRegeln] = useState<Lernregel[]>([]);
  const [ordnerName, setOrdnerName] = useState("");
  const [quelleArt, setQuelleArt] = useState("");
  const [quelle, setQuelle] = useState<Quelle | null>(null);
  const [meldung, setMeldung] = useState<Meldung>(null);
  const [fortschritt, setFortschritt] = useState<Fortschritt | null>({ phase: "stand", fertig: 0, gesamt: 0 });
  const [geladen, setGeladen] = useState(false);
  const stapel = useRef<Datei[][]>([]);
  const originale = useRef(new Map<string, QuellDatei | { blob: Uint8Array }>());

  // gemerkten Stand holen
  useEffect(() => { (async () => {
    const z = await laden();
    if (z) { setDateien(z.dateien); setStufe(z.stufe); setVerlauf(z.verlauf); setRegeln(z.regeln); setOrdnerName(z.ordnerName); setQuelleArt(z.quelle); }
    setGeladen(true); setFortschritt((f) => (f?.phase === "stand" ? null : f));
  })(); }, []);
  useEffect(() => {
    if (!geladen) return;
    const t = setTimeout(() => { void speichern({ fassung: 1, ordnerName, quelle: quelleArt, stufe, dateien, verlauf, regeln, zeit: new Date().toISOString() }); }, 400);
    return () => clearTimeout(t);
  }, [geladen, dateien, stufe, verlauf, regeln, ordnerName, quelleArt]);

  const einlesenAus = useCallback(async (q: Quelle) => {
    setMeldung({ text: `Lese „${q.name}“ …` });
    setFortschritt({ phase: "suchen", fertig: 0, gesamt: 0, name: q.name }); await luft();
    let liste: QuellDatei[];
    try { liste = await q.dateien(); } catch (e) { setFortschritt(null); setMeldung({ text: `Ordner „${q.name}“ nicht lesbar: ${(e as Error).message}. Die Anzeige ist unverändert.`, art: "fehler" }); return; }
    if (!liste.length) { setFortschritt(null); setMeldung({ text: `In „${q.name}“ liegen keine lesbaren Dateien. Die Anzeige ist unverändert.`, art: "halt" }); return; }
    const lesePdf = await pdfLeser();
    const neu: Datei[] = [];
    originale.current.clear();
    setFortschritt({ phase: "lesen", fertig: 0, gesamt: liste.length });
    let gezeichnet = performance.now();
    for (const [i, qd] of liste.entries()) {
      if (performance.now() - gezeichnet > 80) { setFortschritt({ phase: "lesen", fertig: i, gesamt: liste.length, name: qd.name }); await luft(); gezeichnet = performance.now(); }
      try {
        const bytes = await qd.lesen();
        const teile = await einlesen({ pfad: qd.pfad, name: qd.name, geaendert: qd.geaendert, bytes }, lesePdf);
        originale.current.set(qd.pfad, qd);
        neu.push(...teile);
      } catch (e) {
        neu.push({ pfad: qd.pfad, name: qd.name, groesse: 0, geaendert: qd.geaendert, stufe: 1, felder: { schriftstueck: { wert: "Unklar", sicher: false, grund: `nicht lesbar: ${(e as Error).message}`, quelle: "regel" } } });
      }
    }
    setFortschritt({ phase: "lesen", fertig: liste.length, gesamt: liste.length }); await luft();
    let fertig = doppelteMarkieren(neu);
    // Vorhandenen Index übernehmen: Archivnummern, Bestätigtes, Regeln, Verlauf (Nummern ändern sich nie)
    let ausIndex = 0;
    const roh = await q.indexLesen?.().catch(() => null);
    let alteRegeln: Lernregel[] = [], alterVerlauf: Korrektur[] = [];
    if (roh) {
      const r = indexLesen(roh);
      if (r.ok) {
        alteRegeln = r.index.lernregeln || []; alterVerlauf = r.index.verlauf || [];
        const nachSha = new Map(r.index.dateien.filter((s) => s.sha256).map((s) => [s.sha256!, s]));
        fertig = fertig.map((d) => {
          const s = (d.sha256 && nachSha.get(d.sha256)) || r.index.dateien.find((x) => x.pfad === d.pfad);
          if (!s) return d;
          ausIndex++;
          const n: Datei = { ...d, archivnummer: s.archivnummer, bestaetigt: {}, felder: { ...d.felder } };
          for (const [feld, si] of Object.entries(s.sicherheit || {})) if (si === "von dir") {
            const wert = (s as unknown as Record<string, string>)[feld];
            if (wert) { n.felder[feld as FeldName] = { wert, sicher: true, grund: "von dir (aus dem gespeicherten Index)", quelle: "du" }; n.bestaetigt![feld as FeldName] = true; }
          }
          return n;
        });
      }
    }
    stapel.current = [];
    setQuelle(q); setOrdnerName(q.name); setQuelleArt(q.art); setDateien(fertig); setStufe(1); setRegeln(alteRegeln); setVerlauf(alterVerlauf); setFortschritt(null);
    const auff = fertig.filter((d) => d.auffaellig).length, dopp = fertig.filter((d) => d.doppeltVon).length;
    setMeldung({ text: `${fertig.length} Dateien im Eingang · Sieb 1 fertig: ${auff} auffällig, ${dopp} doppelt${ausIndex ? ` · ${ausIndex} aus dem gespeicherten Index wiedererkannt` : ""}.`, art: auff ? "halt" : undefined });
  }, []);

  const pcOrdnerWieder = useCallback(async () => {
    const h = await ordnerHolen();
    if (!h || !(await erlaubnisPruefen(h as never))) return false;
    await einlesenAus(ausHandle(h as never));
    return true;
  }, [einlesenAus]);

  const naechstes = useCallback((bis?: number) => {
    let s = stufe, d = dateien;
    const ziel = bis ?? Math.min(5, stufe + 1);
    while (s < ziel) {
      stapel.current.push(d);
      s++;
      d = d.map((x) => siebe(x, s, regeln));
      if (s >= 4) d = absenderVereinheitlichen(d);
      const offen = d.filter((x) => istUnsicher(x, s)).length;
      if (bis !== undefined && offen) { setDateien(d); setStufe(s); setMeldung({ text: `Halt bei Sieb ${s}: ${offen} ${offen === 1 ? "Datei" : "Dateien"} bitte prüfen. Danach geht es weiter.`, art: "halt" }); return; }
      if (bis === undefined) { setMeldung(offen ? { text: `Sieb ${s} fertig · ${offen} bitte prüfen.`, art: "halt" } : { text: `Sieb ${s} fertig · alles sicher.` }); }
    }
    setDateien(d); setStufe(s);
    if (bis !== undefined) setMeldung({ text: "Ganz durchgesiebt. Alles sicher oder von dir bestätigt." });
  }, [stufe, dateien, regeln]);

  const zurueck = useCallback(() => {
    const vorher = stapel.current.pop();
    if (!vorher) return;
    setDateien(vorher); setStufe((s) => Math.max(1, s - 1));
    setMeldung({ text: "Ein Sieb zurück. Korrekturen aus diesem Sieb sind zurückgenommen." });
  }, []);

  const aendern = useCallback((pfad: string, feld: FeldName, zu: string) => {
    const d = dateien.find((x) => x.pfad === pfad);
    if (!d) return;
    const von = d.felder[feld]?.wert ?? "";
    const k: Korrektur = { zeit: new Date().toISOString(), pfad, feld, von, zu, bestaetigt: von === zu || undefined };
    const neu = korrigiereDatei(d, feld, zu);
    const neueRegeln = lernen(regeln, neu, k);
    setRegeln(neueRegeln);
    setVerlauf((v) => [...v, k]);
    setDateien((alle) => regelnAufAlle(alle.map((x) => x.pfad === pfad ? neu : x), neueRegeln));
  }, [dateien, regeln]);

  const rueckgaengig = useCallback((i: number) => {
    const k = verlauf[i];
    if (!k) return;
    const rest = verlauf.filter((_, j) => j !== i);
    setVerlauf(rest);
    setDateien((alle) => {
      let neu = alle.map((d) => {
        if (d.pfad !== k.pfad) return d;
        const n: Datei = { ...d, felder: { ...d.felder }, bestaetigt: { ...d.bestaetigt } };
        delete n.bestaetigt![k.feld];
        n.felder[k.feld] = { wert: k.von, sicher: false, grund: "zurückgenommen – bitte prüfen", quelle: "regel" };
        return n;
      });
      // Regeln aus dem übrigen Verlauf neu lernen
      let r: Lernregel[] = [];
      for (const x of rest) { const d = neu.find((y) => y.pfad === x.pfad); if (d) r = lernen(r, d, x); }
      setRegeln(r);
      neu = regelnAufAlle(neu, r);
      return neu;
    });
  }, [verlauf]);

  const nummern = useCallback(() => {
    const r = archivnummernVergeben(dateien);
    setDateien(r.dateien);
    setMeldung({ text: r.neu ? `${r.neu} Archivnummern vergeben.` : "Keine neue Datei bereit." });
  }, [dateien]);

  const indexText = useCallback((mitText: boolean) => JSON.stringify(organizerIndex(dateien, regeln, verlauf, heute(), `Datei-Organizer ${FASSUNG}`, mitText), null, 1), [dateien, regeln, verlauf]);
  const indexSichern = useCallback(async (mitText: boolean) => {
    const text = indexText(mitText);
    try {
      if (quelle?.schreiben) { await quelle.schreiben(INDEX_DATEI, text); setMeldung({ text: `${INDEX_DATEI} liegt jetzt im Ordner „${quelle.name}“.` }); }
      else { herunterladen(INDEX_DATEI, text); setMeldung({ text: `${INDEX_DATEI} heruntergeladen. Lege sie in den Ordner neben die Dateien.` }); }
    } catch (e) { setMeldung({ text: `Speichern nicht möglich: ${(e as Error).message}`, art: "fehler" }); }
  }, [indexText, quelle]);

  const original = useCallback(async (pfad: string): Promise<Blob | null> => {
    // Anhang einer Mail: aus der Mail neu lesen
    const haupt = pfad.split(" › ")[0];
    const q = originale.current.get(haupt) as QuellDatei | undefined;
    if (!q) return null;
    const bytes = await q.lesen();
    if (haupt === pfad) return new Blob([bytes as BlobPart]);
    const teile = await einlesenTeile(bytes, haupt);
    const a = teile.find((t) => t.pfad === pfad);
    return a ? new Blob([a.daten as BlobPart]) : null;
  }, []);

  const neuBeginnen = useCallback(async () => {
    await loeschen(); stapel.current = []; originale.current.clear();
    setDateien([]); setStufe(0); setVerlauf([]); setRegeln([]); setOrdnerName(""); setQuelleArt(""); setQuelle(null); setMeldung({ text: "Alles zurückgesetzt. Die Originale im Ordner sind unverändert." });
  }, []);

  // Leeren nach dem Weitergeben: Dateiliste, Verlauf und gemerkter Ordner weg; Gelerntes (Regeln) bleibt. Der Organizer liest nur –
  // an den Originalen und am Ordner selbst wird nichts geändert oder gelöscht (auch die Index-Datei im Ordner bleibt).
  const leeren = useCallback(async () => {
    const n = dateien.length;
    await loeschen(); stapel.current = []; originale.current.clear();
    setDateien([]); setStufe(0); setVerlauf([]); setOrdnerName(""); setQuelleArt(""); setQuelle(null);
    setMeldung({ text: `Organizer geleert: ${n} Dateien aus der Liste genommen. Die Originale und der Ordner sind unverändert${regeln.length ? `; ${regeln.length} gelernte Regeln bleiben` : ""}.` });
  }, [dateien.length, regeln.length]);

  return { dateien, stufe, verlauf, regeln, ordnerName, quelleArt, quelle, meldung, setMeldung, fortschritt, einlesenAus, pcOrdnerWieder, naechstes, zurueck, aendern, rueckgaengig, nummern, indexSichern, indexText, original, neuBeginnen, leeren, ordnerMerken, kannZurueck: () => stapel.current.length > 0 };
}

async function einlesenTeile(bytes: Uint8Array, pfad: string) {
  const m = leseEml(new TextDecoder().decode(bytes));
  return m.anhaenge.map((a) => ({ pfad: `${pfad} › ${a.name}`, daten: a.daten }));
}

// Ladebalken: oben im Kopf (auf jeder Seite sichtbar) und in der Ordner-Karte. Ohne bekannte Zahl läuft ein Streifen.
export function Ladebalken({ f, oben }: { f: Fortschritt | null; oben?: boolean }) {
  if (!f) return null;
  const offen = f.phase !== "lesen" || !f.gesamt, pz = offen ? 0 : Math.round((100 * f.fertig) / f.gesamt);
  const text = f.phase === "stand" ? "Gemerkte Sortierung wird geladen …" : f.phase === "suchen" ? `Ordner${f.name ? ` „${f.name}“` : ""} wird durchgesehen …` : `${f.fertig} von ${f.gesamt} Dateien gelesen · ${pz} %`;
  return <div className={`ladeanzeige ${oben ? "oben" : ""}`} data-ladeanzeige={f.phase}>
    <div className={`fortschritt ${offen ? "offen" : ""}`} role="progressbar" aria-label="Laden" {...(offen ? {} : { "aria-valuemin": 0, "aria-valuemax": f.gesamt, "aria-valuenow": f.fertig })}><span style={offen ? undefined : { width: `${pz}%` }}/></div>
    <p className="leise" aria-live="polite"><span>{text}</span>{f.phase === "lesen" && f.name && <span className="lade-name">{f.name}</span>}</p>
  </div>;
}

// Aktualisieren: neueste Fassung holen (Service-Worker fragen), dann neu laden. Die Sortierung liegt gemerkt im Browser.
async function aktualisieren(laeuft: boolean) {
  if (laeuft && !confirm("Das Einlesen läuft noch. Trotzdem neu laden? Der Ordner muss danach noch einmal gewählt werden.")) return;
  await new Promise((r) => setTimeout(r, 450)); // gemerkten Stand noch wegschreiben lassen
  try { const r = await navigator.serviceWorker?.getRegistration(); await r?.update(); } catch { /* ohne Netz: nur neu laden */ }
  location.reload();
}

// Update-Fähnchen: fragt beim Start, beim Zurückholen der App und stündlich nach version.json (liegt neben der Seite, nie aus dem Vorrat).
// Steht dort eine andere Fassung als diese, erscheint das Fähnchen neben der Fassungsnummer – ein Tipp aktualisiert.
function useNeueFassung() {
  const [neu, setNeu] = useState("");
  useEffect(() => {
    let weg = false;
    const pruefen = async () => {
      if (navigator.onLine === false) return;
      try {
        const r = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
        const f = r.ok ? String((await r.json()).fassung || "") : "";
        if (!weg && /^\d+\.\d+\.\d+$/.test(f)) setNeu(f !== FASSUNG ? f : "");
      } catch { /* ohne Netz: kein Fähnchen */ }
    };
    void pruefen();
    const sicht = () => { if (document.visibilityState === "visible") void pruefen(); };
    document.addEventListener("visibilitychange", sicht);
    const takt = setInterval(pruefen, 60 * 60 * 1000);
    return () => { weg = true; document.removeEventListener("visibilitychange", sicht); clearInterval(takt); };
  }, []);
  return neu;
}

export function App() {
  const z = useOrganizer();
  const neueFassung = useNeueFassung();
  const [seite, setSeite] = useState<SeitenId>(seiteAusHash);
  useEffect(() => { const f = () => setSeite(seiteAusHash()); window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const gehe = useCallback((s: SeitenId) => { location.hash = s; setSeite(s); window.scrollTo({ top: 0 }); }, []);
  const offen = useMemo(() => z.dateien.filter((d) => offeneFelder(d).length > 0).length, [z.dateien]);
  const props = { z, gehe };
  return <div className="app-shell">
    <header className="site-header">
      <div className="masthead">
        <button type="button" className="site-brand" onClick={() => gehe("ordner")} aria-label="Datei-Organizer – zum Ordner">
          <span className="brand-symbol"><FolderTree size={24}/></span>
          <span><strong>Datei-Organizer</strong><small>Fassung {FASSUNG} · vorsortiert für die Familienakte</small></span>
        </button>
        <div className="header-actions">
          {neueFassung && <button type="button" className="update-fahne" data-update-fahne title={`Fassung ${neueFassung} steht bereit. Tippen aktualisiert; die Sortierung bleibt gemerkt.`} onClick={() => void aktualisieren(!!z.fortschritt && z.fortschritt.phase !== "stand")}><RefreshCw size={14}/>Update {neueFassung}</button>}
          <span className={`ordner-pill ${z.ordnerName ? "verbunden" : ""}`} data-ordner-pill title={z.ordnerName || "Kein Ordner gewählt"}>{z.fortschritt && z.fortschritt.phase !== "stand" ? "Wird geladen …" : z.ordnerName ? `${z.ordnerName} · ${z.dateien.length}` : "Kein Ordner"}</span>
          <button type="button" className="info-knopf" aria-label="Aktualisieren" title="Aktualisieren: App neu laden (neueste Fassung). Die Sortierung bleibt gemerkt." data-aktualisieren onClick={() => void aktualisieren(!!z.fortschritt && z.fortschritt.phase !== "stand")}><RefreshCw size={18}/></button>
          <button type="button" className="info-knopf" aria-label="Suchen" onClick={() => gehe("finden")}><Search size={18}/></button>
        </div>
      </div>
      <nav className="main-navigation" aria-label="Bereiche">
        {SEITEN.map((s) => <button key={s.id} type="button" className={seite === s.id ? "active" : ""} aria-current={seite === s.id ? "page" : undefined} onClick={() => gehe(s.id)} data-nav={s.id}>
          <s.symbol size={16}/>{s.name}{s.id === "sortieren" && offen > 0 && <span className="zahl" aria-label={`${offen} bitte prüfen`}>{offen}</span>}
        </button>)}
      </nav>
      <Ladebalken f={z.fortschritt} oben/>
    </header>
    <main className="site-main" id="inhalt">
      {seite === "ordner" && <OrdnerSeite {...props}/>}
      {seite === "sortieren" && <SortierenSeite {...props}/>}
      {seite === "finden" && <FindenSeite {...props}/>}
      {seite === "verlauf" && <VerlaufSeite {...props}/>}
      {seite === "akte" && <AkteSeite {...props}/>}
      {seite === "hilfe" && <HilfeSeite {...props}/>}
    </main>
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand-row"><div><strong>DATEI-ORGANIZER</strong><span>Ein Ordner rein, sortiert heraus – für die Familienakte.</span></div><span>Alles bleibt auf diesem Gerät.</span></div>
        <div className="footer-directory">
          <section><h2>Arbeiten</h2><ul>{SEITEN.slice(0, 3).map((s) => <li key={s.id}><button type="button" onClick={() => gehe(s.id)}>{s.name}</button></li>)}</ul></section>
          <section><h2>Weitergeben</h2><ul><li><button type="button" onClick={() => gehe("akte")}>An die Familienakte</button></li><li><button type="button" onClick={() => gehe("verlauf")}>Verlauf und Gelerntes</button></li></ul></section>
          <section><h2>Rechtliches</h2><ul><li><a href="./datenschutz.html">Impressum &amp; Datenschutz</a></li><li><button type="button" onClick={() => gehe("hilfe")}>Hilfe</button></li></ul></section>
        </div>
        <div className="footer-meta"><span>Family-Projekt · Datei-Organizer {FASSUNG}</span><span>Originale werden nie verändert.</span></div>
      </div>
    </footer>
  </div>;
}
