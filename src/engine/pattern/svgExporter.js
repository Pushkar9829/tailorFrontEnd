function round(value) {
  return Math.round(value * 1000) / 1000;
}

function pathFromPolyline(points) {
  if (!points?.length) return "";
  const [first, ...rest] = points;
  const commands = [`M ${round(first.x)} ${round(first.y)}`];
  for (const point of rest) commands.push(`L ${round(point.x)} ${round(point.y)}`);
  commands.push("Z");
  return commands.join(" ");
}

function line(a, b) {
  return `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`;
}

function exportSvg(result, options = {}) {
  const includeSewing = options.includeSewing !== false;
  const pieces = result.cuttingLayout?.pieces || result.pieces || [];
  if (!pieces.length) throw new Error("No geometry to export");

  const points = pieces.flatMap((piece) => [
    ...piece.sewing.polyline,
    ...piece.cutting.polyline,
    ...piece.notches.flatMap((notch) => [notch.a, notch.b]),
    ...(piece.grainline ? [piece.grainline.a, piece.grainline.b] : []),
  ]);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  const width = Math.max(round(maxX - minX), 0.001);
  const height = Math.max(round(maxY - minY), 0.001);
  const groups = pieces.map((piece) => {
    const sewing = includeSewing
      ? `<path id="${piece.id}-sewing" d="${pathFromPolyline(piece.sewing.polyline)}" fill="none" stroke="#0f766e" stroke-width="0.4" />`
      : "";
    const notches = piece.notches
      .map((notch) => `<path id="${notch.id}" data-role="mark" d="${line(notch.a, notch.b)}" fill="none" stroke="#15803d" stroke-width="0.35" />`)
      .join("");
    const grain = piece.grainline
      ? `<path id="${piece.grainline.id}" data-role="grainline" d="${line(piece.grainline.a, piece.grainline.b)}" fill="none" stroke="#64748b" stroke-width="0.25" stroke-dasharray="2 1.5" />`
      : "";
    return `<g id="${piece.id}">
      <path id="${piece.id}-cutting" data-offset="${piece.cutting.method}" d="${pathFromPolyline(piece.cutting.polyline)}" fill="none" stroke="#dc2626" stroke-width="0.35" />
      ${sewing}${notches}${grain}
    </g>`;
  }).join("");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="${round(minX)} ${round(minY)} ${width} ${height}">`,
    `<desc>1 user unit = 1 mm. Red is cut. Green is mark. Pieces are laid out for cutting.</desc>`,
    groups,
    `</svg>`,
  ].join("");
}

export { exportSvg, pathFromPolyline };
