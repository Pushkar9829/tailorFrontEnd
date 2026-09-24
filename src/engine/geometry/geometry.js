const EPSILON = 0.05;

function nearlyEqual(a, b, epsilon = EPSILON) {
  return Math.abs(a - b) <= epsilon;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function samePoint(a, b, epsilon = EPSILON) {
  return dist(a, b) <= epsilon;
}

function shoelace(points) {
  const ring = samePoint(points[0], points[points.length - 1]) ? points.slice(0, -1) : points;
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const next = ring[(i + 1) % ring.length];
    sum += ring[i].x * next.y - next.x * ring[i].y;
  }
  return sum / 2;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const x =
    u * u * u * p0.x +
    3 * u * u * t * p1.x +
    3 * u * t * t * p2.x +
    t * t * t * p3.x;
  const y =
    u * u * u * p0.y +
    3 * u * u * t * p1.y +
    3 * u * t * t * p2.y +
    t * t * t * p3.y;
  return { x, y };
}

function sampleBezier(p0, p1, p2, p3, steps = 24) {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    points.push(cubicPoint(p0, p1, p2, p3, i / steps));
  }
  return points;
}

function boundsOf(points) {
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
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function appendPolyline(target, points) {
  for (const point of points) {
    const last = target[target.length - 1];
    if (!last || !samePoint(last, point, 1e-6)) target.push({ x: point.x, y: point.y });
  }
}

function lineIntersection(origin, direction, otherOrigin, otherDirection) {
  const cross = direction.x * otherDirection.y - direction.y * otherDirection.x;
  if (Math.abs(cross) < 1e-9) return null;
  const dx = otherOrigin.x - origin.x;
  const dy = otherOrigin.y - origin.y;
  const t = (dx * otherDirection.y - dy * otherDirection.x) / cross;
  return { x: origin.x + direction.x * t, y: origin.y + direction.y * t };
}

function segmentsIntersect(a, b, c, d) {
  function orient(p, q, r) {
    return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  }
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 === 0 || o2 === 0 || o3 === 0 || o4 === 0) return false;
  return o1 > 0 !== o2 > 0 && o3 > 0 !== o4 > 0;
}

function hasSelfIntersection(points) {
  const ring = samePoint(points[0], points[points.length - 1]) ? points.slice(0, -1) : points.slice();
  const n = ring.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    for (let j = i + 1; j < n; j += 1) {
      const adjacent = Math.abs(i - j) <= 1 || (i === 0 && j === n - 1);
      if (adjacent) continue;
      const sharesVertex = (j + 1) % n === i;
      if (sharesVertex) continue;
      const c = ring[j];
      const d = ring[(j + 1) % n];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}

function offsetClosedPolyline(points, allowances, miterLimit = 2) {
  const ring = samePoint(points[0], points[points.length - 1]) ? points.slice(0, -1) : points.slice();
  const n = ring.length;
  if (n < 3) throw new Error("Offset needs a closed ring");

  const winding = shoelace(ring);
  const outwardSign = winding >= 0 ? 1 : -1;
  const edges = [];

  for (let i = 0; i < n; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) throw new Error("Degenerate pattern edge");
    const dist = (allowances[i] ?? 0) * outwardSign;
    const nx = dy / len;
    const ny = -dx / len;
    edges.push({
      a: { x: a.x + nx * dist, y: a.y + ny * dist },
      dir: { x: dx / len, y: dy / len },
      dist: Math.abs(allowances[i] ?? 0),
    });
  }

  const offset = [];
  for (let i = 0; i < n; i += 1) {
    const prev = edges[(i - 1 + n) % n];
    const current = edges[i];
    const hit = lineIntersection(prev.a, prev.dir, current.a, current.dir);
    if (!hit) {
      offset.push(current.a);
      continue;
    }
    const reach = Math.max(prev.dist, current.dist, 1);
    if (dist(hit, current.a) > miterLimit * reach + reach) {
      offset.push(prev.a);
      offset.push(current.a);
      continue;
    }
    offset.push(hit);
  }

  offset.push({ ...offset[0] });
  return offset;
}

export {
  EPSILON,
  nearlyEqual,
  dist,
  samePoint,
  shoelace,
  sampleBezier,
  boundsOf,
  appendPolyline,
  hasSelfIntersection,
  offsetClosedPolyline,
};
