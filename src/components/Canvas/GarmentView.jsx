import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createBlouseBodyShape, createFabricTexture, createLine, createSleeveMesh, disposeObject } from "./blouseGeometry.js";

export default function GarmentView({ selection, tune }) {
  const host = useRef(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#171c24");
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0.45, 4.5);
    camera.lookAt(0, 0.45, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const texture = createFabricTexture(selection?.print || "plain");
    const clothMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      color: "#f4efe6",
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const blouse = new THREE.Group();
    const frontDepth = Number(tune?.neckDepth) || 1;
    const extrude = { depth: 0.08, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 12 };

    const front = new THREE.Mesh(new THREE.ExtrudeGeometry(createBlouseBodyShape(selection?.frontNeck || "round", frontDepth, false), extrude), clothMaterial);
    front.position.z = 0.06;
    blouse.add(front);

    const back = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createBlouseBodyShape(selection?.backNeck || "round", Math.max(0.35, frontDepth * 0.45), true), extrude),
      clothMaterial,
    );
    back.position.z = -0.14;
    back.rotation.y = Math.PI;
    blouse.add(back);

    const sleeveId = selection?.sleeve || "basic";
    blouse.add(createSleeveMesh("left", sleeveId, clothMaterial));
    blouse.add(createSleeveMesh("right", sleeveId, clothMaterial));

    const seam = 0x9aabbf;
    blouse.add(createLine([new THREE.Vector3(-0.22, 0.55, 0.12), new THREE.Vector3(-0.18, 0.9, 0.12)], seam));
    blouse.add(createLine([new THREE.Vector3(0.22, 0.55, 0.12), new THREE.Vector3(0.18, 0.9, 0.12)], seam));
    blouse.add(createLine([new THREE.Vector3(0, -0.4, 0.12), new THREE.Vector3(0, 0.55, 0.12)], seam));

    blouse.position.y = -0.35;
    blouse.scale.set(1.05, 1.05, 1.05);
    scene.add(blouse);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    const drag = { active: false, x: 0, y: 0 };
    function pointerDown(event) {
      drag.active = true;
      drag.x = event.clientX;
      drag.y = event.clientY;
    }
    function pointerMove(event) {
      if (!drag.active) return;
      blouse.rotation.y += (event.clientX - drag.x) * 0.008;
      blouse.rotation.x = Math.max(-0.45, Math.min(0.45, blouse.rotation.x + (event.clientY - drag.y) * 0.004));
      drag.x = event.clientX;
      drag.y = event.clientY;
    }
    function pointerUp() {
      drag.active = false;
    }
    function wheel(event) {
      event.preventDefault();
      camera.position.z = Math.max(3, Math.min(6, camera.position.z + event.deltaY * 0.002));
    }
    function resize() {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (!drag.active) blouse.rotation.y += 0.004;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("wheel", wheel);
      disposeObject(blouse);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [selection, tune]);

  return <div ref={host} className="h-full w-full cursor-grab bg-[#171c24]" />;
}
