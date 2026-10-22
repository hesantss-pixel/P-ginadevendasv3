// Cidade 3D noturna (ilustrativa) da seção "Antes do ROTAV3".
// Prédios com janelas acesas, ruas com postes, árvores, depósito iluminado, rotas neon com
// fluxo animado, alfinetes 3D (entrega, coleta, horário, atraso) e veículos percorrendo as ruas.
// Nada aqui usa dados reais: é uma ilustração para mostrar a ideia do mapa de rotas.
import * as THREE from "../vendor/three.module.min.js";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";
import { EffectComposer } from "../vendor/three-post/EffectComposer.js";
import { RenderPass } from "../vendor/three-post/RenderPass.js";
import { UnrealBloomPass } from "../vendor/three-post/UnrealBloomPass.js";
import { OutputPass } from "../vendor/three-post/OutputPass.js";

const N = 9; // quarteirões por lado
const BLOCK = 2.2;
const STREET = 0.8;
const PITCH = BLOCK + STREET;
const HALF = (N * PITCH - STREET) / 2;
const blockAt = (i) => -HALF + i * PITCH; // canto inicial do quarteirão i
const streetAt = (i) => -HALF + i * PITCH + BLOCK + STREET / 2; // rua depois do quarteirão i
const BG = 0x070d18;

const COLORS = {
  entrega: 0x2ee66b,
  coleta: 0x3b8bff,
  rota: 0xffb21e,
  atraso: 0xff3b4e,
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- texturas desenhadas em canvas ---------- */
const CELLS = 16; // janelas por lado da textura
function windowTextures(rand) {
  const S = 512;
  const cell = S / CELLS;
  const wall = document.createElement("canvas");
  const lit = document.createElement("canvas");
  wall.width = wall.height = lit.width = lit.height = S;
  const w = wall.getContext("2d");
  const l = lit.getContext("2d");
  w.fillStyle = "#2a374f";
  w.fillRect(0, 0, S, S);
  l.fillStyle = "#000";
  l.fillRect(0, 0, S, S);
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      const px = x * cell + cell * 0.22;
      const py = y * cell + cell * 0.2;
      const ww = cell * 0.56;
      const wh = cell * 0.52;
      w.fillStyle = "#1c2639";
      w.fillRect(px, py, ww, wh);
      const r = rand();
      if (r < 0.18) {
        const warm = rand() < 0.82;
        const a = 0.55 + rand() * 0.45;
        l.fillStyle = warm
          ? `rgba(255, ${190 + rand() * 40}, ${110 + rand() * 40}, ${a})`
          : `rgba(160, 205, 255, ${a})`;
        l.fillRect(px, py, ww, wh);
      }
    }
  }
  const mk = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return { map: mk(wall), emissiveMap: mk(lit) };
}

function dashTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 8;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.15)");
  grad.addColorStop(0.85, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function iconTexture(kind, color) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = g.fillStyle = color;
  g.lineWidth = 7;
  g.lineJoin = g.lineCap = "round";
  const cx = S / 2;
  const cy = S / 2;
  if (kind === "entrega") {
    // caixa
    g.beginPath();
    g.moveTo(cx, cy - 22);
    g.lineTo(cx + 20, cy - 11);
    g.lineTo(cx + 20, cy + 13);
    g.lineTo(cx, cy + 24);
    g.lineTo(cx - 20, cy + 13);
    g.lineTo(cx - 20, cy - 11);
    g.closePath();
    g.moveTo(cx - 20, cy - 11);
    g.lineTo(cx, cy);
    g.lineTo(cx + 20, cy - 11);
    g.moveTo(cx, cy);
    g.lineTo(cx, cy + 24);
    g.stroke();
  } else if (kind === "coleta") {
    // caminhão
    g.strokeRect(cx - 24, cy - 14, 28, 22);
    g.beginPath();
    g.moveTo(cx + 4, cy - 6);
    g.lineTo(cx + 16, cy - 6);
    g.lineTo(cx + 24, cy + 2);
    g.lineTo(cx + 24, cy + 8);
    g.lineTo(cx + 4, cy + 8);
    g.stroke();
    g.beginPath();
    g.arc(cx - 14, cy + 14, 5, 0, Math.PI * 2);
    g.arc(cx + 14, cy + 14, 5, 0, Math.PI * 2);
    g.fill();
  } else if (kind === "rota") {
    // relógio (horário marcado)
    g.beginPath();
    g.arc(cx, cy, 22, 0, Math.PI * 2);
    g.moveTo(cx, cy - 12);
    g.lineTo(cx, cy);
    g.lineTo(cx + 10, cy + 6);
    g.stroke();
  } else {
    // alerta
    g.font = "bold 58px Inter, Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("!", cx, cy + 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- geometria dos prédios (uma malha só, leve) ---------- */
function buildingGeometry(boxes) {
  const side = { p: [], n: [], uv: [] };
  const top = { p: [], n: [], uv: [] };
  const cw = 0.42; // largura de uma janela
  const ch = 0.38; // altura de um andar
  const quad = (t, a, b, c, d, n, uvs) => {
    for (const [v, uv] of [
      [a, uvs[0]],
      [b, uvs[1]],
      [c, uvs[2]],
      [a, uvs[0]],
      [c, uvs[2]],
      [d, uvs[3]],
    ]) {
      t.p.push(...v);
      t.n.push(...n);
      t.uv.push(...uv);
    }
  };
  for (const { x, z, w, d, h, uo, vo } of boxes) {
    const x0 = x - w / 2,
      x1 = x + w / 2,
      z0 = z - d / 2,
      z1 = z + d / 2;
    const U = (len) => len / cw / CELLS;
    const V = h / ch / CELLS;
    const faceUV = (len) => [
      [uo, vo],
      [uo + U(len), vo],
      [uo + U(len), vo + V],
      [uo, vo + V],
    ];
    quad(side, [x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1], [1, 0, 0], faceUV(d));
    quad(side, [x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0], [-1, 0, 0], faceUV(d));
    quad(side, [x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], [0, 0, 1], faceUV(w));
    quad(side, [x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], [0, 0, -1], faceUV(w));
    quad(
      top,
      [x0, h, z1],
      [x1, h, z1],
      [x1, h, z0],
      [x0, h, z0],
      [0, 1, 0],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    );
  }
  const mk = (t) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(t.p, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(t.n, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(t.uv, 2));
    return g;
  };
  return { sides: mk(side), tops: mk(top) };
}

/* ---------- caminho pelas ruas, com cantos arredondados ---------- */
function streetPath(grid, y = 0.07, radius = 0.5) {
  const pts = grid.map(([i, j]) => new THREE.Vector3(streetAt(i), y, streetAt(j)));
  const path = new THREE.CurvePath();
  let prev = pts[0].clone();
  for (let k = 1; k < pts.length; k++) {
    const cur = pts[k];
    const next = pts[k + 1];
    if (!next) {
      path.add(new THREE.LineCurve3(prev, cur.clone()));
      break;
    }
    const dIn = cur.clone().sub(prev).normalize();
    const dOut = next.clone().sub(cur).normalize();
    const r = Math.min(radius, cur.distanceTo(prev) / 2, next.distanceTo(cur) / 2);
    const a = cur.clone().addScaledVector(dIn, -r);
    const b = cur.clone().addScaledVector(dOut, r);
    path.add(new THREE.LineCurve3(prev, a));
    path.add(new THREE.QuadraticBezierCurve3(a, cur.clone(), b));
    prev = b;
  }
  return path;
}

function makePin(kind) {
  const color = new THREE.Color(COLORS[kind]);
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.3,
    roughness: 0.35,
    metalness: 0.1,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), mat);
  head.position.y = 1.32;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.86, 32, 1, true), mat);
  tip.rotation.x = Math.PI;
  tip.position.y = 0.78;
  const icon = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: iconTexture(kind, `#${color.getHexString()}`),
      depthTest: false,
    }),
  );
  icon.scale.setScalar(0.62);
  icon.position.y = 1.34;
  icon.renderOrder = 10;
  const bob = new THREE.Group();
  bob.add(head, tip, icon);
  g.add(bob);
  // anel no chão, pulsando
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.22, 0.32, 40),
    new THREE.MeshBasicMaterial({
      color: color.clone().multiplyScalar(1.3),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.09;
  g.add(ring);
  // ponto de luz colorida no chão
  const glow = new THREE.PointLight(color, 2.2, 3.2, 2);
  glow.position.y = 0.6;
  g.add(glow);
  return { group: g, bob, ring };
}

function makeTruck(cab) {
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({
    color: 0xe8edf4,
    roughness: 0.45,
    metalness: 0.15,
  });
  const cabMat = new THREE.MeshStandardMaterial({ color: cab, roughness: 0.4, metalness: 0.2 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.36, 0.66, 2, 0.04), white);
  box.position.set(0, 0.28, -0.08);
  const front = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.27, 0.22, 2, 0.04), cabMat);
  front.position.set(0, 0.235, 0.36);
  const lightMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xfff2c8).multiplyScalar(2),
  });
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), lightMat);
  l1.position.set(-0.1, 0.17, 0.475);
  const l2 = l1.clone();
  l2.position.x = 0.1;
  const tailMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff3344).multiplyScalar(2.5),
  });
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), tailMat);
  t1.position.set(-0.12, 0.16, -0.42);
  const t2 = t1.clone();
  t2.position.x = 0.12;
  g.add(box, front, l1, l2, t1, t2);
  return g;
}

