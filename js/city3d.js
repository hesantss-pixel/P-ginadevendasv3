// Mapa 3D ilustrativo: quarteirões, rotas iluminadas, veículos percorrendo as rotas e paradas.
import * as THREE from "../vendor/three.module.min.js";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";
import { rng } from "./mapgen.js";

const N = 11; // quarteirões por lado
const BLOCK = 1.6; // tamanho do quarteirão
const STREET = 0.62; // largura da rua
const PITCH = BLOCK + STREET;
const HALF = (N * PITCH - STREET) / 2;
// centro da rua entre o quarteirão i e i+1 (i = -1 .. N-1)
const streetAt = (i) => -HALF + i * PITCH + BLOCK + STREET / 2;

function cornerPath(gridPts, y = 0.05, radius = 0.42) {
  const pts = gridPts.map(([i, j]) => new THREE.Vector3(streetAt(i), y, streetAt(j)));
  const path = new THREE.CurvePath();
  let prev = pts[0].clone();
  for (let k = 1; k < pts.length; k++) {
    const cur = pts[k],
      next = pts[k + 1];
    if (!next) {
      path.add(new THREE.LineCurve3(prev, cur.clone()));
      break;
    }
    const dIn = cur.clone().sub(prev).normalize(),
      dOut = next.clone().sub(cur).normalize();
    const r = Math.min(radius, cur.distanceTo(prev) / 2, next.distanceTo(cur) / 2);
    const a = cur.clone().addScaledVector(dIn, -r),
      b = cur.clone().addScaledVector(dOut, r);
    path.add(new THREE.LineCurve3(prev, a));
    path.add(new THREE.QuadraticBezierCurve3(a, cur.clone(), b));
    prev = b;
  }
  return path;
}

function dashTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 8;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 128, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.55, "rgba(255,255,255,0)");
  g.addColorStop(0.85, "rgba(255,255,255,.95)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
function groundTexture() {
  const S = 2048,
    c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d");
  const toPx = (v) => ((v + HALF + 2) / (2 * HALF + 4)) * S;
  x.fillStyle = "#04172b";
  x.fillRect(0, 0, S, S);
  x.strokeStyle = "rgba(120,170,230,.16)";
  x.lineWidth = 2;
  for (let i = -1; i < N; i++) {
    const p = toPx(streetAt(i));
    x.setLineDash([18, 22]);
    x.beginPath();
    x.moveTo(p, 0);
    x.lineTo(p, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, p);
    x.lineTo(S, p);
    x.stroke();
  }
  x.setLineDash([]);
  x.strokeStyle = "rgba(120,170,230,.07)";
  x.lineWidth = (STREET / (2 * HALF + 4)) * S * 0.9;
  for (let i = -1; i < N; i++) {
    const p = toPx(streetAt(i));
    x.beginPath();
    x.moveTo(p, 0);
    x.lineTo(p, S);
    x.stroke();
    x.beginPath();
    x.moveTo(0, p);
    x.lineTo(S, p);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeVan(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.22, 0.22, 3, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.35, metalness: 0.2 }),
  );
  body.position.set(-0.04, 0.15, 0);
  g.add(body);
  const cab = new THREE.Mesh(
    new RoundedBoxGeometry(0.16, 0.17, 0.21, 3, 0.04),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }),
  );
  cab.position.set(0.24, 0.125, 0);
  g.add(cab);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.07, 0.17),
    new THREE.MeshStandardMaterial({ color: 0x0b1a2e, roughness: 0.1, metalness: 0.6 }),
  );
  glass.position.set(0.32, 0.16, 0);
  g.add(glass);
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff1c4 }),
  );
  [-0.06, 0.06].forEach((z) => {
    const l = light.clone();
    l.position.set(0.325, 0.08, z);
    g.add(l);
  });
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.035, 0.225),
    new THREE.MeshBasicMaterial({ color }),
  );
  stripe.position.set(-0.05, 0.16, 0);
  g.add(stripe);
  return g;
}
function makePin(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.2,
    emissive: color,
    emissiveIntensity: 0.35,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), mat);
  head.position.y = 0.62;
  g.add(head);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 20), mat);
  cone.rotation.x = Math.PI;
  cone.position.y = 0.38;
  g.add(cone);
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  dot.position.set(0, 0.64, 0.13);
  g.add(dot);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.24, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  g.add(ring);
  g.userData.ring = ring;
  g.userData.head = head;
  return g;
}

