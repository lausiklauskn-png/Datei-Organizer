import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, FolderOpen, FolderTree, HelpCircle, History, ListChecks, Search } from "lucide-react";
import type { Datei, FeldName, Korrektur, Lernregel } from "../lib/typen.ts";
import { einlesen, doppelteMarkieren } from "../lib/einlesen.ts";
import { leseEml } from "../lib/eml.ts";
import { siebe, istUnsicher, offeneFelder } from "../lib/siebe.ts";
import { korrigieren as korrigiereDatei, lernen, regelnAufAlle } from "../lib/lernen.ts";
import { archivnummernVergeben } from "../lib/archivnummer.ts";
import { indexLesen, organizerIndex, INDEX_DATEI } from "../lib/index-format.ts";
import { pdfLeser } from "./pdf.ts";
import { ausHandle, erlaubnisPruefen, herunterladen, type Quelle, type QuellDatei } from "./quellen.ts";
import { laden, loeschen, ordnerHolen, ordnerMerken, speichern } from "./zustand.ts";
import { OrdnerSeite, SortierenSeite, FindenSeite, VerlaufSeite, AkteSeite, HilfeSeite } from "./seiten.tsx";

export const FASSUNG = "0.1.0";
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
  const [fortschritt, setFortschritt] = useState<{ fertig: number; gesamt: number } | null>(null);
  const [geladen, setGeladen] = useState(false);
  const stapel = useRef<Datei[][]>([]);
  const originale = useRef(new Map<string, QuellDatei | { blob: Uint8Array }>());

  // gemerkten Stand holen
  useEffect(() => { (async () => {
    const z = await laden();
    if (z) { setDateien(z.dateien); setStufe(z.stufe); setVerlauf(z.verlauf); setRegeln(z.regeln); setOrdnerName(z.ordnerName); setQuelleArt(z.quelle); }
    setGeladen(true);
  })(); }, []);
  useEffect(() => {
    if (!geladen) return;
    const t = setTimeout(() => { void speichern({ fassung: 1, ordnerName, quelle: quelleArt, stufe, dateien, verlauf, regeln, zeit: new Date().toISOString() }); }, 400);
    return () => clearTimeout(t);
  }, [geladen, dateien, stufe, verlauf, regeln, ordnerName, quelleArt]);

  const einlesenAus = useCallback(async (q: Quelle) => {
    setMeldung({ text: `Lese „${q.name}“ …` });
    let liste: QuellDatei[];
    try { liste = await q.dateien(); } catch (e) { setMeldung({ text: `Ordner nicht lesbar: ${(e as Error).message}`, art: "fehler" }); return; }
    if (!liste.length) { setMeldung({ text: "Im Ordner liegen keine Dateien.", art: "halt" }); return; }
    const lesePdf = await pdfLeser();
    const neu: Datei[] = [];
    originale.current.clear();
    setFortschritt({ fertig: 0, gesamt: liste.length });
    for (const [i, qd] of liste.entries()) {
      try {
        const bytes = await qd.lesen();
        const teile = await einlesen({ pfad: qd.pfad, name: qd.name, geaendert: qd.geaendert, bytes }, lesePdf);
        originale.current.set(qd.pfad, qd);
        neu.push(...teile);
      } catch (e) {
        neu.push({ pfad: qd.pfad, name: qd.name, groesse: 0, geaendert: qd.geaendert, stufe: 1, felder: { schriftstueck: { wert: "Unklar", sicher: false, grund: `nicht lesbar: ${(e as Error).message}`, quelle: "regel" } } });
      }
      setFortschritt({ fertig: i + 1, gesamt: liste.length });
    }
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

  return { dateien, stufe, verlauf, regeln, ordnerName, quelleArt, quelle, meldung, setMeldung, fortschritt, einlesenAus, pcOrdnerWieder, naechstes, zurueck, aendern, rueckgaengig, nummern, indexSichern, indexText, original, neuBeginnen, ordnerMerken, kannZurueck: () => stapel.current.length > 0 };
}

async function einlesenTeile(bytes: Uint8Array, pfad: string) {
  const m = leseEml(new TextDecoder().decode(bytes));
  return m.anhaenge.map((a) => ({ pfad: `${pfad} › ${a.name}`, daten: a.daten }));
}

export function App() {
  const z = useOrganizer();
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
          <span className={`ordner-pill ${z.ordnerName ? "verbunden" : ""}`} data-ordner-pill title={z.ordnerName || "Kein Ordner gewählt"}>{z.ordnerName ? `${z.ordnerName} · ${z.dateien.length}` : "Kein Ordner"}</span>
          <button type="button" className="info-knopf" aria-label="Suchen" onClick={() => gehe("finden")}><Search size={18}/></button>
        </div>
      </div>
      <nav className="main-navigation" aria-label="Bereiche">
        {SEITEN.map((s) => <button key={s.id} type="button" className={seite === s.id ? "active" : ""} aria-current={seite === s.id ? "page" : undefined} onClick={() => gehe(s.id)} data-nav={s.id}>
          <s.symbol size={16}/>{s.name}{s.id === "sortieren" && offen > 0 && <span className="zahl" aria-label={`${offen} bitte prüfen`}>{offen}</span>}
        </button>)}
      </nav>
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
