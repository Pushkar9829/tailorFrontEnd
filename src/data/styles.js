export const BLOUSES = [
  { id: "basic", label: "3 dart basic" },
  { id: "fourDart", label: "4 dart" },
  { id: "boat", label: "Boat neck" },
  { id: "princess", label: "Princess" },
];

export const SLEEVES = [
  { id: "basic", label: "Basic sleeve", length: "sleeveLength", cap: "armholeDepth * 0.5", bicep: "armhole / 2" },
  { id: "cap", label: "Cap sleeve", length: "armholeDepth * 0.55", cap: "armholeDepth * 0.32", bicep: "armhole / 2.3" },
  { id: "short", label: "Short sleeve", length: "length * 0.28", cap: "armholeDepth * 0.42", bicep: "armhole / 2" },
  { id: "quarter", label: "1/4 sleeve", length: "length * 0.22", cap: "armholeDepth * 0.4", bicep: "armhole / 2.05" },
  { id: "elbow", label: "Elbow sleeve", length: "length * 0.48", cap: "armholeDepth * 0.5", bicep: "armhole / 2.1" },
  { id: "threeQuarter", label: "3/4 sleeve", length: "length * 0.72", cap: "armholeDepth * 0.5", bicep: "armhole / 2" },
  { id: "full", label: "Full sleeve", length: "length * 0.95", cap: "armholeDepth * 0.55", bicep: "armhole / 1.9" },
  { id: "puff", label: "Double puff", length: "length * 0.32", cap: "armholeDepth * 0.95", bicep: "armhole / 1.35" },
];

export const NECKS = [
  { id: "round", label: "Round neck", width: "neck / 2", depth: "bust / 10", backWidth: "neck / 5", backDepth: "bust / 24" },
  { id: "deep", label: "Deep neck", width: "neck / 2.1", depth: "bust / 5.5", backWidth: "neck / 4.2", backDepth: "bust / 16" },
  { id: "square", label: "Square neck", width: "neck / 2", depth: "bust / 12", backWidth: "neck / 4.5", backDepth: "bust / 28" },
  { id: "v", label: "Curved V neck", width: "neck / 2.4", depth: "bust / 6.2", backWidth: "neck / 5", backDepth: "bust / 20" },
  { id: "glass", label: "Glass neck", width: "neck / 1.7", depth: "bust / 9", backWidth: "neck / 3.4", backDepth: "bust / 22" },
  { id: "pot", label: "Pot neck", width: "neck / 1.55", depth: "bust / 16", backWidth: "neck / 3.2", backDepth: "bust / 30" },
  { id: "boat", label: "Boat neck", width: "neck / 1.35", depth: "bust / 18", backWidth: "neck / 2.4", backDepth: "bust / 32" },
  { id: "curve3", label: "3 point curve", width: "neck / 2.1", depth: "bust / 8", backWidth: "neck / 4.2", backDepth: "bust / 20" },
  { id: "matka", label: "Matka shape neck", width: "neck / 1.45", depth: "bust / 11", backWidth: "neck / 2.8", backDepth: "bust / 26" },
  { id: "pan", label: "Pan shape neck", width: "neck / 1.8", depth: "bust / 8.5", backWidth: "neck / 3.6", backDepth: "bust / 22" },
  { id: "none", label: "Without neck", width: "neck / 6", depth: "bust / 36", backWidth: "neck / 8", backDepth: "bust / 40" },
];

export const PRINTS = [
  { id: "plain", label: "Plain" },
  { id: "checks", label: "Checks" },
  { id: "stripes", label: "Stripes" },
  { id: "floral", label: "Floral" },
  { id: "bandhani", label: "Bandhani" },
  { id: "paisley", label: "Paisley" },
];

