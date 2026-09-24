function toPath(points, zoom, pan) {
  return points
    .map((point, index) => {
      const x = point.x * zoom + pan.x;
      const y = point.y * zoom + pan.y;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function Curve({ segment, zoom, pan, showHandles }) {
  if (!showHandles || segment.type !== "bezier" || !segment.controls) return null;
  const start = segment.start;
  const end = segment.end;
  const { c1, c2 } = segment.controls;
  const sx = start.x * zoom + pan.x;
  const sy = start.y * zoom + pan.y;
  const ex = end.x * zoom + pan.x;
  const ey = end.y * zoom + pan.y;
  const c1x = c1.x * zoom + pan.x;
  const c1y = c1.y * zoom + pan.y;
  const c2x = c2.x * zoom + pan.x;
  const c2y = c2.y * zoom + pan.y;
  return (
    <g>
      <path d={`M ${sx} ${sy} L ${c1x} ${c1y} M ${ex} ${ey} L ${c2x} ${c2y}`} fill="none" stroke="#7dd3fc" strokeDasharray="4 3" strokeWidth="1" />
      <circle cx={c1x} cy={c1y} r="3.5" fill="#7dd3fc" />
      <circle cx={c2x} cy={c2y} r="3.5" fill="#7dd3fc" />
    </g>
  );
}

export { toPath };
