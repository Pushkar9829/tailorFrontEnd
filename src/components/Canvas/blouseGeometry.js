import * as THREE from "three";

export const SLEEVE_REACH = {
  cap: 0.16,
  quarter: 0.26,
  short: 0.36,
  basic: 0.46,
  puff: 0.4,
  elbow: 0.62,
  threeQuarter: 0.78,
  full: 0.95,
};

export const SLEEVE_SVG = {
  cap: 18,
  quarter: 28,
  short: 38,
  basic: 48,
  puff: 42,
  elbow: 64,
  threeQuarter: 82,
  full: 100,
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createFabricTexture(printId = "plain") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f3eee5";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#8f4055";
  ctx.fillStyle = "#8f4055";

  if (printId === "checks") {
    ctx.globalAlpha = 0.45;
    for (let i = 0; i <= 256; i += 32) {
      ctx.fillRect(i, 0, 15, 256);
      ctx.fillRect(0, i, 256, 15);
    }
  }
  if (printId === "stripes") {
    ctx.globalAlpha = 0.55;
    for (let y = 8; y < 256; y += 28) ctx.fillRect(0, y, 256, 7);
  }
  if (printId === "floral") {
    ctx.globalAlpha = 0.75;
    for (let y = 16; y < 256; y += 48) {
      for (let x = 16; x < 256; x += 48) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 7, y + 4, 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  if (printId === "paisley") {
    ctx.globalAlpha = 0.7;
    for (let y = 20; y < 256; y += 48) {
      for (let x = 20; x < 256; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, y + 12);
        ctx.quadraticCurveTo(x + 18, y - 5, x + 18, y + 15);
        ctx.quadraticCurveTo(x + 10, y + 27, x, y + 12);
        ctx.stroke();
      }
    }
  }
  if (printId === "bandhani") {
    ctx.globalAlpha = 0.8;
    for (let y = 10; y < 256; y += 24) {
      for (let x = 10; x < 256; x += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  if ("colorSpace" in texture) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function neckCurveSvg(neckId = "round", depth = 1, back = false) {
  const d = clamp(Number(depth) || 1, 0.35, 2);
  const centerX = 110;
  const topY = 44;
  let half = 25;
  let drop = 22 + d * 11;

  if (neckId === "boat") {
    half = 39;
    drop = 8 + d * 4;
  } else if (neckId === "square") {
    half = 25;
    drop = 20 + d * 7;
  } else if (neckId === "v") {
    half = 22;
    drop = 32 + d * 12;
  } else if (neckId === "pot") {
    half = 32;
    drop = 18 + d * 7;
  } else if (neckId === "matka") {
    half = 34;
    drop = 22 + d * 9;
  } else if (neckId === "glass") {
    half = 35;
    drop = 14 + d * 5;
  } else if (neckId === "pan") {
    half = 30;
    drop = 22 + d * 8;
  } else if (neckId === "deep") {
    half = 24;
    drop = 36 + d * 14;
  } else if (neckId === "curve3") {
    half = 26;
    drop = 28 + d * 10;
  } else if (neckId === "none") {
    half = 18;
    drop = 4;
  }

  if (back) drop *= 0.42;
  const left = centerX - half;
  const right = centerX + half;
  const bottom = topY + drop;

  if (neckId === "square") return `L ${left} ${topY} L ${left} ${bottom} L ${right} ${bottom} L ${right} ${topY}`;
  if (neckId === "v") return `L ${left} ${topY} L ${centerX} ${bottom + 8} L ${right} ${topY}`;
  if (neckId === "none") return `L ${left + 8} ${topY + 2} Q ${centerX} ${topY + 7} ${right - 8} ${topY + 2}`;
  return `L ${left} ${topY} Q ${centerX} ${bottom} ${right} ${topY}`;
}

export function bodyPathSvg(neckId = "round", depth = 1, back = false) {
  return [
    "M 60 44",
    neckCurveSvg(neckId, depth, back),
    "L 160 44",
    "Q 174 48 181 70",
    "L 169 100",
    "L 164 168",
    "L 56 168",
    "L 51 100",
    "L 39 70",
    "Q 46 48 60 44",
    "Z",
  ].join(" ");
}

export function sleevePathSvg(side = "left", sleeveId = "basic") {
  const length = SLEEVE_SVG[sleeveId] || 48;
  const sign = side === "right" ? 1 : -1;
  const shoulderX = side === "right" ? 162 : 58;
  const shoulderY = 44;
  const outerX = shoulderX + sign * (length * 0.72);
  const cuffY = shoulderY + (sleeveId === "puff" ? 34 : 24);
  const innerX = shoulderX + sign * 8;
  const width = sleeveId === "puff" ? 28 : 18;
  return [
    `M ${shoulderX} ${shoulderY}`,
    `L ${outerX} ${shoulderY + 5}`,
    `L ${outerX - sign * 7} ${cuffY + width}`,
    `L ${innerX} ${cuffY}`,
    `Q ${shoulderX - sign * 4} 72 ${shoulderX} ${shoulderY}`,
    "Z",
  ].join(" ");
}

function appendNeckToShape(shape, neckId, depth, back = false) {
  const d = clamp(Number(depth) || 1, 0.35, 2);
  const top = 1.46;
  let half = 0.31;
  let drop = 0.3 + d * 0.12;

  if (neckId === "boat") {
    half = 0.52;
    drop = 0.1 + d * 0.05;
  } else if (neckId === "square") {
    half = 0.31;
    drop = 0.3 + d * 0.1;
  } else if (neckId === "v" || neckId === "deep") {
    half = 0.28;
    drop = neckId === "deep" ? 0.5 + d * 0.16 : 0.42 + d * 0.16;
  } else if (neckId === "pot") {
    half = 0.42;
    drop = 0.28 + d * 0.08;
  } else if (neckId === "matka") {
    half = 0.44;
    drop = 0.34 + d * 0.1;
  } else if (neckId === "glass") {
    half = 0.46;
    drop = 0.22 + d * 0.06;
  } else if (neckId === "pan" || neckId === "curve3") {
    half = 0.4;
    drop = 0.34 + d * 0.1;
  }

  if (back) drop *= 0.38;

  if (neckId === "square") {
    shape.lineTo(-half, top);
    shape.lineTo(-half, top - drop);
    shape.lineTo(half, top - drop);
    shape.lineTo(half, top);
    return;
  }
  if (neckId === "v" || neckId === "deep") {
    shape.lineTo(-half, top);
    shape.lineTo(0, top - drop);
    shape.lineTo(half, top);
    return;
  }
  if (neckId === "none") {
    shape.lineTo(-0.2, top + 0.01);
    shape.quadraticCurveTo(0, top - 0.02, 0.2, top + 0.01);
    return;
  }
  shape.lineTo(-half, top);
  shape.quadraticCurveTo(0, top - drop, half, top);
}

export function createBlouseBodyShape(neckId = "round", depth = 1, back = false) {
  const shape = new THREE.Shape();
  const top = 1.46;
  shape.moveTo(-0.31, top);
  appendNeckToShape(shape, neckId, depth, back);
  shape.lineTo(0.58, top);
  shape.quadraticCurveTo(0.78, 1.42, 0.88, 1.1);
  shape.lineTo(0.82, 0.42);
  shape.lineTo(0.8, -0.42);
  shape.lineTo(-0.8, -0.42);
  shape.lineTo(-0.82, 0.42);
  shape.lineTo(-0.88, 1.1);
  shape.quadraticCurveTo(-0.78, 1.42, -0.58, top);
  shape.closePath();
  return shape;
}

export function createSleeveMesh(side, sleeveId, material) {
  const reach = SLEEVE_REACH[sleeveId] || SLEEVE_REACH.basic;
  const sign = side === "right" ? 1 : -1;
  const start = new THREE.Vector3(sign * 0.73, 1.31, 0);
  const end = new THREE.Vector3(sign * (0.73 + reach * 0.52), 1.31 - reach * 0.78, 0);
  const direction = end.clone().sub(start);
  const length = direction.length();
  let shoulderRadius = 0.22;
  let cuffRadius = 0.15;
  if (sleeveId === "puff") {
    shoulderRadius = 0.3;
    cuffRadius = 0.2;
  }
  if (sleeveId === "cap") {
    shoulderRadius = 0.2;
    cuffRadius = 0.16;
  }
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(cuffRadius, shoulderRadius, length, 32, 2, false), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

export function createLine(points, color = 0x6f6870) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.65 }),
  );
}

export function disposeObject(root) {
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
  });
}
