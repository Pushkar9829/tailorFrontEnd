import { BASIC_BLOUSE_FRONT } from "./pattern/blouseFront.js";
import { assembleBlouse, layoutPieces } from "./pattern/layout.js";
import { generatePattern } from "./pattern/patternEngine.js";
import { validateGeneration } from "./pattern/validator.js";
import { exportGcode } from "./pattern/gcodeExporter.js";
import { exportSvg } from "./pattern/svgExporter.js";
import { measurementsToMm, toMm } from "./units.js";

function runPattern(definition, rawMeasurements, unit) {
  let measurementsMm;
  try {
    measurementsMm = measurementsToMm(rawMeasurements, unit);
  } catch (error) {
    return {
      ok: false,
      errors: [error.message],
      measurementsMm: null,
      geometry: null,
      svg: null,
      gcode: null,
    };
  }

  const geometry = generatePattern(definition, measurementsMm);
  const validation = validateGeneration(geometry, measurementsMm);
  const cuttingLayout = geometry.pieces.length ? layoutPieces(geometry.pieces) : { pieces: [], bbox: geometry.bbox };
  const assembled = geometry.pieces.length ? assembleBlouse(geometry.pieces) : { pieces: [], bbox: geometry.bbox };
  const payload = {
    ...geometry,
    ok: validation.ok,
    errors: validation.errors,
    measurementsMm,
    unit,
    cuttingLayout,
    assembled,
    bbox: cuttingLayout.bbox || geometry.bbox,
  };
  return {
    ...payload,
    svg: validation.ok ? exportSvg(payload) : null,
    gcode: validation.ok ? exportGcode(payload) : null,
  };
}

export {
  BASIC_BLOUSE_FRONT,
  generatePattern,
  validateGeneration,
  exportSvg,
  exportGcode,
  measurementsToMm,
  toMm,
  runPattern,
};
