function stepFor(zoom) {
  const target = 28 / zoom;
  const choices = [1, 2, 5, 10, 20, 50, 100];
  return choices.find((choice) => choice >= target) || 100;
}

export default function Grid({ width, height, zoom, pan }) {
  const minor = stepFor(zoom);
  const major = minor * 5;
  const startX = Math.floor((-pan.x / zoom) / minor) * minor;
  const startY = Math.floor((-pan.y / zoom) / minor) * minor;
  const endX = startX + width / zoom + minor * 2;
  const endY = startY + height / zoom + minor * 2;
  const lines = [];

  for (let x = startX; x <= endX; x += minor) {
    const px = x * zoom + pan.x;
    const isMajor = Math.abs(x / major - Math.round(x / major)) < 0.001;
    lines.push(
      <line key={`v${x}`} x1={px} y1={0} x2={px} y2={height} stroke={isMajor ? "#314158" : "#232b38"} strokeWidth={isMajor ? 1 : 0.6} />,
    );
  }
  for (let y = startY; y <= endY; y += minor) {
    const py = y * zoom + pan.y;
    const isMajor = Math.abs(y / major - Math.round(y / major)) < 0.001;
    lines.push(
      <line key={`h${y}`} x1={0} y1={py} x2={width} y2={py} stroke={isMajor ? "#314158" : "#232b38"} strokeWidth={isMajor ? 1 : 0.6} />,
    );
  }

  const originX = pan.x;
  const originY = pan.y;
  return (
    <g>
      {lines}
      <line x1={originX} y1={0} x2={originX} y2={height} stroke="#d6b27a" strokeWidth="1.2" />
      <line x1={0} y1={originY} x2={width} y2={originY} stroke="#d6b27a" strokeWidth="1.2" />
    </g>
  );
}
