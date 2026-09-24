import { FormulaError } from "../formula/parser.js";
import { evaluateExpression, evaluateFormulas } from "../formula/evaluator.js";
import {
  EPSILON,
  appendPolyline,
  boundsOf,
  dist,
  offsetClosedPolyline,
  sampleBezier,
  samePoint,
} from "../geometry/geometry.js";

function coord(source, scope, points) {
  return evaluateExpression(source, scope, points).value;
}

function inwardNormal(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: -dy / len, y: dx / len };
}

function buildNotch(point, directionPoint, lengthMm) {
  const normal = inwardNormal(point, directionPoint);
  return {
    a: { x: point.x, y: point.y },
    b: { x: point.x + normal.x * lengthMm, y: point.y + normal.y * lengthMm },
  };
}

function generatePiece(piece, scope) {
  const points = {};
  const pointDetails = [];

  for (const definition of piece.points) {
    const x = coord(definition.x, scope, points);
    const y = coord(definition.y, scope, points);
    points[definition.id] = { x, y };
    pointDetails.push({
      id: definition.id,
      x,
      y,
      formulaX: definition.x,
      formulaY: definition.y,
    });
  }

  const resolvedSegments = [];
  const sewing = [];
  const allowances = [];

  for (const segment of piece.segments) {
    const start = points[segment.from] || points[segment.start];
    const end = points[segment.to] || points[segment.end];
    if (!start || !end) {
      throw new FormulaError(`Segment "${segment.id}" is missing an endpoint`);
    }

    let samples = [];
    let controls = null;
    if (segment.type === "line") {
      samples = [start, end];
    } else if (segment.type === "bezier") {
      controls = {
        c1: {
          x: coord(segment.control1.x, scope, points),
          y: coord(segment.control1.y, scope, points),
        },
        c2: {
          x: coord(segment.control2.x, scope, points),
          y: coord(segment.control2.y, scope, points),
        },
      };
      samples = sampleBezier(start, controls.c1, controls.c2, end, 32);
    } else {
      throw new FormulaError(`Unsupported segment "${segment.type}"`);
    }

    const before = sewing.length;
    appendPolyline(sewing, samples);
    const added = Math.max(sewing.length - before, 1);
    const allowance = segment.role === "fold" ? 0 : scope.seamAllowance;
    for (let i = 0; i < added - (before === 0 ? 0 : 1); i += 1) {
      allowances.push(allowance);
    }
    if (sewing.length >= 2 && allowances.length < sewing.length - 1) {
      while (allowances.length < sewing.length - 1) allowances.push(allowance);
    }

    resolvedSegments.push({
      id: segment.id,
      type: segment.type,
      role: segment.role,
      start: { ...start },
      end: { ...end },
      controls,
      formula: segment.type === "bezier"
        ? { control1: segment.control1, control2: segment.control2 }
        : null,
    });
  }

  if (!samePoint(sewing[0], sewing[sewing.length - 1], EPSILON)) {
    sewing.push({ ...sewing[0] });
    allowances.push(0);
  }

  const seamAllowance = scope.seamAllowance;
  const cutting = offsetClosedPolyline(sewing, allowances);
  const notches = (piece.notches || []).map((notch) => {
    const at = points[notch.at];
    const segment = resolvedSegments.find((item) => item.id === notch.along) || resolvedSegments[0];
    const direction = segment.end;
    return {
      id: notch.id,
      at: notch.at,
      ...buildNotch(at, direction, notch.lengthMm),
    };
  });

  const grain = piece.grainline
    ? {
        id: piece.grainline.id,
        a: { x: coord(piece.grainline.x, scope, points), y: coord(piece.grainline.y1, scope, points) },
        b: { x: coord(piece.grainline.x, scope, points), y: coord(piece.grainline.y2, scope, points) },
      }
    : null;

  return {
    id: piece.id,
    name: piece.name,
    seamAllowance,
    points: pointDetails,
    segments: resolvedSegments,
    sewing: {
      polyline: sewing,
      closed: samePoint(sewing[0], sewing[sewing.length - 1], EPSILON),
    },
    cutting: {
      polyline: cutting,
      method: "sampled-polyline",
      note: "Curve offset is a sampled polyline, not a true Bézier offset.",
    },
    notches,
    grainline: grain,
    bbox: boundsOf([...sewing, ...cutting, ...notches.flatMap((notch) => [notch.a, notch.b])]),
  };
}

function generatePattern(definition, measurementsMm) {
  try {
    const { scope, derived, dependencies, order } = evaluateFormulas(
      definition.formulas,
      measurementsMm,
    );
    if (!Object.prototype.hasOwnProperty.call(scope, "seamAllowance")) {
      throw new FormulaError("seamAllowance is required");
    }
    const pieces = definition.pieces.map((piece) => generatePiece(piece, scope));
    const geometryPoints = pieces.flatMap((piece) => [
      ...piece.sewing.polyline,
      ...piece.cutting.polyline,
    ]);
    return {
      ok: true,
      errors: [],
      patternId: definition.id,
      version: definition.version,
      derived,
      formulaOrder: order,
      dependencies,
      pieces,
      bbox: boundsOf(geometryPoints),
    };
  } catch (error) {
    return {
      ok: false,
      errors: [error.message || "Pattern generation failed"],
      patternId: definition.id,
      version: definition.version,
      derived: {},
      pieces: [],
      bbox: null,
    };
  }
}

function sewingEdgeLength(piece) {
  const line = piece.sewing.polyline;
  let total = 0;
  for (let i = 1; i < line.length; i += 1) total += dist(line[i - 1], line[i]);
  return total;
}

export { generatePattern, sewingEdgeLength };
