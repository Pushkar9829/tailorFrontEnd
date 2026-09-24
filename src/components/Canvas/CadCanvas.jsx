import { useEffect, useRef, useState } from "react";
import Curve, { toPath } from "./Curve.jsx";
import Grid from "./Grid.jsx";
import PointMarker from "./Point.jsx";
import Ruler from "./Ruler.jsx";

const TOOLS = [
  { id: "select", label: "Select" },
  { id: "pan", label: "Pan" },
  { id: "measure", label: "Measure" },
];

export default function CadCanvas({ geometry, showSewing, showCut, showHandles, selectedId, onSelectPoint, view, onView }) {
  const host = useRef(null);
  const viewRef = useRef({ zoom: 1.4, pan: { x: 80, y: 40 }, tool: "pan" });
  const [size, setSize] = useState({ width: 800, height: 640 });
  const [zoom, setZoom] = useState(1.4);
  const [pan, setPan] = useState({ x: 80, y: 40 });
  const [tool, setTool] = useState("pan");
  const [cursor, setCursor] = useState(null);
  const [measure, setMeasure] = useState([]);
  const drag = useRef(null);
  viewRef.current = { zoom, pan, tool };

  useEffect(() => {
    const node = host.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    });
    observer.observe(node);
    setSize({ width: node.clientWidth, height: node.clientHeight });
    const onWheelNative = (event) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setZoom((current) => {
        const next = Math.min(12, Math.max(0.15, current * (event.deltaY < 0 ? 1.1 : 0.9)));
        setPan((currentPan) => {
          const worldX = (px - currentPan.x) / current;
          const worldY = (py - currentPan.y) / current;
          return { x: px - worldX * next, y: py - worldY * next };
        });
        return next;
      });
    };
    node.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      observer.disconnect();
      node.removeEventListener("wheel", onWheelNative);
    };
  }, []);

  function fit() {
    const box = geometry?.bbox;
    const width = host.current?.clientWidth || 0;
    const height = host.current?.clientHeight || 0;
    if (!box || box.width <= 0 || box.height <= 0 || width < 40 || height < 40) return;
    const pad = 36;
    const nextZoom = Math.min((width - pad) / box.width, (height - pad) / box.height);
    if (!Number.isFinite(nextZoom) || nextZoom <= 0) return;
    setZoom(nextZoom);
    setPan({
      x: (width - box.width * nextZoom) / 2 - box.minX * nextZoom,
      y: (height - box.height * nextZoom) / 2 - box.minY * nextZoom,
    });
  }

  useEffect(() => {
    if (geometry?.bbox) fit();
    // Fit when a new valid piece arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry?.bbox?.width, geometry?.bbox?.height, size.width, size.height]);

  function worldFromEvent(event) {
    const rect = host.current.getBoundingClientRect();
    const { zoom: currentZoom, pan: currentPan } = viewRef.current;
    return {
      x: (event.clientX - rect.left - currentPan.x) / currentZoom,
      y: (event.clientY - rect.top - currentPan.y) / currentZoom,
    };
  }

  function onPointerDown(event) {
    if (event.target.closest("button")) return;
    const world = worldFromEvent(event);
    if (viewRef.current.tool === "measure") {
      setMeasure((current) => (current.length >= 2 ? [world] : [...current, world]));
      return;
    }
    if (viewRef.current.tool === "select") return;
    drag.current = { x: event.clientX, y: event.clientY, pan: viewRef.current.pan };
    host.current.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    setCursor(worldFromEvent(event));
    if (!drag.current) return;
    setPan({
      x: drag.current.pan.x + (event.clientX - drag.current.x),
      y: drag.current.pan.y + (event.clientY - drag.current.y),
    });
  }

  function onPointerUp() {
    drag.current = null;
  }

  const pieces = geometry?.pieces || [];
  const measureDistance = measure.length === 2
    ? Math.hypot(measure[1].x - measure[0].x, measure[1].y - measure[0].y)
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101318]">
      <div className="z-20 flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[#2a3342] bg-[#101318] px-3 py-1.5">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTool(item.id)}
            className={`rounded px-2 py-1 text-[11px] ${tool === item.id ? "bg-[#d6b27a] text-[#1b1408]" : "bg-[#222a36] text-[#d5deea]"}`}
          >
            {item.label}
          </button>
        ))}
        <button type="button" onClick={() => onView?.("pieces")} className={`rounded px-2 py-1 text-[11px] ${view === "pieces" ? "bg-[#5eead4] text-[#04221e]" : "bg-[#222a36] text-[#d5deea]"}`}>
          Cut pieces
        </button>
        <button type="button" onClick={() => onView?.("assembled")} className={`rounded px-2 py-1 text-[11px] ${view === "assembled" ? "bg-[#5eead4] text-[#04221e]" : "bg-[#222a36] text-[#d5deea]"}`}>
          Assembled
        </button>
        <button type="button" onClick={fit} className="rounded bg-[#222a36] px-2 py-1 text-[11px] text-[#d5deea]">
          Fit
        </button>
        <span className="ml-auto font-mono text-[11px] text-[#9aabbf]">1 unit = 1 mm</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[28px_minmax(0,1fr)] grid-rows-[28px_minmax(0,1fr)] overflow-hidden">
        <div className="bg-[#171c24]" />
        <Ruler orientation="horizontal" length={size.width} zoom={zoom} origin={pan.x} />
        <Ruler orientation="vertical" length={size.height} zoom={zoom} origin={pan.y} />
        <div
          ref={host}
          className={`relative h-full min-h-0 w-full overflow-hidden ${tool === "pan" ? "cursor-grab" : "cursor-crosshair"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <svg width={size.width} height={size.height} className="block">
            <rect width={size.width} height={size.height} fill="#141920" />
            <Grid width={size.width} height={size.height} zoom={zoom} pan={pan} />
            {pieces.map((piece) => (
              <g key={piece.id}>
                {showCut ? <path d={`${toPath(piece.cutting.polyline, zoom, pan)} Z`} fill="none" stroke="#fb7185" strokeWidth="1.6" /> : null}
                {showSewing ? <path d={`${toPath(piece.sewing.polyline, zoom, pan)} Z`} fill="rgba(94,234,212,0.05)" stroke="#5eead4" strokeWidth="1.8" /> : null}
                {showHandles ? piece.segments.map((segment) => (
                  <Curve key={segment.id} segment={segment} zoom={zoom} pan={pan} showHandles={showHandles} />
                )) : null}
                {piece.notches.map((notch) => (
                  <path key={notch.id} d={toPath([notch.a, notch.b], zoom, pan)} stroke="#fbbf24" strokeWidth="1.5" />
                ))}
                {piece.grainline ? (
                  <path d={toPath([piece.grainline.a, piece.grainline.b], zoom, pan)} stroke="#94a3b8" strokeDasharray="6 4" strokeWidth="1.2" />
                ) : null}
                {showHandles ? piece.points.map((point) => (
                  <PointMarker key={`${piece.id}-${point.id}`} point={point} zoom={zoom} pan={pan} active={selectedId === point.id} onSelect={onSelectPoint} />
                )) : null}
              </g>
            ))}
            {measure.map((point, index) => (
              <circle key={index} cx={point.x * zoom + pan.x} cy={point.y * zoom + pan.y} r="3" fill="#f8fafc" />
            ))}
            {measure.length === 2 ? (
              <g>
                <path d={toPath(measure, zoom, pan)} stroke="#f8fafc" strokeWidth="1.4" />
                <text
                  x={((measure[0].x + measure[1].x) / 2) * zoom + pan.x}
                  y={((measure[0].y + measure[1].y) / 2) * zoom + pan.y - 6}
                  fill="#f8fafc"
                  fontSize="12"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {measureDistance.toFixed(1)} mm
                </text>
              </g>
            ) : null}
            <line x1={24} y1={size.height - 28} x2={24 + 100 * zoom} y2={size.height - 28} stroke="#e7edf5" strokeWidth="2" />
            <text x={24} y={size.height - 34} fill="#e7edf5" fontSize="10" fontFamily="IBM Plex Mono, monospace">
              100 mm
            </text>
          </svg>
        </div>
      </div>
      <div className="z-20 flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-t border-[#2a3342] bg-[#101318] px-3 py-1 font-mono text-[11px] text-[#b7c3d4]">
        <span>X {cursor ? cursor.x.toFixed(1) : "—"} mm</span>
        <span>Y {cursor ? cursor.y.toFixed(1) : "—"} mm</span>
        <span>Zoom {(zoom * 100).toFixed(0)}%</span>
        <span>{tool === "measure" ? (measureDistance != null ? `Distance ${measureDistance.toFixed(1)} mm` : "Click two points on the graph") : "Measure: pick the tool, then click two points"}</span>
        <span className="ml-auto text-[#fb7185]">Cut</span>
        <span className="text-[#5eead4]">Sew</span>
        <span className="text-[#fbbf24]">Mark</span>
      </div>
    </div>
  );
}
