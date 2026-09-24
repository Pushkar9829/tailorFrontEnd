export default function PointMarker({ point, zoom, pan, active, onSelect }) {
  const x = point.x * zoom + pan.x;
  const y = point.y * zoom + pan.y;
  return (
    <g onClick={(event) => { event.stopPropagation(); onSelect(point); }} className="cursor-pointer">
      <rect x={x - 4} y={y - 4} width="8" height="8" fill={active ? "#f8fafc" : "#101318"} stroke="#f8d48a" strokeWidth="1.4" />
      <text x={x + 7} y={y - 6} fill="#f8d48a" fontSize="11" fontFamily="IBM Plex Mono, monospace">
        {point.id}
      </text>
    </g>
  );
}
