import { useEffect, useMemo, useState } from "react";
import CadCanvas from "../components/Canvas/CadCanvas.jsx";
import GarmentView from "../components/Canvas/GarmentView.jsx";
import SketchBoard from "../components/Canvas/SketchBoard.jsx";
import { BLOUSES, NECKS, PRINTS, SLEEVES, applyStyle } from "../data/styles.js";
import { BASIC_BLOUSE_FRONT, runPattern } from "../engine/index.js";

const field = "mt-1 w-full rounded border border-[#334155] bg-[#171c24] px-2 py-1.5 text-sm text-[#e7edf5]";

function defaultsFrom(pattern) {
  return Object.fromEntries(Object.entries(pattern.measurements).map(([key, spec]) => [key, spec.default]));
}

function download(filename, text, type = "image/svg+xml") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Thumb({ kind }) {
  const neck = kind === "deep" ? 28 : kind === "v" ? 26 : kind === "boat" || kind === "pot" ? 8 : kind === "square" || kind === "glass" ? 16 : 14;
  const sleeve = kind === "cap" || kind === "quarter" ? 18 : kind === "full" || kind === "threeQuarter" ? 46 : kind === "puff" ? 28 : kind === "elbow" ? 34 : 24;
  const puff = kind === "puff" ? 16 : 8;
  return (
    <svg viewBox="0 0 72 64" className="h-14 w-full">
      <path d={`M18 ${neck} Q36 ${neck + 10} 54 ${neck} L58 18 L${64 - puff} ${sleeve} L54 58 L18 58 L${8 + puff} ${sleeve} L14 18 Z`} fill="none" stroke="#d6b27a" strokeWidth="1.4" />
    </svg>
  );
}

