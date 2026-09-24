function num(value) {
  return (Math.round(value * 1000) / 1000).toFixed(3);
}

function exportGcode(result, options = {}) {
  const pieces = result.cuttingLayout?.pieces || [];
  const paths = pieces
    .map((piece) => ({ name: piece.name || piece.id, points: piece.cutting?.polyline || [] }))
    .filter((piece) => piece.points.length > 2);
  if (!paths.length) throw new Error("No cut outline to export");

  const feed = Number(options.feed) > 0 ? Number(options.feed) : 800;
  const power = Number(options.power) >= 0 ? Number(options.power) : 200;
  let minX = Infinity;
  let maxY = -Infinity;
  for (const piece of paths) {
    for (const point of piece.points) {
      minX = Math.min(minX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  const at = (point) => ({ x: point.x - minX, y: maxY - point.y });
  const lines = [
    "; Laser cut file from the blouse cutting layout",
    "; 1 unit = 1 mm. Origin is the bottom-left of the layout.",
    "; Red SVG cut lines only. Sewing lines and notches are not cut.",
    "; Set feed F and spindle S for your machine and fabric before you run this.",
    "G21",
    "G90",
    "G17",
    "M5",
  ];

  for (const piece of paths) {
    const points = piece.points.map(at);
    const [first, ...rest] = points;
    lines.push(`; ${piece.name}`);
    lines.push(`G0 X${num(first.x)} Y${num(first.y)}`);
    lines.push(`M3 S${power}`);
    for (const point of rest) lines.push(`G1 X${num(point.x)} Y${num(point.y)} F${feed}`);
    lines.push(`G1 X${num(first.x)} Y${num(first.y)} F${feed}`);
    lines.push("M5");
  }

  lines.push("G0 X0 Y0");
  lines.push("M5");
  return `${lines.join("\n")}\n`;
}

export { exportGcode };
