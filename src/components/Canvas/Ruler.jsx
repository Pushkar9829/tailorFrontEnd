function worldTicks(start, end, step) {
  const ticks = [];
  const first = Math.ceil(start / step) * step;
  for (let value = first; value <= end; value += step) ticks.push(value);
  return ticks;
}

function stepFor(zoom) {
  const target = 70 / zoom;
  const choices = [1, 2, 5, 10, 20, 50, 100, 200, 500];
  return choices.find((choice) => choice >= target) || 500;
}

export default function Ruler({ orientation, length, zoom, origin }) {
  const horizontal = orientation === "horizontal";
  const span = length / zoom;
  const worldStart = -origin / zoom;
  const worldEnd = worldStart + span;
  const step = stepFor(zoom);
  const ticks = worldTicks(worldStart, worldEnd, step);

  return (
    <svg className={horizontal ? "block h-7 w-full" : "block h-full w-7"} viewBox={`0 0 ${Math.max(horizontal ? length : 28, 1)} ${Math.max(horizontal ? 28 : length, 1)}`}>
      <rect width="100%" height="100%" fill="#171c24" />
      {ticks.map((value) => {
        const px = (value - worldStart) * zoom;
        const major = Math.abs(value % (step * 5)) < 0.001 || step >= 100;
        if (horizontal) {
          return (
            <g key={value}>
              <line x1={px} y1={major ? 12 : 18} x2={px} y2={28} stroke="#8ea0b8" strokeWidth="1" />
              {major ? (
                <text x={px + 2} y={10} fill="#c5d0de" fontSize="8" fontFamily="IBM Plex Mono, monospace">
                  {Math.round(value)}
                </text>
              ) : null}
            </g>
          );
        }
        return (
          <g key={value}>
            <line x1={major ? 12 : 18} y1={px} x2={28} y2={px} stroke="#8ea0b8" strokeWidth="1" />
            {major ? (
              <text x={2} y={px - 2} fill="#c5d0de" fontSize="8" fontFamily="IBM Plex Mono, monospace" transform={`rotate(-90 8 ${px})`}>
                {Math.round(value)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