export default function Studio({ token, customerName, saved }) {
  const [unit, setUnit] = useState("inch");
  const [pattern, setPattern] = useState(() => structuredClone(BASIC_BLOUSE_FRONT));
  const [values, setValues] = useState(() => defaultsFrom(BASIC_BLOUSE_FRONT));
  const [view, setView] = useState("assembled");
  const [canvasMode, setCanvasMode] = useState("sketch");
  const [side, setSide] = useState("both");
  const [catalogTab, setCatalogTab] = useState("blouse");
  const [neckSide, setNeckSide] = useState("front");
  const [selection, setSelection] = useState({ blouse: "basic", sleeve: "basic", frontNeck: "round", backNeck: "round", print: "plain" });
  const [tune, setTune] = useState({ neckDepth: 1, sleeveLength: 1 });
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  function applyMeasurement(job) {
    if (!job?.measurementSnapshot) return;
    setValues(job.measurementSnapshot);
    if (job.unit) setUnit(job.unit);
    if (!job.order) return;
    setSelection({
      blouse: job.order.blouse || "basic",
      sleeve: job.order.sleeve || "basic",
      frontNeck: job.order.frontNeck || "round",
      backNeck: job.order.backNeck || "round",
      print: job.order.print || "plain",
    });
    setTune({
      neckDepth: Number(job.order.neckDepth) || 1,
      sleeveLength: Number(job.order.sleeveLength) || 1,
    });
    setTitle(job.order.title || job.order.label || "");
    setPhone(job.order.phone || "");
    setOrderDate(job.order.orderDate || "");
  }

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const list = await fetch("/api/patterns").then((response) => response.json());
        if (!ignore && Array.isArray(list) && list[0]) {
          const full = await fetch(`/api/patterns/${list[0].id}`).then((response) => response.json());
          if (full?.pieces) setPattern(full);
        }
      } catch {
        // Keep the built-in blouse if the catalog is offline.
      }
      if (saved?.measurementSnapshot) {
        if (!ignore) applyMeasurement(saved);
        return;
      }
      try {
        const jobs = await fetch("/api/jobs/mine", { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.json());
        if (!ignore && Array.isArray(jobs) && jobs[0]) applyMeasurement(jobs[0]);
      } catch {
        // Leave the default sizes in the form.
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [saved, token]);

  const styled = useMemo(() => applyStyle(pattern, selection, tune), [pattern, selection, tune]);
  const result = useMemo(() => runPattern(styled, values, unit), [styled, values, unit]);
  const shown = result.ok
    ? {
        ...result,
        pieces: (view === "assembled" ? result.assembled.pieces : result.cuttingLayout.pieces).filter((piece) => {
          if (side === "front") return piece.id.startsWith("front") || piece.id.startsWith("neck") || piece.id.startsWith("sleeve");
          if (side === "back") return piece.id.startsWith("back");
          return true;
        }),
        bbox: view === "assembled" ? result.assembled.bbox : result.cuttingLayout.bbox,
      }
    : null;

  function update(key, raw) {
    setValues((current) => ({ ...current, [key]: raw === "" ? "" : Number(raw) }));
  }

  function changeUnit(next) {
    const toMm = { inch: 25.4, cm: 10, mm: 1 };
    setValues((current) => Object.fromEntries(
      Object.entries(current).map(([key, value]) => [key, Math.round((Number(value) * toMm[unit] / toMm[next]) * 100) / 100]),
    ));
    setUnit(next);
  }

  async function saveJob() {
    setSaveMessage("");
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patternId: pattern.id,
          customerLabel: customerName,
          measurements: values,
          unit,
          definition: styled,
          order: { ...selection, ...tune, title, phone, orderDate, label: title || styled.styleLabel },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Save failed");
      setSaveMessage("Measurement saved. It is listed under My orders.");
    } catch (error) {
      setSaveMessage(error.message);
    }
  }

  const cards = catalogTab === "blouse" ? BLOUSES : catalogTab === "sleeve" ? SLEEVES : catalogTab === "print" ? PRINTS : NECKS;
  const selectedId = catalogTab === "blouse" ? selection.blouse : catalogTab === "sleeve" ? selection.sleeve : catalogTab === "print" ? selection.print : neckSide === "front" ? selection.frontNeck : selection.backNeck;

  function pick(id) {
    setSelection((current) => {
      if (catalogTab === "blouse") return { ...current, blouse: id };
      if (catalogTab === "sleeve") return { ...current, sleeve: id };
      if (catalogTab === "print") return { ...current, print: id };
      if (neckSide === "front") return { ...current, frontNeck: id };
      return { ...current, backNeck: id };
    });
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-r border-[#2a3342]">
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
          <div className="flex gap-1 text-xs">
            {[["blouse", "Blouse"], ["sleeve", "Sleeve"], ["neck", "Necks"], ["print", "Patterns"]].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setCatalogTab(id)} className={`rounded px-2 py-1 ${catalogTab === id ? "bg-[#222a36] text-white" : "text-[#9aabbf]"}`}>{label}</button>
            ))}
          </div>
          {catalogTab === "neck" ? (
            <div className="flex gap-1 text-xs">
              {[["front", "Front necks"], ["back", "Back necks"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setNeckSide(id)} className={`rounded border border-[#334155] px-2 py-1 ${neckSide === id ? "bg-[#222a36]" : ""}`}>{label}</button>
              ))}
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            {cards.map((item) => (
              <button key={item.id} type="button" onClick={() => pick(item.id)} className={`rounded border px-1 py-1 text-center ${item.id === selectedId ? "border-[#d6b27a] bg-[#222a36]" : "border-[#2a3342]"}`}>
                {catalogTab === "print" ? (
                  <svg viewBox="0 0 40 28" className="mx-auto h-10 w-full">
                    <rect width="40" height="28" fill="#222a36" />
                    {item.id === "checks" ? <path d="M0 7H40 M0 18H40 M12 0V28 M26 0V28" stroke="#d6b27a" /> : null}
                    {item.id === "stripes" ? <path d="M0 6H40 M0 14H40 M0 22H40" stroke="#d6b27a" /> : null}
                    {item.id === "floral" || item.id === "paisley" ? <circle cx="20" cy="14" r="5" fill="none" stroke="#d6b27a" /> : null}
                    {item.id === "bandhani" ? <circle cx="14" cy="10" r="2" fill="#d6b27a" /> : null}
                    {item.id === "plain" ? <rect x="8" y="6" width="24" height="16" fill="#3a342c" /> : null}
                  </svg>
                ) : <Thumb kind={item.id} />}
                <span className="block text-[11px] leading-tight text-[#b7c3d4]">{item.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#9aabbf]">{styled.styleLabel}</p>
          <label className="block text-xs text-[#9aabbf]">Neck depth
            <input type="range" min="0.7" max="1.8" step="0.05" value={tune.neckDepth} onChange={(event) => setTune((current) => ({ ...current, neckDepth: Number(event.target.value) }))} className="mt-1 w-full" />
          </label>
          <label className="block text-xs text-[#9aabbf]">Sleeve length
            <input type="range" min="0.6" max="1.6" step="0.05" value={tune.sleeveLength} onChange={(event) => setTune((current) => ({ ...current, sleeveLength: Number(event.target.value) }))} className="mt-1 w-full" />
          </label>
          <label className="block text-xs uppercase tracking-wide text-[#9aabbf]">Unit
            <select value={unit} onChange={(event) => changeUnit(event.target.value)} className={field}>
              <option value="inch">Inches</option>
              <option value="cm">Centimeters</option>
              <option value="mm">Millimeters</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(pattern.measurements).map(([key, spec]) => (
              <label key={key} className="block text-[11px] text-[#9aabbf]">
                {spec.label}
                <input type="number" step="0.1" value={values[key]} onChange={(event) => update(key, event.target.value)} className={`${field} font-mono`} />
              </label>
            ))}
          </div>
          <label className="block text-xs text-[#9aabbf]">Measurement name
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Evening blouse" className={field} />
          </label>
          <label className="block text-xs text-[#9aabbf]">Phone
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className={field} />
          </label>
          <label className="block text-xs text-[#9aabbf]">Order date
            <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} className={field} />
          </label>
          {result.errors?.length ? (
            <ul className="space-y-1 text-sm text-[#fb7185]">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul>
          ) : <p className="text-sm text-[#5eead4]">Ready to cut.</p>}
        </div>
        <div className="space-y-2 border-t border-[#2a3342] p-3">
          <button type="button" disabled={!result.ok} onClick={() => download("blouse.svg", result.svg)} className="w-full rounded bg-[#fb7185] py-2 text-sm font-semibold text-[#2a0c12] disabled:opacity-40">Download laser SVG</button>
          <button type="button" disabled={!result.ok} onClick={() => download("blouse.nc", result.gcode, "text/plain")} className="w-full rounded border border-[#334155] py-2 text-sm disabled:opacity-40">Download laser G-code</button>
          <button type="button" disabled={!result.ok} onClick={saveJob} className="w-full rounded border border-[#334155] py-2 text-sm disabled:opacity-40">Save measurement</button>
          {saveMessage ? <p className="text-xs text-[#9aabbf]">{saveMessage}</p> : null}
        </div>
      </aside>
      <main className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#2a3342] px-3 py-2 text-xs">
          {[["sketch", "Outline"], ["pattern", "Pattern"], ["solid", "3D"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setCanvasMode(id)} className={`rounded px-2 py-1 ${canvasMode === id ? "bg-[#222a36] text-white" : "text-[#9aabbf]"}`}>{label}</button>
          ))}
          <span className="mx-2 h-4 w-px bg-[#2a3342]" />
          {[["both", "Both"], ["front", "Front"], ["back", "Back"]].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSide(id)} className={`rounded border border-[#334155] px-2 py-1 ${side === id ? "bg-[#222a36]" : ""}`}>{label}</button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {canvasMode === "sketch" ? <SketchBoard selection={selection} tune={tune} side={side} /> : null}
          {canvasMode === "pattern" ? <CadCanvas geometry={shown} showSewing showCut showHandles={false} selectedId={null} onSelectPoint={() => {}} view={view} onView={setView} /> : null}
          {canvasMode === "solid" ? <GarmentView selection={selection} tune={tune} /> : null}
        </div>
      </main>
    </div>
  );
}
