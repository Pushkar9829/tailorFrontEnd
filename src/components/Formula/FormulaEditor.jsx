import { useState } from "react";

const field = "w-full rounded border border-[#334155] bg-[#171c24] px-3 py-2 text-sm text-[#e7edf5]";

export default function FormulaEditor({ pattern, onFormula, onAddFormula, onPointFormula, onSaveAs }) {
  const steps = [{ id: "rules", name: "Size rules" }, ...pattern.pieces.map((piece) => ({ id: piece.id, name: piece.name }))];
  const [step, setStep] = useState(0);
  const [setName, setSetName] = useState("");
  const current = steps[Math.min(step, steps.length - 1)];
  const piece = pattern.pieces.find((item) => item.id === current.id);

  function saveSet(event) {
    event.preventDefault();
    const name = setName.trim();
    if (!name) return;
    onSaveAs(name);
    setSetName("");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((item, index) => (
          <button key={item.id} type="button" onClick={() => setStep(index)} className={`rounded px-3 py-1.5 text-sm ${index === step ? "bg-[#222a36]" : "text-[#9aabbf]"}`}>
            {index + 1}. {item.name}
          </button>
        ))}
      </div>

      {current.id === "rules" ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Size rules</h2>
          <p className="mt-1 text-sm text-[#9aabbf]">These run first. Example: bust / 4.</p>
          <div className="mt-4 overflow-hidden rounded border border-[#2a3342]">
            {Object.entries(pattern.formulas).map(([name, expression]) => (
              <label key={name} className="grid grid-cols-[180px_1fr] items-center gap-3 border-b border-[#2a3342] px-4 py-3 last:border-b-0">
                <span className="font-mono text-sm text-[#d6b27a]">{name}</span>
                <input value={expression} onChange={(event) => onFormula(name, event.target.value)} className={field} />
              </label>
            ))}
          </div>
          <AddFormula onAdd={onAddFormula} />
        </section>
      ) : null}

      {piece ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{piece.name}</h2>
          <p className="mt-1 text-sm text-[#9aabbf]">X is across. Y is down the cloth.</p>
          <div className="mt-4 overflow-hidden rounded border border-[#2a3342]">
            <div className="grid grid-cols-[140px_1fr_1fr] gap-3 border-b border-[#2a3342] px-4 py-2 text-xs text-[#9aabbf]">
              <span>Point</span>
              <span>X</span>
              <span>Y</span>
            </div>
            {piece.points.map((point) => (
              <div key={point.id} className="grid grid-cols-[140px_1fr_1fr] items-center gap-3 border-b border-[#2a3342] px-4 py-3 last:border-b-0">
                <span className="font-mono text-xs text-[#9aabbf]">{point.id}</span>
                <input aria-label={`${point.id} x`} value={point.x} onChange={(event) => onPointFormula(piece.id, point.id, "x", event.target.value)} className={field} />
                <input aria-label={`${point.id} y`} value={point.y} onChange={(event) => onPointFormula(piece.id, point.id, "y", event.target.value)} className={field} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 flex gap-2">
        <button type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)} className="rounded border border-[#334155] px-4 py-2 text-sm disabled:opacity-40">Previous</button>
        <button type="button" disabled={step >= steps.length - 1} onClick={() => setStep((value) => value + 1)} className="rounded border border-[#334155] px-4 py-2 text-sm disabled:opacity-40">Next</button>
      </div>

      <form onSubmit={saveSet} className="mt-6 flex gap-2">
        <input value={setName} onChange={(event) => setSetName(event.target.value)} placeholder="Formula name" className={field} />
        <button type="submit" className="shrink-0 rounded bg-[#5eead4] px-4 text-sm font-semibold text-[#04221e]">Save formula</button>
      </form>
    </div>
  );
}

function AddFormula({ onAdd }) {
  return (
    <form
      className="mt-4 grid grid-cols-[180px_1fr_auto] gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onAdd(String(data.get("name") || ""), String(data.get("expression") || ""));
        event.currentTarget.reset();
      }}
    >
      <input name="name" placeholder="New name" className={field} />
      <input name="expression" placeholder="bust / 4 + 10" className={field} />
      <button type="submit" className="rounded bg-[#222a36] px-4 text-sm">Add rule</button>
    </form>
  );
}