export async function initCity(canvas, box, { reduceMotion = false } = {}) {
  const rand = rng(20261022);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  const isSmall = window.matchMedia("(max-width: 640px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.032);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 200);

  // luz: noite azulada + lua + brilho quente do depósito
  scene.add(new THREE.HemisphereLight(0x6f8fc4, 0x070b14, 1.1));
  const moon = new THREE.DirectionalLight(0xa9c2ff, 1.6);
  moon.position.set(-12, 22, 8);
  scene.add(moon);

  /* chão, calçadas e marcações */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    new THREE.MeshStandardMaterial({ color: 0x0b1320, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x172133, roughness: 0.95 });
  const lotGeo = new THREE.BoxGeometry(BLOCK, 0.06, BLOCK);
  const lots = new THREE.InstancedMesh(lotGeo, sidewalkMat, N * N);
  const m = new THREE.Matrix4();
  let li = 0;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      m.makeTranslation(blockAt(i) + BLOCK / 2, 0.03, blockAt(j) + BLOCK / 2);
      lots.setMatrixAt(li++, m);
    }
  scene.add(lots);

  // faixas tracejadas nas ruas
  const laneMat = new THREE.MeshBasicMaterial({ color: 0x33445f });
  const lane = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.34, 0.035),
    laneMat,
    2 * (N - 1) * N * 5,
  );
  let ln = 0;
  const q = new THREE.Quaternion();
  const s1 = new THREE.Vector3(1, 1, 1);
  for (let s = 0; s < N - 1; s++) {
    for (let b = 0; b < N; b++) {
      for (let k = 0; k < 5; k++) {
        const along = blockAt(b) + 0.22 + k * 0.44;
        q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
        lane.setMatrixAt(ln++, m.compose(new THREE.Vector3(along, 0.012, streetAt(s)), q, s1));
        q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, Math.PI / 2));
        lane.setMatrixAt(ln++, m.compose(new THREE.Vector3(streetAt(s), 0.012, along), q, s1));
      }
    }
  }
  scene.add(lane);

  // postes de luz nas esquinas
  const lamps = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.05, 8, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd27a).multiplyScalar(1.3) }),
    (N + 1) * (N + 1),
  );
  let lp = 0;
  for (let i = -1; i < N; i++)
    for (let j = -1; j < N; j++) {
      m.makeTranslation(streetAt(i) - STREET / 2 - 0.05, 0.42, streetAt(j) - STREET / 2 - 0.05);
      lamps.setMatrixAt(lp++, m);
    }
  lamps.count = lp;
  scene.add(lamps);

  /* depósito (quarteirão 1,3) */
  const DEP = { i: 1, j: 3 };
  const dx = blockAt(DEP.i) + BLOCK / 2;
  const dz = blockAt(DEP.j) + BLOCK / 2;
  const depot = new THREE.Group();
  const shed = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.7, 1.9),
    new THREE.MeshStandardMaterial({ color: 0x5b6779, roughness: 0.6, metalness: 0.2 }),
  );
  shed.position.set(-0.25, 0.41, 0);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.56, 0.06, 1.96),
    new THREE.MeshStandardMaterial({ color: 0x8b97a8, roughness: 0.5 }),
  );
  roof.position.set(-0.25, 0.79, 0);
  depot.add(shed, roof);
  // portas de doca iluminadas viradas para a rua
  const dockMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xffc56a).multiplyScalar(1.5),
  });
  for (let k = 0; k < 4; k++) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.32), dockMat);
    door.rotation.y = Math.PI / 2;
    door.position.set(0.51, 0.24, -0.66 + k * 0.44);
    depot.add(door);
  }
  const yard = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x2a3446, roughness: 0.9 }),
  );
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(0.72, 0.065, 0);
  depot.add(yard);
  const warm = new THREE.PointLight(0xffb45a, 9, 6, 2);
  warm.position.set(0.9, 1.3, 0);
  depot.add(warm);
  for (const [px, pz, rot] of [
    [0.72, -0.5, Math.PI / 2],
    [0.72, 0.45, Math.PI / 2],
  ]) {
    const t = makeTruck(0xf5b301);
    t.position.set(px, 0.06, pz);
    t.rotation.y = rot;
    t.scale.setScalar(0.9);
    depot.add(t);
  }
  depot.position.set(dx, 0, dz);
  depot.scale.setScalar(1.3);
  scene.add(depot);

  /* prédios e árvores */
  const boxes = [];
  const trees = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === DEP.i && j === DEP.j) continue;
      const bx = blockAt(i);
      const bz = blockAt(j);
      const park = rand() < 0.1;
      const center = 1 - Math.hypot(i - N / 2, j - N / 2) / (N * 0.75);
      const split = rand() < 0.5 ? 2 : 3;
      const cell = (BLOCK - 0.2) / split;
      for (let a = 0; a < split; a++) {
        for (let b = 0; b < split; b++) {
          const cx = bx + 0.1 + cell * (a + 0.5);
          const cz = bz + 0.1 + cell * (b + 0.5);
          if (park || rand() < 0.12) {
            trees.push([cx + (rand() - 0.5) * 0.3, cz + (rand() - 0.5) * 0.3, 0.7 + rand() * 0.5]);
            continue;
          }
          const w = cell * (0.72 + rand() * 0.2);
          const d = cell * (0.72 + rand() * 0.2);
          const h =
            0.28 + rand() * 0.55 + Math.max(0, center) * rand() * 0.75 + (rand() < 0.05 ? 0.9 : 0);
          boxes.push({ x: cx, z: cz, w, d, h, uo: rand(), vo: rand() });
        }
      }
      // árvores na calçada
      for (let k = 0; k < 3; k++) {
        if (rand() < 0.55) {
          const side = Math.floor(rand() * 4);
          const t = 0.2 + rand() * (BLOCK - 0.4);
          const pos =
            side === 0
              ? [bx + t, bz + 0.08]
              : side === 1
                ? [bx + t, bz + BLOCK - 0.08]
                : side === 2
                  ? [bx + 0.08, bz + t]
                  : [bx + BLOCK - 0.08, bz + t];
          trees.push([pos[0], pos[1], 0.55 + rand() * 0.3]);
        }
      }
    }
  }
  const { map, emissiveMap } = windowTextures(rand);
  const geo = buildingGeometry(boxes);
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map,
    emissive: 0xffffff,
    emissiveMap,
    emissiveIntensity: 0.85,
    roughness: 0.85,
    metalness: 0.1,
  });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x3a4862, roughness: 0.85 });
  scene.add(new THREE.Mesh(geo.sides, sideMat), new THREE.Mesh(geo.tops, topMat));

  const treeMesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.2, 1),
    new THREE.MeshStandardMaterial({ color: 0x1c4a30, roughness: 0.9, flatShading: true }),
    trees.length,
  );
  trees.forEach(([x, z, s], k) => {
    m.compose(
      new THREE.Vector3(x, 0.06 + 0.2 * s, z),
      q.identity(),
      new THREE.Vector3(s, s * 1.1, s),
    );
    treeMesh.setMatrixAt(k, m);
  });
  scene.add(treeMesh);

  /* rotas neon */
  const dash = dashTexture();
  const ROUTES = [
    {
      kind: "entrega",
      grid: [
        [1, 3],
        [1, 5],
        [3, 5],
        [3, 6],
      ],
      pins: [
        [3, 6, "entrega"],
        [1, 5, "entrega"],
      ],
      truck: 0x2ee66b,
    },
    {
      kind: "coleta",
      grid: [
        [1, 2],
        [4, 2],
        [4, 4],
        [5, 4],
      ],
      pins: [[5, 4, "coleta"]],
      truck: 0x3b8bff,
    },
    {
      kind: "rota",
      grid: [
        [1, 3],
        [5, 3],
        [5, 5],
        [6, 5],
        [6, 6],
      ],
      pins: [
        [6, 6, "rota"],
        [5, 5, "rota"],
      ],
      truck: 0xf5b301,
    },
    {
      kind: "atraso",
      grid: [
        [4, 2],
        [6, 2],
        [6, 0],
      ],
      pins: [[6, 0, "atraso"]],
      truck: 0xff3b4e,
    },
    {
      kind: "entrega",
      grid: [
        [1, 2],
        [1, 0],
        [3, 0],
      ],
      pins: [[3, 0, "entrega"]],
      truck: 0x2ee66b,
    },
  ];
  const flows = [];
  const pins = [];
  const trucks = [];
  ROUTES.forEach((r, idx) => {
    const path = streetPath(r.grid);
    const color = new THREE.Color(COLORS[r.kind]);
    const len = path.getLength();
    const segs = Math.max(40, Math.round(len * 14));
    const core = new THREE.Mesh(
      new THREE.TubeGeometry(path, segs, 0.045, 8, false),
      new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.35) }),
    );
    const halo = new THREE.Mesh(
      new THREE.TubeGeometry(path, segs, 0.12, 8, false),
      new THREE.MeshBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
    );
    const flowTex = dash.clone();
    flowTex.needsUpdate = true;
    flowTex.repeat.set(Math.max(1, Math.round(len / 1.6)), 1);
    const flow = new THREE.Mesh(
      new THREE.TubeGeometry(path, segs, 0.07, 8, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff).lerp(color, 0.55).multiplyScalar(1.6),
        alphaMap: flowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    scene.add(halo, core, flow);
    flows.push({ tex: flowTex, speed: 0.55 + (idx % 3) * 0.12 });
    for (const [i, j, kind] of r.pins) {
      const p = makePin(kind);
      p.group.position.set(streetAt(i), 0, streetAt(j));
      p.group.scale.setScalar(1.25);
      p.phase = rand() * Math.PI * 2;
      scene.add(p.group);
      pins.push(p);
    }
    const truck = makeTruck(r.truck);
    scene.add(truck);
    trucks.push({ obj: truck, path, len, t: rand(), speed: 1.1 + rand() * 0.4 });
  });

  /* pós-processamento: brilho (bloom) */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.7, 0.45, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* câmera e tamanho */
  const target = new THREE.Vector3(-0.4, 0, 0.2);
  let aspect = 1;
  let az = Math.PI / 4;
  const EL = 0.8; // ~46° de inclinação, perto do isométrico
  function place(extraAz = 0) {
    target.set(aspect < 1.2 ? -2.2 : -0.2, 0, aspect < 1.2 ? -1.2 : 0.4);
    const narrow = Math.min(aspect, 2.2);
    const dist =
      aspect < 1.2 ? 33 / Math.max(0.85, Math.pow(narrow, 0.5)) : 37 / Math.pow(narrow, 0.5);
    const a = az + extraAz;
    camera.position.set(
      target.x + Math.cos(EL) * Math.cos(a) * dist,
      target.y + Math.sin(EL) * dist,
      target.z + Math.cos(EL) * Math.sin(a) * dist,
    );
    camera.lookAt(target);
  }
  function resize() {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    place();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(box);

  /* animação */
  let raf = 0;
  let visible = true;
  let last = performance.now();
  let time = 0;
  const tmp = new THREE.Vector3();
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    for (const f of flows) f.tex.offset.x -= dt * f.speed;
    for (const p of pins) {
      p.bob.position.y = Math.sin(time * 1.6 + p.phase) * 0.08;
      const k = (time * 0.6 + p.phase / 6) % 1;
      p.ring.scale.setScalar(1 + k * 2.4);
      p.ring.material.opacity = 1 - k;
    }
    for (const tr of trucks) {
      tr.t = (tr.t + (dt * tr.speed) / tr.len) % 1;
      const u = tr.t;
      tr.path.getPointAt(u, tmp);
      tr.obj.position.set(tmp.x, 0.06, tmp.z);
      const ahead = tr.path.getPointAt(Math.min(1, u + 0.01));
      if (ahead.distanceToSquared(tmp) > 1e-6) tr.obj.lookAt(ahead.x, 0.06, ahead.z);
    }
    place(Math.sin(time * 0.12) * 0.1);
    composer.render(dt);
    if (visible && !document.hidden && !reduceMotion) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf || reduceMotion) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  // primeiro quadro (e único, se "reduzir movimento" estiver ativo)
  frame(performance.now());
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) start();
  });
  io.observe(box);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && visible) start();
  });
  box.classList.add("is-ready");
  return {
    renderer,
    scene,
    camera,
    pins: pins.length,
    trucks: trucks.length,
    routes: ROUTES.length,
  };
}
