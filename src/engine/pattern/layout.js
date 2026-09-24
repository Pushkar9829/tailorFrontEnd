import { boundsOf } from "../geometry/geometry.js";

const GAP = 28;

function movePoint(point, dx, dy) {
  return { x: point.x + dx, y: point.y + dy };
}

function transformPiece(piece, fn, idSuffix = "") {
  const apply = (point) => fn(point);
  return {
    ...piece,
    id: `${piece.id}${idSuffix}`,
    points: piece.points.map((point) => ({ ...point, ...apply(point) })),
    sewing: { ...piece.sewing, polyline: piece.sewing.polyline.map(apply) },
    cutting: { ...piece.cutting, polyline: piece.cutting.polyline.map(apply) },
    notches: piece.notches.map((notch) => ({
      ...notch,
      id: `${notch.id}${idSuffix}`,
      a: apply(notch.a),
      b: apply(notch.b),
    })),
    grainline: piece.grainline
      ? {
          ...piece.grainline,
          id: `${piece.grainline.id}${idSuffix}`,
          a: apply(piece.grainline.a),
          b: apply(piece.grainline.b),
        }
      : null,
    segments: piece.segments.map((segment) => ({
      ...segment,
      id: `${segment.id}${idSuffix}`,
      start: apply(segment.start),
      end: apply(segment.end),
      controls: segment.controls
        ? { c1: apply(segment.controls.c1), c2: apply(segment.controls.c2) }
        : null,
    })),
  };
}

function translatePiece(piece, dx, dy, idSuffix = "") {
  return transformPiece(piece, (point) => movePoint(point, dx, dy), idSuffix);
}

function mirrorPieceX(piece) {
  const mirrored = transformPiece(piece, (point) => ({ x: -point.x, y: point.y }), "-left");
  mirrored.name = "";
  mirrored.sewing = { ...mirrored.sewing, polyline: [...mirrored.sewing.polyline].reverse() };
  mirrored.cutting = { ...mirrored.cutting, polyline: [...mirrored.cutting.polyline].reverse() };
  return mirrored;
}

function pieceBounds(piece) {
  const points = [...piece.sewing.polyline, ...piece.cutting.polyline];
  for (const notch of piece.notches || []) points.push(notch.a, notch.b);
  if (piece.grainline) points.push(piece.grainline.a, piece.grainline.b);
  return boundsOf(points);
}

function layoutPieces(pieces) {
  let cursor = 0;
  const placed = pieces.map((piece) => {
    const box = pieceBounds(piece);
    const dx = cursor - box.minX;
    const dy = -box.minY;
    cursor += box.width + GAP;
    return translatePiece(piece, dx, dy);
  });
  const points = placed.flatMap((piece) => [...piece.sewing.polyline, ...piece.cutting.polyline]);
  return { pieces: placed, bbox: boundsOf(points) };
}

function assembleBlouse(pieces) {
  const byId = Object.fromEntries(pieces.map((piece) => [piece.id, piece]));
  const front = byId.front;
  const back = byId.back;
  const sleeve = byId.sleeve;
  const facing = byId.neckFacing;
  const frontBox = pieceBounds(front);
  const backBox = pieceBounds(back);
  const backDy = frontBox.minY - GAP - backBox.maxY;
  const backPlaced = translatePiece(back, 0, backDy);
  const sleeveBox = pieceBounds(sleeve);
  const sleeveDy = frontBox.minY - sleeveBox.minY;
  const rightSleeve = translatePiece(sleeve, frontBox.maxX + GAP - sleeveBox.minX, sleeveDy);
  const leftSleeve = mirrorPieceX(rightSleeve);
  const facingBox = pieceBounds(facing);
  const facingPlaced = translatePiece(
    facing,
    frontBox.maxX * 0.15,
    frontBox.minY - GAP * 0.4 - facingBox.maxY,
  );
  const assembled = [
    mirrorPieceX(backPlaced),
    backPlaced,
    mirrorPieceX(front),
    front,
    leftSleeve,
    rightSleeve,
    mirrorPieceX(facingPlaced),
    facingPlaced,
  ];
  const points = assembled.flatMap((piece) => [...piece.sewing.polyline, ...piece.cutting.polyline]);
  return { pieces: assembled, bbox: boundsOf(points) };
}

export { layoutPieces, assembleBlouse, translatePiece, mirrorPieceX };
