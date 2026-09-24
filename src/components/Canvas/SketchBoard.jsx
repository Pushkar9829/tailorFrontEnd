import { bodyPathSvg, sleevePathSvg } from "./blouseGeometry.js";

function FabricPattern({ id, printId }) {
  return (
    <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#243044" />
      {printId === "checks" ? <path d="M0 0H14 M0 7H14 M0 0V14 M7 0V14" stroke="#d6b27a" strokeWidth="1" /> : null}
      {printId === "stripes" ? <path d="M0 3H14 M0 10H14" stroke="#d6b27a" strokeWidth="1.4" /> : null}
      {printId === "floral" || printId === "paisley" ? (
        <>
          <circle cx="5" cy="5" r="2" fill="#d6b27a" />
          <circle cx="10" cy="10" r="1.4" fill="#d6b27a" />
        </>
      ) : null}
      {printId === "bandhani" ? (
        <>
          <circle cx="4" cy="4" r="1.2" fill="#d6b27a" />
          <circle cx="11" cy="11" r="1.2" fill="#d6b27a" />
        </>
      ) : null}
    </pattern>
  );
}

function BlousePiece({ side, neckId, sleeveId, depth, printId, darts }) {
  const patternId = `fabric-${side}-${neckId}-${sleeveId}-${printId}`;
  return (
    <svg viewBox="10 28 200 160" className="h-full max-h-[460px] w-full">
      <defs>
        <FabricPattern id={patternId} printId={printId} />
      </defs>
      <path d={sleevePathSvg("left", sleeveId)} fill={`url(#${patternId})`} stroke="#e7edf5" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={sleevePathSvg("right", sleeveId)} fill={`url(#${patternId})`} stroke="#e7edf5" strokeWidth="1.6" strokeLinejoin="round" />
      <path d={bodyPathSvg(neckId, depth, side === "back")} fill={`url(#${patternId})`} stroke="#e7edf5" strokeWidth="1.6" strokeLinejoin="round" />
      {darts && side === "front" ? (
        <path d="M 90 96 Q 94 112 91 136 M 130 96 Q 126 112 129 136 M 110 78 L 110 168" fill="none" stroke="#9aabbf" strokeWidth="1" />
      ) : null}
      {side === "back" ? <path d="M 110 62 L 110 168" fill="none" stroke="#9aabbf" strokeWidth="1" /> : null}
    </svg>
  );
}

export default function SketchBoard({ selection, tune, side = "both" }) {
  const depth = Number(tune?.neckDepth) || 1;
  const printId = selection?.print || "plain";
  const sleeveId = selection?.sleeve || "basic";
  const showFront = side !== "back";
  const showBack = side !== "front";
  return (
    <div className="grid h-full min-h-0 place-items-center bg-[#171c24] p-4">
      <div className={`grid h-full w-full max-w-5xl items-center gap-6 ${showFront && showBack ? "grid-cols-2" : "grid-cols-1"}`}>
        {showFront ? <BlousePiece side="front" neckId={selection?.frontNeck || "round"} sleeveId={sleeveId} depth={depth} printId={printId} darts /> : null}
        {showBack ? <BlousePiece side="back" neckId={selection?.backNeck || "round"} sleeveId={sleeveId} depth={Math.max(0.35, depth * 0.45)} printId={printId} /> : null}
      </div>
    </div>
  );
}
