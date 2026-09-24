const INCH_TO_MM = 25.4;
const CM_TO_MM = 10;

function toMm(value, unit) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Measurement "${value}" is not a number`);
  }
  if (unit === "mm") return number;
  if (unit === "cm") return number * CM_TO_MM;
  if (unit === "inch" || unit === "in") return number * INCH_TO_MM;
  throw new Error(`Unsupported unit "${unit}"`);
}

function measurementsToMm(measurements, unit) {
  const converted = {};
  for (const [key, value] of Object.entries(measurements)) {
    converted[key] = toMm(value, unit);
  }
  return converted;
}

export { INCH_TO_MM, CM_TO_MM, toMm, measurementsToMm };
