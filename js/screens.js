// Desenha (em canvas 2D) as telas do notebook e do celular usadas como textura na cena 3D.
// Todo o conteúdo é demonstrativo.
import { generateMap, drawMapCanvas, streetPath, tracePath } from "./mapgen.js";

const FONT =
  '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const C = {
  navy: "#0b1a2e",
  navy2: "#12263f",
  bg: "#f3f6f9",
  white: "#ffffff",
  ink: "#0b1b33",
  muted: "#64748b",
  line: "#e2e8ef",
  gold: "#fcc03e",
  blue: "#2f6fe4",
  green: "#1f9d68",
  red: "#e5484d",
  amber: "#f5a922",
  purple: "#7c5cc4",
};

let assetsPromise = null;
export function loadAssets() {
  if (!assetsPromise) {
    assetsPromise = (async () => {
      try {
        await Promise.all(
          ["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 20px Inter`)),
        );
      } catch {
        /* usa fonte do sistema */
      }
      const logo = new Image();
      logo.src = new URL("../img/logo-rotav3.png", import.meta.url).href;
      try {
        await logo.decode();
      } catch {
        /* sem logo */
      }
      return { logo: logo.naturalWidth ? logo : null };
    })();
  }
  return assetsPromise;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(ctx, s, x, y, size, weight = 500, color = C.ink, align = "left") {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
}
function pin(ctx, x, y, color, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.shadowColor = "rgba(11,27,51,.28)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-4, -8, -12, -14, -12, -24);
  ctx.arc(0, -24, 12, Math.PI, 0);
  ctx.bezierCurveTo(12, -14, 4, -8, 0, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -24, 4.6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
}
function icon(ctx, kind, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 24, s / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  switch (kind) {
    case "grid":
      ctx.rect(4, 4, 7, 7);
      ctx.rect(13, 4, 7, 7);
      ctx.rect(4, 13, 7, 7);
      ctx.rect(13, 13, 7, 7);
      break;
    case "box":
      ctx.moveTo(12, 3);
      ctx.lineTo(20, 7.5);
      ctx.lineTo(20, 16.5);
      ctx.lineTo(12, 21);
      ctx.lineTo(4, 16.5);
      ctx.lineTo(4, 7.5);
      ctx.closePath();
      ctx.moveTo(4, 7.5);
      ctx.lineTo(12, 12);
      ctx.lineTo(20, 7.5);
      ctx.moveTo(12, 12);
      ctx.lineTo(12, 21);
      break;
    case "route":
      ctx.arc(6, 18, 2.4, 0, 7);
      ctx.moveTo(20.4, 6);
      ctx.arc(18, 6, 2.4, 0, 7);
      ctx.moveTo(8.4, 18);
      ctx.lineTo(15, 18);
      ctx.arc(15, 14.6, 3.4, Math.PI / 2, -Math.PI / 2, true);
      ctx.lineTo(9, 11.2);
      ctx.arc(9, 7.8, 3.4, Math.PI / 2, -Math.PI / 2);
      ctx.lineTo(15.6, 4.4);
      break;
    case "map":
      ctx.moveTo(3, 6.5);
      ctx.lineTo(9, 4);
      ctx.lineTo(15, 6.5);
      ctx.lineTo(21, 4);
      ctx.lineTo(21, 17.5);
      ctx.lineTo(15, 20);
      ctx.lineTo(9, 17.5);
      ctx.lineTo(3, 20);
      ctx.closePath();
      ctx.moveTo(9, 4);
      ctx.lineTo(9, 17.5);
      ctx.moveTo(15, 6.5);
      ctx.lineTo(15, 20);
      break;
    case "truck":
      ctx.rect(2.5, 6.5, 11, 10);
      ctx.moveTo(13.5, 9.8);
      ctx.lineTo(17.5, 9.8);
      ctx.lineTo(20.5, 13.4);
      ctx.lineTo(20.5, 16.5);
      ctx.lineTo(13.5, 16.5);
      ctx.moveTo(8.6, 17.6);
      ctx.arc(6.8, 17.6, 1.8, 0, 7);
      ctx.moveTo(18.8, 17.6);
      ctx.arc(17, 17.6, 1.8, 0, 7);
      break;
    case "user":
      ctx.arc(12, 8, 4, 0, 7);
      ctx.moveTo(4, 20);
      ctx.quadraticCurveTo(12, 11, 20, 20);
      break;
    case "spark":
      ctx.moveTo(12, 3);
      ctx.lineTo(13.8, 10.2);
      ctx.lineTo(21, 12);
      ctx.lineTo(13.8, 13.8);
      ctx.lineTo(12, 21);
      ctx.lineTo(10.2, 13.8);
      ctx.lineTo(3, 12);
      ctx.lineTo(10.2, 10.2);
      ctx.closePath();
      break;
    case "gear":
      ctx.arc(12, 12, 3.2, 0, 7);
      ctx.moveTo(19.5, 12);
      ctx.arc(12, 12, 7.5, 0, 7);
      break;
    case "pin":
      ctx.moveTo(12, 21);
      ctx.bezierCurveTo(8, 17, 5.4, 13.5, 5.4, 10);
      ctx.arc(12, 10, 6.6, Math.PI, 0);
      ctx.bezierCurveTo(18.6, 13.5, 16, 17, 12, 21);
      ctx.moveTo(14.4, 10);
      ctx.arc(12, 10, 2.4, 0, 7);
      break;
    case "search":
      ctx.arc(11, 11, 6.5, 0, 7);
      ctx.moveTo(16, 16);
      ctx.lineTo(20, 20);
      break;
    case "bell":
      ctx.moveTo(6, 16.5);
      ctx.lineTo(6, 11);
      ctx.arc(12, 11, 6, Math.PI, 0);
      ctx.lineTo(18, 16.5);
      ctx.lineTo(19.6, 18.5);
      ctx.lineTo(4.4, 18.5);
      ctx.closePath();
      break;
    case "layers":
      ctx.moveTo(12, 3.5);
      ctx.lineTo(21, 8.5);
      ctx.lineTo(12, 13.5);
      ctx.lineTo(3, 8.5);
      ctx.closePath();
      ctx.moveTo(3, 13);
      ctx.lineTo(12, 18);
      ctx.lineTo(21, 13);
      break;
  }
  ctx.stroke();
  ctx.restore();
}

// rotas do painel (coordenadas no espaço do mapa gerado)
function buildRoutes(W, H) {
  const P = (fx, fy) => [fx * W, fy * H];
  const depot = P(0.5, 0.52);
  const defs = [
    { color: C.blue, stops: [P(0.36, 0.34), P(0.27, 0.2), P(0.45, 0.12), P(0.6, 0.24)] },
    { color: C.red, stops: [P(0.66, 0.4), P(0.8, 0.3), P(0.9, 0.46), P(0.78, 0.62)] },
    { color: C.green, stops: [P(0.38, 0.62), P(0.22, 0.7), P(0.12, 0.55), P(0.2, 0.4)] },
    { color: C.amber, stops: [P(0.58, 0.7), P(0.7, 0.84), P(0.52, 0.9), P(0.4, 0.8)] },
  ];
  return {
    depot,
    routes: defs.map((d, i) => ({ ...d, path: streetPath([depot, ...d.stops], 20 + i) })),
  };
}

function drawRoutes(ctx, R, progress, scale = 1) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const r of R.routes) {
    const n = Math.max(2, Math.floor(r.path.length * Math.min(1, progress)));
    const pts = r.path.slice(0, n);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 9 * scale;
    tracePath(ctx, pts);
    ctx.stroke();
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 5.5 * scale;
    tracePath(ctx, pts);
    ctx.stroke();
  }
  for (const r of R.routes)
    r.stops.forEach((s, i) => {
      if (progress > 0.25 + i * 0.18) pin(ctx, s[0], s[1], r.color, scale);
    });
  // depósito
  const [dx, dy] = R.depot;
  ctx.fillStyle = C.navy;
  rr(ctx, dx - 15 * scale, dy - 15 * scale, 30 * scale, 30 * scale, 8 * scale);
  ctx.fill();
  ctx.fillStyle = C.gold;
  rr(ctx, dx - 6 * scale, dy - 6 * scale, 12 * scale, 12 * scale, 3 * scale);
  ctx.fill();
  ctx.restore();
}

/* ---------- Notebook: 1600 x 1000 ---------- */
export function createLaptopPainter(assets) {
  const W = 1600,
    H = 1000;
  const base = document.createElement("canvas");
  base.width = W;
  base.height = H;
  const b = base.getContext("2d");
  b.fillStyle = C.bg;
  b.fillRect(0, 0, W, H);
  // barra lateral
  b.fillStyle = C.navy;
  b.fillRect(0, 0, 250, H);
  if (assets.logo) {
    const lw = 160,
      lh = (lw * assets.logo.naturalHeight) / assets.logo.naturalWidth;
    b.drawImage(assets.logo, 34, 30, lw, lh);
  }
  const menu = [
    ["grid", "Dashboard"],
    ["box", "Pedidos"],
    ["route", "Roteirização"],
    ["layers", "Rotas"],
    ["user", "Motoristas"],
    ["map", "Mapa"],
    ["spark", "IA Assistente"],
    ["gear", "Configurações"],
  ];
  menu.forEach(([ic, label], i) => {
    const y = 132 + i * 58;
    if (i === 0) {
      b.fillStyle = "rgba(252,192,62,.13)";
      rr(b, 18, y - 26, 214, 50, 12);
      b.fill();
      b.fillStyle = C.gold;
      rr(b, 18, y - 18, 5, 34, 3);
      b.fill();
    }
    icon(b, ic, 40, y - 13, 24, i === 0 ? C.gold : "#9fb0c4");
    text(b, label, 80, y + 6, 19, i === 0 ? 600 : 500, i === 0 ? "#ffffff" : "#c3cfdc");
  });
  b.fillStyle = C.navy2;
  rr(b, 18, H - 104, 214, 76, 14);
  b.fill();
  b.fillStyle = C.gold;
  b.beginPath();
  b.arc(52, H - 66, 18, 0, 7);
  b.fill();
  text(b, "ME", 52, H - 59, 15, 700, C.navy, "center");
  text(b, "Minha Empresa", 80, H - 70, 16, 600, "#fff");
  text(b, "Operação demo", 80, H - 48, 14, 500, "#9fb0c4");
  // barra superior
  b.fillStyle = C.white;
  rr(b, 280, 24, 560, 48, 24);
  b.fill();
  b.strokeStyle = C.line;
  b.lineWidth = 2;
  b.stroke();
  icon(b, "search", 298, 36, 24, C.muted);
  text(b, "Buscar pedido, cliente ou cidade", 336, 55, 18, 400, "#94a3b8");
  b.fillStyle = "#fff4dc";
  rr(b, 1160, 30, 236, 36, 18);
  b.fill();
  b.strokeStyle = "#f2d38d";
  b.lineWidth = 2;
  b.stroke();
  text(b, "Dados demonstrativos", 1278, 54, 16, 600, "#8a5a00", "center");
  b.fillStyle = C.white;
  b.beginPath();
  b.arc(1440, 48, 24, 0, 7);
  b.fill();
  b.strokeStyle = C.line;
  b.stroke();
  icon(b, "bell", 1428, 36, 24, C.muted);
  b.fillStyle = C.gold;
  b.beginPath();
  b.arc(1510, 48, 24, 0, 7);
  b.fill();
  text(b, "ME", 1510, 55, 16, 700, C.navy, "center");
  // KPIs
  const kpis = [
    ["Pedidos", "128", "box", C.blue],
    ["Entregas", "98", "truck", C.green],
    ["Coletas", "30", "layers", C.amber],
    ["Veículos", "12", "route", C.purple],
  ];
  const kw = (1600 - 280 - 32 - 3 * 20) / 4;
  kpis.forEach(([label, val, ic, col], i) => {
    const x = 280 + i * (kw + 20),
      y = 96;
    b.fillStyle = C.white;
    rr(b, x, y, kw, 104, 16);
    b.fill();
    b.strokeStyle = C.line;
    b.lineWidth = 2;
    b.stroke();
    b.fillStyle = col + "1f";
    b.beginPath();
    b.arc(x + 46, y + 52, 26, 0, 7);
    b.fill();
    icon(b, ic, x + 33, y + 39, 26, col);
    text(b, label, x + 88, y + 42, 18, 500, C.muted);
    text(b, val, x + 88, y + 82, 34, 700, C.ink);
  });
  // painel do mapa
  const mx = 280,
    my = 222,
    mw = 890,
    mh = 746;
  b.save();
  rr(b, mx, my, mw, mh, 18);
  b.clip();
  const map = generateMap(11, mw, mh);
  drawMapCanvas(b, map, mx, my, mw, mh, 1.1);
  b.restore();
  b.strokeStyle = C.line;
  b.lineWidth = 2;
  rr(b, mx, my, mw, mh, 18);
  b.stroke();
  [
    ["Hoje", 0],
    ["Todas as rotas", 112],
  ].forEach(([s, off]) => {
    const w = s.length * 10 + 46;
    b.fillStyle = C.white;
    rr(b, mx + 18 + off, my + 18, w, 40, 12);
    b.fill();
    b.strokeStyle = C.line;
    b.stroke();
    text(b, s + "  ▾", mx + 34 + off, my + 44, 16, 600, C.ink);
  });
  // painel de rotas
  const px = 1190,
    pw = 378;
  b.fillStyle = C.white;
  rr(b, px, my, pw, mh, 18);
  b.fill();
  b.strokeStyle = C.line;
  b.stroke();
  text(b, "Rotas geradas", px + 26, my + 50, 22, 700, C.ink);
  text(b, "Hoje", px + pw - 26, my + 50, 16, 500, C.muted, "right");
  const rotas = [
    ["Rota 1 · Centro", "12 paradas · Fiorino", 412, 650, C.blue],
    ["Rota 2 · Zona Sul", "14 paradas · HR", 1180, 1500, C.red],
    ["Rota 3 · Zona Oeste", "9 paradas · Fiorino", 298, 650, C.green],
    ["Rota 4 · Guarulhos", "16 paradas · VUC", 2540, 3000, C.amber],
  ];
  rotas.forEach(([t, s, kg, cap, col], i) => {
    const y = my + 84 + i * 142;
    b.fillStyle = "#f7f9fb";
    rr(b, px + 16, y, pw - 32, 126, 14);
    b.fill();
    b.fillStyle = col;
    b.beginPath();
    b.arc(px + 48, y + 38, 18, 0, 7);
    b.fill();
    text(b, String(i + 1), px + 48, y + 45, 17, 700, "#fff", "center");
    text(b, t, px + 78, y + 34, 18, 600, C.ink);
    text(b, s, px + 78, y + 58, 15, 500, C.muted);
    const pct = kg / cap;
    text(b, `${kg.toLocaleString("pt-BR")} kg`, px + pw - 32, y + 34, 16, 600, C.ink, "right");
    b.fillStyle = "#e3e9f0";
    rr(b, px + 32, y + 86, pw - 64, 10, 5);
    b.fill();
    b.fillStyle = col;
    rr(b, px + 32, y + 86, (pw - 64) * pct, 10, 5);
    b.fill();
    text(b, `${Math.round(pct * 100)}% da capacidade`, px + 32, y + 116, 14, 500, C.muted);
  });
  b.fillStyle = C.gold;
  rr(b, px + 16, my + mh - 70, pw - 32, 52, 14);
  b.fill();
  text(b, "Roteirizar pedidos", px + pw / 2, my + mh - 37, 18, 700, C.navy, "center");

  const R = buildRoutes(mw, mh);
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const o = out.getContext("2d");
  return {
    canvas: out,
    paint(progress = 1) {
      o.drawImage(base, 0, 0);
      o.save();
      rr(o, mx, my, mw, mh, 18);
      o.clip();
      o.translate(mx, my);
      drawRoutes(o, R, progress, 1.1);
      o.restore();
    },
  };
}

/* ---------- Celular: 600 x 1240 ---------- */
export function createPhonePainter(assets) {
  const W = 600,
    H = 1240,
    RAD = 74;
  const base = document.createElement("canvas");
  base.width = W;
  base.height = H;
  const b = base.getContext("2d");
  b.save();
  rr(b, 0, 0, W, H, RAD);
  b.clip();
  b.fillStyle = C.bg;
  b.fillRect(0, 0, W, H);
  // cabeçalho
  b.fillStyle = C.navy;
  b.fillRect(0, 0, W, 190);
  text(b, "9:41", 64, 66, 26, 600, "#fff");
  b.fillStyle = "#fff";
  [0, 1, 2, 3].forEach((i) => b.fillRect(470 + i * 10, 58 - i * 5, 6, 8 + i * 5));
  rr(b, 520, 46, 40, 20, 5);
  b.strokeStyle = "#fff";
  b.lineWidth = 2;
  b.stroke();
  b.fillRect(524, 50, 28, 12);
  if (assets.logo) {
    const lw = 150,
      lh = (lw * assets.logo.naturalHeight) / assets.logo.naturalWidth;
    b.drawImage(assets.logo, 40, 110, lw, lh);
  }
  b.fillStyle = "rgba(255,255,255,.1)";
  b.beginPath();
  b.arc(536, 132, 26, 0, 7);
  b.fill();
  icon(b, "bell", 523, 119, 26, "#fff");
  // mapa
  const my = 190,
    mh = 560;
  const map = generateMap(23, W, mh);
  drawMapCanvas(b, map, 0, my, W, mh, 1.4);
  // folha inferior
  b.shadowColor = "rgba(11,27,51,.18)";
  b.shadowBlur = 30;
  b.shadowOffsetY = -6;
  b.fillStyle = C.white;
  rr(b, 0, 700, W, H - 700 + 80, 40);
  b.fill();
  b.shadowColor = "transparent";
  b.fillStyle = "#d5dce5";
  rr(b, W / 2 - 40, 718, 80, 8, 4);
  b.fill();
  text(b, "Rota 1 · Centro", 40, 784, 32, 700, C.ink);
  text(b, "12 paradas · 412 kg · 2h 15min", 40, 822, 21, 500, C.muted);
  b.fillStyle = "#e3e9f0";
  rr(b, 40, 848, W - 80, 12, 6);
  b.fill();
  b.fillStyle = C.blue;
  rr(b, 40, 848, (W - 80) * 0.63, 12, 6);
  b.fill();
  text(b, "63% da capacidade", 40, 888, 18, 500, C.muted);
  const stops = [
    ["#1021 · São Paulo", "Entrega · 4 volumes · 58,4 kg", C.blue],
    ["#2031 · Barueri", "Coleta · 5 volumes · 72,0 kg", C.green],
  ];
  stops.forEach(([t, s, col], i) => {
    const y = 924 + i * 92;
    b.fillStyle = "#f5f7fa";
    rr(b, 32, y, W - 64, 78, 18);
    b.fill();
    b.fillStyle = col;
    b.beginPath();
    b.arc(76, y + 39, 20, 0, 7);
    b.fill();
    text(b, String(i + 1), 76, y + 47, 19, 700, "#fff", "center");
    text(b, t, 112, y + 34, 21, 600, C.ink);
    text(b, s, 112, y + 60, 17, 500, C.muted);
  });
  text(b, "+ 10 paradas nesta rota", 40, 1146, 18, 600, C.blue);
  // barra de navegação
  b.fillStyle = C.white;
  b.fillRect(0, H - 110, W, 110);
  b.fillStyle = C.line;
  b.fillRect(0, H - 110, W, 2);
  ["grid", "route", "map", "user"].forEach((ic, i) =>
    icon(b, ic, 78 + i * 136, H - 84, 34, i === 1 ? C.gold : "#94a3b8"),
  );
  b.fillStyle = "#0b1b33";
  rr(b, W / 2 - 80, H - 20, 160, 7, 4);
  b.fill();
  b.restore();
  // ilha (câmera)
  b.fillStyle = "#000";
  rr(b, W / 2 - 74, 26, 148, 44, 22);
  b.fill();

  const R = (() => {
    const P = (fx, fy) => [fx * W, fy * mh];
    const depot = P(0.5, 0.62);
    const defs = [
      { color: C.blue, stops: [P(0.3, 0.42), P(0.42, 0.2), P(0.68, 0.28)] },
      { color: C.green, stops: [P(0.24, 0.72), P(0.12, 0.5)] },
      { color: C.red, stops: [P(0.78, 0.56), P(0.88, 0.3)] },
    ];
    return {
      depot,
      routes: defs.map((d, i) => ({ ...d, path: streetPath([depot, ...d.stops], 40 + i) })),
    };
  })();
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const o = out.getContext("2d");
  return {
    canvas: out,
    paint(progress = 1) {
      o.clearRect(0, 0, W, H);
      o.drawImage(base, 0, 0);
      o.save();
      o.beginPath();
      o.rect(0, my, W, 700 - my);
      o.clip();
      o.translate(0, my);
      drawRoutes(o, R, progress, 1.5);
      o.restore();
    },
  };
}

/* ---------- Teclado do notebook ---------- */
export function createKeyboardCanvas() {
  const W = 1024,
    H = 380;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#1a1d22";
  x.fillRect(0, 0, W, H);
  const rows = [14, 14, 13, 12, 10];
  const kh = 58,
    gap = 10;
  rows.forEach((n, r) => {
    const y = 18 + r * (kh + gap);
    const kw = (W - 36 - (n - 1) * gap) / n;
    for (let i = 0; i < n; i++) {
      x.fillStyle = "#0c0e11";
      rr(x, 18 + i * (kw + gap), y, kw, r === 4 && i === 4 ? kh : kh, 8);
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.05)";
      x.lineWidth = 1.5;
      x.stroke();
    }
  });
  return c;
}
