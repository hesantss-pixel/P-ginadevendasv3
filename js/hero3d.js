// Cena 3D do topo: notebook e celular modelados em código, com o painel do ROTAV3 na tela.
import * as THREE from "../vendor/three.module.min.js";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";
import {
  loadAssets,
  createLaptopPainter,
  createPhonePainter,
  createKeyboardCanvas,
} from "./screens.js";

const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2,
    y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function shapeGeometry(w, h, r) {
  const g = new THREE.ShapeGeometry(roundedRectShape(w, h, r), 8);
  const pos = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++)
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  return g;
}
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,.55)");
  g.addColorStop(0.5, "rgba(0,0,0,.25)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export async function initHero(canvas, container, { reduceMotion = false } = {}) {
  const assets = await loadAssets();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environmentIntensity = 0.7;

  const sun = new THREE.DirectionalLight(0xffc48a, 1.6);
  sun.position.set(6, 4, -3);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9fbaff, 0.5);
  fill.position.set(-5, 3, 6);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x1a2a44, 0.6));

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const makeTex = (cnv) => {
    const t = new THREE.CanvasTexture(cnv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, maxAniso);
    return t;
  };

  const rig = new THREE.Group();
  scene.add(rig);
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0x2a2e35,
    metalness: 0.88,
    roughness: 0.38,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x050608,
    roughness: 0.22,
    metalness: 0.1,
  });

  /* ---- notebook ---- */
  const laptop = new THREE.Group();
  rig.add(laptop);
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.1, 2.15, 4, 0.045), metal);
  base.position.y = 0.05;
  laptop.add(base);
  const kbTex = makeTex(createKeyboardCanvas());
  const kb = new THREE.Mesh(
    new THREE.PlaneGeometry(2.86, 1.06),
    new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.7, metalness: 0.2 }),
  );
  kb.rotation.x = -Math.PI / 2;
  kb.position.set(0, 0.1012, -0.3);
  laptop.add(kb);
  const pad = new THREE.Mesh(
    shapeGeometry(1.15, 0.68, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x4a505a, roughness: 0.32, metalness: 0.7 }),
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, 0.1012, 0.6);
  laptop.add(pad);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.1, -1.04);
  laptop.add(hinge);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.08, 0.065, 4, 0.03), metal);
  lid.position.set(0, 1.04, -0.033);
  hinge.add(lid);
  const bezel = new THREE.Mesh(shapeGeometry(3.14, 2.02, 0.07), black);
  bezel.position.set(0, 1.04, 0.0015);
  hinge.add(bezel);
  const laptopPainter = createLaptopPainter(assets);
  laptopPainter.paint(reduceMotion ? 1 : 0);
  const laptopTex = makeTex(laptopPainter.canvas);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.98, 1.8625),
    new THREE.MeshBasicMaterial({ map: laptopTex, toneMapped: false }),
  );
  screen.position.set(0, 1.07, 0.003);
  hinge.add(screen);
  const glare = new THREE.Mesh(
    new THREE.PlaneGeometry(2.98, 1.8625),
    new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.1,
      clearcoat: 1,
    }),
  );
  glare.position.set(0, 1.07, 0.004);
  hinge.add(glare);
  const cam = new THREE.Mesh(
    new THREE.CircleGeometry(0.018, 16),
    new THREE.MeshBasicMaterial({ color: 0x1b2330 }),
  );
  cam.position.set(0, 2.025, 0.004);
  hinge.add(cam);

  const shadowTex = shadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
  });
  const lShadow = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.4), shadowMat);
  lShadow.rotation.x = -Math.PI / 2;
  lShadow.position.y = -0.002;
  laptop.add(lShadow);

  /* ---- celular ---- */
  const phone = new THREE.Group();
  rig.add(phone);
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(1.0, 2.04, 0.09, 6, 0.14),
    new THREE.MeshPhysicalMaterial({
      color: 0x2c313a,
      metalness: 0.95,
      roughness: 0.28,
      clearcoat: 0.4,
    }),
  );
  body.position.y = 1.02;
  phone.add(body);
  const front = new THREE.Mesh(shapeGeometry(0.97, 2.01, 0.13), black);
  front.position.set(0, 1.02, 0.0455);
  phone.add(front);
  const phonePainter = createPhonePainter(assets);
  phonePainter.paint(reduceMotion ? 1 : 0);
  const phoneTex = makeTex(phonePainter.canvas);
  const pScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.91, (0.91 * 1240) / 600),
    new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false, transparent: true }),
  );
  pScreen.position.set(0, 1.02, 0.047);
  phone.add(pScreen);
  const pShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), shadowMat);
  pShadow.rotation.x = -Math.PI / 2;
  pShadow.position.set(0, -0.002, 0.05);
  phone.add(pShadow);

  /* ---- posição e câmera ---- */
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const layout = { laptopRot: 0.24, phonePos: new THREE.Vector3(2.2, 0, 0.85), phoneRot: -0.14 };
  laptop.rotation.y = layout.laptopRot;
  phone.position.copy(layout.phonePos);
  phone.rotation.set(-0.05, layout.phoneRot, 0);
  const target = new THREE.Vector3(0.75, 0.95, 0.15);

  let w = 0,
    h = 0;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // enquadra os dois aparelhos: quanto mais estreita a área, mais longe a câmera
    const narrow = w < 720;
    let dist = camera.aspect >= 1.35 ? 7.1 : 7.1 * (1.35 / camera.aspect) ** 0.85;
    if (narrow) dist = Math.max(dist, 7.6 + (720 - w) / 260);
    camera.position.set(target.x - 0.6, target.y + 1.55, dist);
    camera.lookAt(target.x, target.y - (narrow ? 0.28 : 0), target.z);
    camera.updateProjectionMatrix();
    rig.position.x = narrow ? 0.12 : camera.aspect >= 1.35 ? 0.3 : 0;
    requestRender();
  }

  /* ---- animação ---- */
  const t0 = performance.now();
  let pointer = { x: 0, y: 0 },
    smooth = { x: 0, y: 0 };
  let visible = true,
    running = false,
    needsRender = true,
    introDone = reduceMotion;
  if (reduceMotion) {
    hinge.rotation.x = -0.2;
  } else {
    hinge.rotation.x = 1.15;
    rig.position.y = -0.25;
  }

  function frame(now) {
    running = false;
    if (!visible || document.hidden) return;
    const t = (now - t0) / 1000;
    if (!introDone) {
      const a = ease(t / 1.3);
      hinge.rotation.x = 1.15 + (-0.2 - 1.15) * a;
      rig.position.y = -0.25 * (1 - ease(t / 1.1));
      const p = ease((t - 1.0) / 1.4);
      laptopPainter.paint(p);
      laptopTex.needsUpdate = true;
      phonePainter.paint(ease((t - 1.3) / 1.2));
      phoneTex.needsUpdate = true;
      if (t > 2.6) {
        introDone = true;
        laptopPainter.paint(1);
        phonePainter.paint(1);
        laptopTex.needsUpdate = phoneTex.needsUpdate = true;
      }
    }
    if (!reduceMotion) {
      smooth.x += (pointer.x - smooth.x) * 0.06;
      smooth.y += (pointer.y - smooth.y) * 0.06;
      rig.rotation.y = smooth.x * 0.14 + Math.sin(t * 0.35) * 0.02;
      rig.rotation.x = smooth.y * 0.05;
      if (introDone) rig.position.y = Math.sin(t * 0.9) * 0.025;
      phone.position.y = layout.phonePos.y + Math.sin(t * 1.1 + 1) * 0.03;
    }
    renderer.render(scene, camera);
    needsRender = false;
    if (!reduceMotion) loop();
  }
  function loop() {
    if (!running) {
      running = true;
      requestAnimationFrame(frame);
    }
  }
  function requestRender() {
    needsRender = true;
    loop();
  }

  if (!reduceMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
  }
  new IntersectionObserver((en) => {
    visible = en[0].isIntersecting;
    if (visible) loop();
  }).observe(container);
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
  renderer.render(scene, camera);
  container.classList.add("is-ready");
  function finishIntro() {
    introDone = true;
    hinge.rotation.x = -0.2;
    rig.position.y = 0;
    laptopPainter.paint(1);
    phonePainter.paint(1);
    laptopTex.needsUpdate = phoneTex.needsUpdate = true;
    requestRender();
  }
  // garantia: mesmo em aparelhos lentos (poucos quadros por segundo) a tela termina completa
  if (!reduceMotion)
    setTimeout(() => {
      if (!introDone) finishIntro();
      else {
        phonePainter.paint(1);
        laptopPainter.paint(1);
        laptopTex.needsUpdate = phoneTex.needsUpdate = true;
        requestRender();
      }
    }, 3400);
  return { renderer, scene, camera, finishIntro };
}