export async function initCity(canvas, container, { reduceMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x021a33, 28, 58);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.35;
  scene.add(new THREE.HemisphereLight(0x4a7fc0, 0x020b16, 0.75));
  const warm = new THREE.DirectionalLight(0xffb36b, 0.65);
  warm.position.set(-12, 3, -5);
  scene.add(warm);
  const cool = new THREE.DirectionalLight(0x6fa8ff, 0.7);
  cool.position.set(10, 6, 8);
  scene.add(cool);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * HALF + 4, 2 * HALF + 4),
    new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // prédios (um único InstancedMesh para ficar leve)
  const r = rng(42);
  const boxes = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const cx = -HALF + i * PITCH + BLOCK / 2,
        cz = -HALF + j * PITCH + BLOCK / 2;
      const dc = Math.hypot(cx, cz) / HALF;
      if (r() < 0.08 && dc > 0.25) continue; // praças
      const split = r() < 0.55 ? 2 : 1;
      const s = BLOCK / split;
      for (let a = 0; a < split; a++)
        for (let b = 0; b < split; b++) {
          if (split === 2 && r() < 0.18) continue;
          const hgt = 0.25 + Math.pow(r(), 2.2) * 2.6 * (1.25 - dc * 0.8);
          const w = s * (0.72 + r() * 0.18),
            d = s * (0.72 + r() * 0.18);
          boxes.push({
            x: cx - BLOCK / 2 + s * (a + 0.5),
            z: cz - BLOCK / 2 + s * (b + 0.5),
            w,
            d,
            h: Math.max(0.18, hgt),
          });
        }
    }
  const bMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.48,
    metalness: 0.25,
  });
  const bMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    bMat,
    boxes.length,
  );
  const m = new THREE.Matrix4(),
    col = new THREE.Color();
  const shades = [0x0e2747, 0x12305a, 0x0b223f, 0x163b69, 0x0f2b50];
  boxes.forEach((bx, k) => {
    m.makeScale(bx.w, bx.h, bx.d);
    m.setPosition(bx.x, 0, bx.z);
    bMesh.setMatrixAt(k, m);
    bMesh.setColorAt(k, col.setHex(shades[k % shades.length]));
  });
  scene.add(bMesh);
  // tampas claras nos prédios mais altos (dá leitura de volume)
  const tall = boxes.filter((b) => b.h > 1.1);
  const roofs = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x2f64a3, transparent: true, opacity: 0.5 }),
    tall.length,
  );
  tall.forEach((bx, k) => {
    m.makeScale(bx.w * 0.92, 1, bx.d * 0.92);
    m.setPosition(bx.x, bx.h + 0.002, bx.z);
    roofs.setMatrixAt(k, m);
  });
  scene.add(roofs);

  // centro de distribuição
  const cd = new THREE.Group();
  const cdBody = new THREE.Mesh(
    new RoundedBoxGeometry(1.3, 0.55, 1.0, 3, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xdfe6ee, roughness: 0.4, metalness: 0.2 }),
  );
  cdBody.position.y = 0.275;
  cd.add(cdBody);
  const cdRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.06, 1.02),
    new THREE.MeshStandardMaterial({
      color: 0xe0b450,
      emissive: 0xe0b450,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    }),
  );
  cdRoof.position.y = 0.58;
  cd.add(cdRoof);
  const cx0 = -HALF + 5 * PITCH + BLOCK / 2,
    cz0 = -HALF + 5 * PITCH + BLOCK / 2;
  cd.position.set(cx0, 0, cz0);
  // libera o quarteirão do CD
  boxes.forEach((bx, k) => {
    if (Math.abs(bx.x - cx0) < BLOCK / 2 && Math.abs(bx.z - cz0) < BLOCK / 2) {
      m.makeScale(0.001, 0.001, 0.001);
      m.setPosition(0, -5, 0);
      bMesh.setMatrixAt(k, m);
    }
  });
  scene.add(cd);

  // rotas pela grade de ruas (índices das ruas: -1 .. N-1)
  const routeDefs = [
    {
      color: 0xe0b450,
      grid: [
        [4, 5],
        [4, 2],
        [1, 2],
        [1, -1 + 1],
        [6, 0],
        [6, 3],
        [8, 3],
      ],
    },
    {
      color: 0x3b82f6,
      grid: [
        [5, 5],
        [8, 5],
        [8, 8],
        [5, 8],
        [5, 9],
        [2, 9],
        [2, 6],
      ],
    },
    {
      color: 0x22c55e,
      grid: [
        [4, 4],
        [0, 4],
        [0, 7],
        [3, 7],
        [3, 9],
      ],
    },
  ];
  const dash = dashTexture();
  const flows = [],
    vans = [],
    pins = [];
  const vanCurves = [];
  routeDefs.forEach((def, ri) => {
    const path = cornerPath(def.grid, 0.05);
    const len = path.getLength();
    const segs = Math.round(len * 12);
    const core = new THREE.Mesh(
      new THREE.TubeGeometry(path, segs, 0.07, 8, false),
      new THREE.MeshBasicMaterial({ color: def.color, toneMapped: false }),
    );
    scene.add(core);
    const glow = new THREE.Mesh(
      new THREE.TubeGeometry(path, segs, 0.24, 10, false),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    scene.add(glow);
    const t = dash.clone();
    t.repeat.x = Math.max(1, Math.round(len / 1.4));
    t.needsUpdate = true;
    const flow = new THREE.Mesh(
      new THREE.TubeGeometry(path, segs, 0.09, 8, false),
      new THREE.MeshBasicMaterial({
        map: t,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    scene.add(flow);
    flows.push(t);
    vanCurves.push({ path, len });
    const nv = ri === 1 ? 2 : 1;
    for (let k = 0; k < nv; k++) {
      const v = makeVan(def.color);
      v.scale.setScalar(1.6);
      scene.add(v);
      vans.push({ v, ri, off: k / nv + ri * 0.17 });
    }
    // paradas: nos cantos da rota (pula o primeiro, que é a saída do CD)
    def.grid.slice(2).forEach((g, k) => {
      if (k % 2 === 1 && def.grid.length > 5) return;
      const p = makePin(def.color);
      p.scale.setScalar(1.35);
      p.position.set(streetAt(g[0]), 0, streetAt(g[1]));
      p.userData.phase = r() * 6;
      scene.add(p);
      pins.push(p);
    });
  });
  // parada com alerta (pedido atrasado)
  const alertPin = makePin(0xe5484d);
  alertPin.scale.setScalar(1.5);
  alertPin.position.set(streetAt(7) + 0.0, 0, streetAt(1));
  alertPin.userData.alert = true;
  alertPin.userData.phase = 0;
  scene.add(alertPin);
  pins.push(alertPin);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const look = new THREE.Vector3(0.6, 0, 0.8);
  let w = 0,
    h = 0,
    camDist = 17;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camDist = camera.aspect >= 1.2 ? 27 : 27 * (1.2 / camera.aspect) ** 0.7;
    camera.updateProjectionMatrix();
    requestRender();
  }

  let pointerX = 0,
    sx = 0,
    visible = false,
    running = false;
  const t0 = performance.now();
  const tmp = new THREE.Vector3(),
    tan = new THREE.Vector3();
  function place(now) {
    const t = (now - t0) / 1000;
    sx += (pointerX - sx) * 0.05;
    const ang = 0.78 + (reduceMotion ? 0 : Math.sin(t * 0.12) * 0.22) + sx * 0.18;
    camera.position.set(
      look.x + Math.sin(ang) * camDist * 0.72,
      camDist * 0.68,
      look.z + Math.cos(ang) * camDist * 0.72,
    );
    camera.lookAt(look);
    if (!reduceMotion) {
      flows.forEach((f, i) => (f.offset.x = -t * (0.55 + i * 0.08)));
      vans.forEach(({ v, ri, off }) => {
        const { path, len } = vanCurves[ri];
        const u = ((t * 0.9) / len + off) % 1;
        path.getPointAt(u, tmp);
        path.getTangentAt(u, tan);
        v.position.set(tmp.x, 0.01, tmp.z);
        v.rotation.y = Math.atan2(-tan.z, tan.x);
      });
      pins.forEach((p) => {
        const ph = t * (p.userData.alert ? 3 : 1.6) + p.userData.phase;
        p.userData.head.position.y = 0.62 + Math.sin(ph) * 0.05;
        const s = 1 + ((ph % (Math.PI * 2)) / (Math.PI * 2)) * (p.userData.alert ? 2.2 : 1.2);
        p.userData.ring.scale.setScalar(s);
        p.userData.ring.material.opacity = 0.6 * (1 - (s - 1) / (p.userData.alert ? 2.2 : 1.2));
      });
    } else {
      vans.forEach(({ v, ri, off }) => {
        const { path } = vanCurves[ri];
        path.getPointAt(off % 1, tmp);
        path.getTangentAt(off % 1, tan);
        v.position.set(tmp.x, 0.01, tmp.z);
        v.rotation.y = Math.atan2(-tan.z, tan.x);
      });
    }
  }
  function frame(now) {
    running = false;
    if (!visible || document.hidden) return;
    place(now);
    renderer.render(scene, camera);
    if (!reduceMotion) loop();
  }
  function loop() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  function requestRender() {
    loop();
  }

  if (!reduceMotion)
    container.addEventListener(
      "pointermove",
      (e) => {
        const rc = container.getBoundingClientRect();
        pointerX = ((e.clientX - rc.left) / rc.width) * 2 - 1;
      },
      { passive: true },
    );
  new IntersectionObserver(
    (en) => {
      visible = en[0].isIntersecting;
      if (visible) loop();
    },
    { rootMargin: "100px" },
  ).observe(container);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loop();
  });
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    container.classList.add("is-fallback");
    const img = container.querySelector("img[data-src]");
    if (img && !img.src) img.src = img.dataset.src;
  });
  resize();
  place(performance.now());
  renderer.render(scene, camera);
  container.classList.add("is-ready");
  return { renderer, scene, camera };
}
