import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import CadCanvas from "../components/Canvas/CadCanvas.jsx";
import FormulaEditor from "../components/Formula/FormulaEditor.jsx";
import { BASIC_BLOUSE_FRONT, runPattern } from "../engine/index.js";

const field = "mt-1 w-full rounded border border-[#334155] bg-[#171c24] px-3 py-2 text-sm text-[#e7edf5]";

function defaultsFrom(pattern) {
  return Object.fromEntries(Object.entries(pattern.measurements).map(([key, spec]) => [key, spec.default]));
}

export default function Admin({ token, section = "preview" }) {
  const [catalog, setCatalog] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsError, setJobsError] = useState("");
  const tab = section;
  const [pattern, setPattern] = useState(() => structuredClone(BASIC_BLOUSE_FRONT));
  const [values, setValues] = useState(() => defaultsFrom(BASIC_BLOUSE_FRONT));
  const [unit, setUnit] = useState("inch");
  const [view, setView] = useState("assembled");
  const [message, setMessage] = useState("");
  const [formulaView, setFormulaView] = useState("list");
  const [patternView, setPatternView] = useState("list");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function refresh() {
    const list = await fetch(api("/api/patterns")).then((response) => response.json());
    if (Array.isArray(list)) setCatalog(list);
    const savedResponse = await fetch(api("/api/jobs"), { headers });
    const saved = await savedResponse.json();
    if (!savedResponse.ok) {
      setJobs([]);
      setJobsError(saved.error || "Could not load orders. Sign out and sign in again.");
      return;
    }
    setJobsError("");
    if (Array.isArray(saved)) setJobs(saved);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, [token]);

  const result = useMemo(() => runPattern(pattern, values, unit), [pattern, values, unit]);
  const shown = result.ok
    ? {
        ...result,
        pieces: view === "assembled" ? result.assembled.pieces : result.cuttingLayout.pieces,
        bbox: view === "assembled" ? result.assembled.bbox : result.cuttingLayout.bbox,
      }
    : null;

  async function openPattern(id) {
    const full = await fetch(api(`/api/patterns/${id}`)).then((response) => response.json());
    setPattern(full);
    setValues(defaultsFrom(full));
  }

  function createNew() {
    const next = structuredClone(BASIC_BLOUSE_FRONT);
    next.id = `blouse-${Date.now()}`;
    next.name = "New blouse";
    next.version = 1;
    setPattern(next);
    setValues(defaultsFrom(next));
  }

  function setDefault(key, raw) {
    const number = raw === "" ? "" : Number(raw);
    setValues((current) => ({ ...current, [key]: number }));
    setPattern((current) => ({
      ...current,
      measurements: {
        ...current.measurements,
        [key]: { ...current.measurements[key], default: number === "" ? 0 : number },
      },
    }));
  }

  async function downloadJob(id, kind) {
    const response = await fetch(api(`/api/jobs/${id}/${kind}`), { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      setJobsError("Could not download that file. Sign out and sign in again.");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = kind === "gcode" ? `${id}.nc` : `${id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function savePattern() {
    setMessage("");
    const response = await fetch(api("/api/patterns"), { method: "POST", headers, body: JSON.stringify(pattern) });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error || "Save failed");
      return;
    }
    setMessage(`Saved ${body.name}`);
    refresh().catch(() => {});
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {(tab === "preview" && patternView === "edit") || (tab === "formulas" && formulaView === "edit") ? (
        <div className="flex shrink-0 justify-end gap-2 border-b border-[#2a3342] px-4 py-2">
          <button type="button" onClick={savePattern} className="rounded bg-[#5eead4] px-4 py-1.5 text-sm font-semibold text-[#04221e]">Save pattern</button>
        </div>
      ) : null}
      {message ? <p className="shrink-0 px-4 py-2 text-sm text-[#9aabbf]">{message}</p> : null}
      {tab === "preview" && patternView === "list" ? (
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Patterns</h2>
              <button type="button" onClick={() => { createNew(); setPatternView("edit"); }} className="rounded bg-[#5eead4] px-4 py-2 text-sm font-semibold text-[#04221e]">Create new pattern</button>
            </div>
            <div className="mt-4 overflow-hidden rounded border border-[#2a3342]">
              <div className="grid grid-cols-[1fr_80px] border-b border-[#2a3342] px-4 py-2 text-xs text-[#9aabbf]">
                <span>Pattern</span>
                <span>Version</span>
              </div>
              {catalog.length === 0 ? <p className="p-4 text-sm text-[#9aabbf]">No patterns yet. Create one to start.</p> : catalog.map((item) => (
                <button key={item.id} type="button" onClick={() => { openPattern(item.id).then(() => setPatternView("edit")); }} className="grid w-full grid-cols-[1fr_80px] border-b border-[#2a3342] px-4 py-3 text-left text-sm last:border-b-0">
                  <span>{item.name}</span>
                  <span className="text-[#9aabbf]">{item.version}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {tab === "preview" && patternView === "edit" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)]">
          <aside className="min-h-0 space-y-4 overflow-auto border-r border-[#2a3342] p-4">
            <button type="button" onClick={() => setPatternView("list")} className="rounded border border-[#334155] px-3 py-1.5 text-sm">All patterns</button>
            <label className="block text-xs uppercase tracking-wide text-[#9aabbf]">
              Name
              <input value={pattern.name} onChange={(event) => setPattern((current) => ({ ...current, name: event.target.value }))} className={field} />
            </label>
            <label className="block text-xs uppercase tracking-wide text-[#9aabbf]">
              Preview unit
              <select value={unit} onChange={(event) => setUnit(event.target.value)} className={field}>
                <option value="inch">Inches</option>
                <option value="cm">Centimeters</option>
                <option value="mm">Millimeters</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(pattern.measurements).map(([key, spec]) => (
                <label key={key} className="block text-xs text-[#9aabbf]">
                  {spec.label}
                  <input type="number" step="0.1" value={values[key]} onChange={(event) => setDefault(key, event.target.value)} className={`${field} font-mono`} />
                </label>
              ))}
            </div>
            {result.errors?.length ? <ul className="text-sm text-[#fb7185]">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul> : <p className="text-sm text-[#5eead4]">Preview is valid.</p>}
          </aside>
          <div className="h-full min-h-0 min-w-0 overflow-hidden">
            <CadCanvas geometry={shown} showSewing showCut showHandles={false} selectedId={null} onSelectPoint={() => {}} view={view} onView={setView} />
          </div>
        </div>
      ) : null}
      {tab === "formulas" && formulaView === "list" ? (
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Formulas</h2>
              <button type="button" onClick={() => { createNew(); setFormulaView("edit"); }} className="rounded bg-[#5eead4] px-4 py-2 text-sm font-semibold text-[#04221e]">Create new formula</button>
            </div>
            <div className="mt-4 overflow-hidden rounded border border-[#2a3342]">
              <div className="grid grid-cols-[1fr_80px] border-b border-[#2a3342] px-4 py-2 text-xs text-[#9aabbf]">
                <span>Formula</span>
                <span>Version</span>
              </div>
              {catalog.length === 0 ? <p className="p-4 text-sm text-[#9aabbf]">No formulas yet. Create one to start.</p> : catalog.map((item) => (
                <button key={item.id} type="button" onClick={() => { openPattern(item.id).then(() => setFormulaView("edit")); }} className="grid w-full grid-cols-[1fr_80px] border-b border-[#2a3342] px-4 py-3 text-left text-sm last:border-b-0">
                  <span>{item.name}</span>
                  <span className="text-[#9aabbf]">{item.version}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {tab === "formulas" && formulaView === "edit" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-h-0 overflow-auto border-r border-[#2a3342] p-4">
            <button type="button" onClick={() => setFormulaView("list")} className="mb-4 rounded border border-[#334155] px-3 py-1.5 text-sm">All formulas</button>
            <FormulaEditor
            pattern={pattern}
            onFormula={(name, expression) => setPattern((current) => ({ ...current, formulas: { ...current.formulas, [name]: expression } }))}
            onAddFormula={(name, expression) => {
              if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || !expression.trim()) return;
              setPattern((current) => ({ ...current, formulas: { ...current.formulas, [name]: expression.trim() } }));
            }}
            onPointFormula={(pieceId, pointId, axis, formula) => setPattern((current) => ({
              ...current,
              pieces: current.pieces.map((piece) => piece.id !== pieceId ? piece : {
                ...piece,
                points: piece.points.map((point) => point.id === pointId ? { ...point, [axis]: formula } : point),
              }),
            }))}
            onSaveAs={async (name) => {
              const next = structuredClone(pattern);
              next.id = `formula-${Date.now()}`;
              next.name = name;
              next.version = 1;
              const response = await fetch(api("/api/patterns"), { method: "POST", headers, body: JSON.stringify(next) });
              const body = await response.json();
              if (!response.ok) {
                setMessage(body.error || "Save failed");
                return;
              }
              setPattern(next);
              setMessage(`Saved formula ${name}`);
              refresh().catch(() => {});
            }}
            />
          </div>
          <div className="h-full min-h-0 min-w-0 overflow-hidden">
            <CadCanvas geometry={shown} showSewing showCut showHandles={false} selectedId={null} onSelectPoint={() => {}} view={view} onView={setView} />
          </div>
        </div>
      ) : null}
      {tab === "jobs" ? (
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl overflow-hidden rounded border border-[#2a3342]">
            <div className="grid grid-cols-[1fr_1.4fr_160px] border-b border-[#2a3342] px-4 py-2 text-xs text-[#9aabbf]">
              <span>Customer</span>
              <span>Order</span>
              <span>Files</span>
            </div>
            {jobsError ? <p className="p-4 text-sm text-[#fb7185]">{jobsError}</p> : null}
            {!jobsError && jobs.length === 0 ? <p className="p-4 text-sm text-[#9aabbf]">No saved orders yet.</p> : null}
            {jobs.map((job) => (
              <div key={job.id} className="grid grid-cols-[1fr_1.4fr_160px] items-center border-b border-[#2a3342] px-4 py-3 text-sm last:border-b-0">
                <span>{job.customerLabel || "Customer"}</span>
                <span className="text-[#9aabbf]">{job.order?.label || job.patternId}</span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => downloadJob(job.id, "svg")} className="rounded border border-[#334155] px-2 py-1 text-xs">SVG</button>
                  <button type="button" onClick={() => downloadJob(job.id, "gcode")} className="rounded border border-[#334155] px-2 py-1 text-xs">G-code</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
