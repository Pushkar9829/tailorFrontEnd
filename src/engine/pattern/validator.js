import { EPSILON, hasSelfIntersection, samePoint } from "../geometry/geometry.js";

function validateGeneration(result, measurementsMm) {
  const errors = [...(result.errors || [])];

  for (const [name, value] of Object.entries(measurementsMm)) {
    if (!Number.isFinite(value)) errors.push(`${name} is not a number`);
    else if (name === "seamAllowance" && value < 0) errors.push("Seam allowance cannot be negative");
    else if (name !== "seamAllowance" && value <= 0) errors.push(`${name} must be greater than zero`);
  }

  const derived = result.derived || {};
  if (Number.isFinite(derived.neckDepth) && Number.isFinite(measurementsMm.length)) {
    if (derived.neckDepth >= measurementsMm.length) {
      errors.push("Neck depth is larger than blouse length");
    }
  }
  if (Number.isFinite(derived.armholeDepth) && Number.isFinite(measurementsMm.length)) {
    if (derived.armholeDepth >= measurementsMm.length) {
      errors.push("Armhole depth is larger than blouse length");
    }
  }
  if (
    Number.isFinite(derived.neckWidth) &&
    Number.isFinite(derived.shoulderWidth) &&
    derived.neckWidth >= derived.shoulderWidth
  ) {
    errors.push("Neck width must be smaller than shoulder width");
  }
  if (
    Number.isFinite(derived.shoulderWidth) &&
    Number.isFinite(derived.frontWidth) &&
    derived.shoulderWidth >= derived.frontWidth
  ) {
    errors.push("Shoulder width must be smaller than front width");
  }

  for (const piece of result.pieces || []) {
    const sewing = piece.sewing?.polyline || [];
    if (sewing.length < 4) {
      errors.push(`${piece.name} outline is incomplete`);
      continue;
    }
    if (!piece.sewing.closed && !samePoint(sewing[0], sewing[sewing.length - 1], EPSILON)) {
      errors.push(`${piece.name} sewing outline is not closed`);
    }
    if (hasSelfIntersection(sewing)) {
      errors.push(`${piece.name} outline crosses itself`);
    }
    const cutting = piece.cutting?.polyline || [];
    if (cutting.length < 4 || !samePoint(cutting[0], cutting[cutting.length - 1], EPSILON)) {
      errors.push(`${piece.name} cutting outline is not closed`);
    }
  }

  const unique = [...new Set(errors)];
  return { ok: unique.length === 0 && result.ok !== false, errors: unique };
}

export { validateGeneration };