const NECK_CONTROLS = {
  round: ["0.3", "0.8", "0.3", "0.25"],
  deep: ["0.18", "0.92", "0.22", "0.45"],
  square: ["0.08", "0.05", "0.08", "0.08"],
  v: ["0.05", "0.08", "0.04", "0.04"],
  glass: ["0.42", "0.7", "0.38", "0.2"],
  pot: ["0.45", "0.55", "0.4", "0.15"],
  boat: ["0.55", "0.2", "0.5", "0.12"],
  curve3: ["0.15", "0.9", "0.2", "0.55"],
  matka: ["0.5", "0.45", "0.48", "0.18"],
  pan: ["0.2", "0.85", "0.55", "0.2"],
  none: ["0.05", "0.05", "0.05", "0.05"],
};

function setNeckCurve(piece, segmentId, start, end, neckId, widthName, depthName) {
  const segment = piece?.segments?.find((item) => item.id === segmentId);
  if (!segment?.control1) return;
  const [x1, y1, x2, y2] = NECK_CONTROLS[neckId] || NECK_CONTROLS.round;
  segment.control1.x = `${start}.x + ${widthName} * ${x1}`;
  segment.control1.y = `${start}.y - ${depthName} * ${y1}`;
  segment.control2.x = `${end}.x - ${widthName} * ${x2}`;
  segment.control2.y = `${end}.y + ${depthName} * ${y2}`;
}

export function applyStyle(base, selection, tune = {}) {
  const pattern = structuredClone(base);
  const sleeve = SLEEVES.find((item) => item.id === selection.sleeve) || SLEEVES[0];
  const frontNeck = NECKS.find((item) => item.id === selection.frontNeck) || NECKS[0];
  const backNeck = NECKS.find((item) => item.id === selection.backNeck) || NECKS[0];
  const blouse = BLOUSES.find((item) => item.id === selection.blouse) || BLOUSES[0];

  pattern.formulas.sleeveLength = sleeve.length;
  pattern.formulas.sleeveCapHeight = sleeve.cap;
  pattern.formulas.sleeveBicep = sleeve.bicep;
  pattern.formulas.neckWidth = frontNeck.width;
  pattern.formulas.neckDepth = blouse.id === "boat" ? "bust / 18" : frontNeck.depth;
  const neckScale = Number(tune.neckDepth) > 0 ? Number(tune.neckDepth) : 1;
  const sleeveScale = Number(tune.sleeveLength) > 0 ? Number(tune.sleeveLength) : 1;
  pattern.formulas.neckDepth = `(${pattern.formulas.neckDepth}) * ${neckScale}`;
  pattern.formulas.backNeckDepth = `(${pattern.formulas.backNeckDepth}) * ${neckScale}`;
  pattern.formulas.sleeveLength = `(${pattern.formulas.sleeveLength}) * ${sleeveScale}`;
  pattern.formulas.backNeckWidth = backNeck.backWidth;
  pattern.formulas.backNeckDepth = backNeck.backDepth;
  if (blouse.id === "princess") pattern.formulas.armholeBulge = "armhole / 12";
  if (blouse.id === "fourDart") pattern.formulas.shoulderSlope = "shoulderWidth * 0.08";

  const front = pattern.pieces.find((piece) => piece.id === "front");
  const back = pattern.pieces.find((piece) => piece.id === "back");
  const facing = pattern.pieces.find((piece) => piece.id === "neckFacing");
  setNeckCurve(front, "neck", "cfNeck", "neckShoulder", frontNeck.id, "neckWidth", "neckDepth");
  setNeckCurve(back, "backNeck", "backCfNeck", "backNeckShoulder", backNeck.id, "backNeckWidth", "backNeckDepth");
  setNeckCurve(facing, "faceNeck", "faceCf", "faceShoulder", frontNeck.id, "neckWidth", "neckDepth");
  const print = PRINTS.find((item) => item.id === selection.print);
  pattern.styleLabel = `${blouse.label} / ${sleeve.label} / ${frontNeck.label} / ${backNeck.label}${print ? ` / ${print.label}` : ""}`;
  return pattern;
}
