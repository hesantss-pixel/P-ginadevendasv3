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
    case "bot":
      ctx.rect(5, 8, 14, 11);
      ctx.moveTo(12, 8);
      ctx.lineTo(12, 5);
      ctx.moveTo(13.2, 3.8);
      ctx.arc(12, 3.8, 1.2, 0, 7);
      ctx.moveTo(10.2, 12.6);
      ctx.arc(9.4, 12.6, 0.8, 0, 7);
      ctx.moveTo(15.4, 12.6);
      ctx.arc(14.6, 12.6, 0.8, 0, 7);
      ctx.moveTo(9.5, 16);
      ctx.lineTo(14.5, 16);
      ctx.moveTo(5, 11.5);
      ctx.lineTo(3, 11.5);
      ctx.lineTo(3, 15.5);
      ctx.lineTo(5, 15.5);
      ctx.moveTo(19, 11.5);
      ctx.lineTo(21, 11.5);
      ctx.lineTo(21, 15.5);
      ctx.lineTo(19, 15.5);
      break;
    case "calendar":
      ctx.rect(4, 5.5, 16, 14.5);
      ctx.moveTo(4, 10);
      ctx.lineTo(20, 10);
      ctx.moveTo(8, 3.5);
      ctx.lineTo(8, 7.5);
      ctx.moveTo(16, 3.5);
      ctx.lineTo(16, 7.5);
      break;
    case "clock":
      ctx.arc(12, 12, 8.5, 0, 7);
      ctx.moveTo(12, 7.5);
      ctx.lineTo(12, 12);
      ctx.lineTo(15.5, 14);
      break;
    case "chevR":
      ctx.moveTo(9, 5);
      ctx.lineTo(16, 12);
      ctx.lineTo(9, 19);
      break;
    case "chevD":
      ctx.moveTo(5, 9);
      ctx.lineTo(12, 16);
      ctx.lineTo(19, 9);
      break;
    case "arrowR":
      ctx.moveTo(4, 12);
      ctx.lineTo(20, 12);
      ctx.moveTo(14, 6);
      ctx.lineTo(20, 12);
      ctx.lineTo(14, 18);
      break;
    case "plus":
      ctx.moveTo(12, 5);
      ctx.lineTo(12, 19);
      ctx.moveTo(5, 12);
      ctx.lineTo(19, 12);
      break;
    case "minus":
      ctx.moveTo(5, 12);
      ctx.lineTo(19, 12);
      break;
    case "bars":
      ctx.rect(4, 12, 4, 8);
      ctx.rect(10, 4, 4, 16);
      ctx.rect(16, 9, 4, 11);
      break;
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- Dados DEMONSTRATIVOS das telas (nada aqui é real) ----------
const KIND = {
  entrega: { color: C.green, label: "Entrega" },
  coleta: { color: C.blue, label: "Coleta" },
};
const DEMO_ROUTES = [
  ["Rota 1 - Guarulhos", "12 paradas · 48,2 km", C.blue],
  ["Rota 2 - Zona Norte", "11 paradas · 42,7 km", C.green],
  ["Rota 3 - Centro", "10 paradas · 36,4 km", C.amber],
  ["Rota 4 - Zona Leste", "9 paradas · 38,9 km", C.purple],
  ["Rota 5 - Zona Sul", "8 paradas · 31,6 km", C.red],
];
const DEMO_STOPS = [
  { kind: "coleta", id: "#2031", area: "Centro", vol: 5, kg: 72.0 },
  { kind: "entrega", id: "#1021", area: "Vila Galvão", vol: 4, kg: 58.4 },
  { kind: "entrega", id: "#1022", area: "Macedo", vol: 2, kg: 22.0 },
  { kind: "coleta", id: "#2032", area: "Cumbica", vol: 3, kg: 34.8 },
  { kind: "entrega", id: "#1023", area: "Picanço", vol: 6, kg: 87.2 },
];
const DEMO_VEHICLES = [
  ["Fiorino · Veículo 1", "Rota 1 - Guarulhos", 72],
  ["VUC · Veículo 2", "Rota 2 - Zona Norte", 64],
  ["Toco · Veículo 3", "Rota 3 - Centro", 58],
  ["Fiorino · Veículo 4", "Rota 4 - Zona Leste", 46],
  ["Sprinter · Veículo 5", "Rota 5 - Zona Sul", 32],
];
const DEMO_REGIONS = [
  ["Guarulhos", 38],
  ["Itaim", 16],
  ["Outras Cidades", 4],
  ["Santos", 2],
  ["São Paulo", 2],
  ["Guarujá", 1],
  ["Praia Grande", 1],
  ["Sorocaba", 1],
];
const kgBR = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";

function card(b, x, y, w, h, r = 12) {
  b.fillStyle = C.white;
  rr(b, x, y, w, h, r);
  b.fill();
  b.strokeStyle = "#e4e9f0";
  b.lineWidth = 1.3;
  b.stroke();
}
function chip(b, x, y, label, { active = false, dot = null } = {}) {
  b.font = `600 13px ${FONT}`;
  const w = b.measureText(label).width + (dot ? 42 : 30);
  b.fillStyle = active ? "#12305a" : "#f1f4f8";
  rr(b, x, y, w, 31, 15.5);
  b.fill();
  if (dot) {
    b.fillStyle = dot;
    b.beginPath();
    b.arc(x + 16, y + 15.5, 4, 0, 7);
    b.fill();
  }
  text(
    b,
    label,
    dot ? x + 28 : x + w / 2,
    y + 20.5,
    13,
    active ? 600 : 500,
    active ? "#fff" : C.ink,
    dot ? "left" : "center",
  );
  return w;
}
function linkText(b, label, xRight, y) {
  icon(b, "arrowR", xRight - 13, y - 11, 13, C.muted);
  text(b, label, xRight - 19, y, 12, 500, C.muted, "right");
}
function cardHeader(b, ic, title, x, y) {
  icon(b, ic, x + 16, y + 14, 22, "#33455f");
  text(b, title, x + 46, y + 31, 15, 600, C.ink);
}

// rotas do mapa (coordenadas no espaço do mapa gerado)
function buildRoutes(W, H) {
  const P = (fx, fy) => [fx * W, fy * H];
  const depot = P(0.5, 0.5);
  const B = C.blue,
    G = C.green;
  const defs = [
    {
      color: C.blue,
      pinColors: [B, G, G, G],
      stops: [P(0.36, 0.3), P(0.27, 0.15), P(0.45, 0.1), P(0.6, 0.2)],
    },
    {
      color: C.red,
      pinColors: [B, G, G, G],
      stops: [P(0.66, 0.36), P(0.8, 0.26), P(0.9, 0.44), P(0.78, 0.6)],
    },
    {
      color: C.green,
      pinColors: [B, G, G, G],
      stops: [P(0.38, 0.62), P(0.22, 0.72), P(0.1, 0.54), P(0.2, 0.38)],
    },
    {
      color: C.amber,
      pinColors: [B, G, G],
      stops: [P(0.58, 0.72), P(0.72, 0.86), P(0.5, 0.9)],
    },
    {
      color: C.purple,
      pinColors: [G, G],
      stops: [P(0.82, 0.78), P(0.94, 0.62)],
    },
  ];
  return {
    depot,
    routes: defs.map((d, i) => ({ ...d, path: streetPath([depot, ...d.stops], 20 + i) })),
  };
}

function drawRoutes(ctx, R, progress, scale = 1, pinScale = scale) {
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
      if (progress > 0.25 + i * 0.18)
        pin(ctx, s[0], s[1], r.pinColors ? r.pinColors[i] : r.color, pinScale);
    });
  // depósito
  const [dx, dy] = R.depot;
  ctx.fillStyle = C.navy;
  rr(ctx, dx - 15 * pinScale, dy - 15 * pinScale, 30 * pinScale, 30 * pinScale, 8 * pinScale);
  ctx.fill();
  ctx.fillStyle = C.gold;
  rr(ctx, dx - 6 * pinScale, dy - 6 * pinScale, 12 * pinScale, 12 * pinScale, 3 * pinScale);
  ctx.fill();
  ctx.restore();
}

/* ---------- Notebook: 1600 x 1000 ----------
   O desenho segue o dashboard de referência (1536 x 1024) com escala uniforme; a largura que
   sobra é dividida entre os painéis. Tudo abaixo é desenhado em "unidades da referência". */
export function createLaptopPainter(assets) {
  const W = 1600,
    H = 1000;
  const S = H / 1024;
  const RW = W / S;
  const base = document.createElement("canvas");
  base.width = W;
  base.height = H;
  const b = base.getContext("2d");
  b.scale(S, S);
  b.fillStyle = "#f4f6fa";
  b.fillRect(0, 0, RW, 1024);

  // barra lateral
  const sg = b.createLinearGradient(0, 0, 0, 1024);
  sg.addColorStop(0, "#0d1b2c");
  sg.addColorStop(1, "#112238");
  b.fillStyle = sg;
  b.fillRect(0, 0, 260, 1024);
  if (assets.logo) {
    const lw = 190,
      lh = (lw * assets.logo.naturalHeight) / assets.logo.naturalWidth;
    b.drawImage(assets.logo, 28, 48 - lh / 2, lw, lh);
  }
  const menu = [
    ["grid", "Dashboard", 111],
    ["box", "Pedidos", 167],
    ["route", "Roteirização", 221],
    ["pin", "Rotas", 275],
    ["map", "Mapa", 329],
    ["bot", "IA Assistente", 383],
  ];
  menu.forEach(([ic, label, y], i) => {
    if (i === 0) {
      b.fillStyle = "#102a4c";
      rr(b, 14, y - 26, 233, 52, 9);
      b.fill();
      b.fillStyle = "#fdce4c";
      rr(b, 13, y - 19, 4, 38, 2);
      b.fill();
    }
    icon(b, ic, 36, y - 12, 24, i === 0 ? "#ffffff" : "#d4dde9");
    text(b, label, 77, y + 6, 17.5, i === 0 ? 600 : 500, i === 0 ? "#ffffff" : "#dfe7f1");
  });

  // barra superior
  b.fillStyle = C.white;
  b.fillRect(260, 0, RW - 260, 66);
  b.fillStyle = "#e8edf3";
  b.fillRect(260, 66, RW - 260, 1.5);
  b.fillStyle = "#eef2f7";
  rr(b, 283, 15, 360, 36, 10);
  b.fill();
  icon(b, "search", 296, 24, 18, "#6b7a90");
  text(b, "Buscar pedido, endereço, cliente...", 324, 38, 14, 400, "#8a97a8");
  icon(b, "bell", RW - 440, 21, 24, "#33455f");
  b.fillStyle = "#f5a922";
  b.beginPath();
  b.arc(RW - 421, 24, 4, 0, 7);
  b.fill();
  b.fillStyle = "#fff4dc";
  rr(b, RW - 400, 15, 168, 37, 18.5);
  b.fill();
  b.fillStyle = "#f5a922";
  b.beginPath();
  b.arc(RW - 384, 33.5, 4.5, 0, 7);
  b.fill();
  text(b, "Dados demonstrativos", RW - 374, 38.5, 13, 600, "#8a5a00");
  card(b, RW - 218, 15, 188, 37, 10);
  icon(b, "user", RW - 206, 21, 22, "#33455f");
  text(b, "Minha Empresa", RW - 178, 39, 14, 500, C.ink);
  icon(b, "chevD", RW - 52, 25, 14, "#6b7a90");

  // título
  const LX = 290,
    RX = RW - 30,
    CW = RX - LX,
    G = 14;
  text(b, "Dashboard", LX, 115, 34, 700, "#0b1b33");
  text(b, "Visão geral da sua operação logística", LX, 139, 15, 400, C.muted);
  card(b, RX - 150, 88, 150, 38, 10);
  icon(b, "calendar", RX - 138, 97, 20, "#33455f");
  text(b, "Hoje", RX - 108, 113, 14.5, 500, C.ink);
  icon(b, "chevD", RX - 30, 100, 15, "#6b7a90");

  // indicadores
  const kw = (CW - 3 * G) / 4;
  [
    ["PEDIDOS", "65", "pedidos para roteirizar", "box"],
    ["ROTAS", "5", "rotas planejadas", "route"],
    ["TEMPO ESTIMADO", "6h32", "tempo total das rotas", "clock"],
    ["VEÍCULOS NAS ROTAS", "5 / 8", "veículos usados no dia", "truck"],
  ].forEach(([label, val, sub, ic], i) => {
    const x = LX + i * (kw + G);
    card(b, x, 157, kw, 143, 12);
    b.fillStyle = "#f1f4f8";
    rr(b, x + 15, 172, 46, 46, 10);
    b.fill();
    icon(b, ic, x + 26, 183, 24, "#33455f");
    text(b, label, x + 76, 200, 12.5, 700, "#2a3a52");
    text(b, val, x + 20, 257, 34, 700, "#0b1b33");
    text(b, sub, x + 20, 285, 13, 500, "#2a9d6f");
  });

  // painel A: rotas
  card(b, LX, 315, 300, 414, 12);
  let cx = LX + 14;
  cx += chip(b, cx, 327, "Todas", { active: true }) + 11;
  cx += chip(b, cx, 327, "Entregas", { dot: C.green }) + 11;
  chip(b, cx, 327, "Coletas", { dot: C.blue });
  DEMO_ROUTES.forEach(([t, s, col], i) => {
    const y = 372 + i * 70;
    b.fillStyle = "#eceff4";
    b.fillRect(LX + 14, y - 4, 272, 1.3);
    b.fillStyle = col;
    b.beginPath();
    b.arc(LX + 24, y + 28, 4.5, 0, 7);
    b.fill();
    text(b, t, LX + 42, y + 26, 14.5, 600, C.ink);
    text(b, s, LX + 42, y + 47, 12.5, 400, C.muted);
    icon(b, "chevR", LX + 266, y + 21, 14, "#7d8ba0");
  });

  // painel B: mapa
  const BX = LX + 300 + G,
    BW = CW - 300 - 380 - 2 * G;
  card(b, BX, 315, BW, 414, 12);
  icon(b, "map", BX + 16, 327, 22, "#33455f");
  text(b, "Mapa de Distribuição", BX + 46, 343, 15, 600, C.ink);
  b.fillStyle = C.white;
  rr(b, BX + BW - 168, 328, 154, 25, 8);
  b.fill();
  b.strokeStyle = "#e1e7ee";
  b.lineWidth = 1.3;
  b.stroke();
  text(b, "Ver lista de paradas", BX + BW - 158, 345, 11.5, 500, C.ink);
  icon(b, "arrowR", BX + BW - 36, 334, 12, C.ink);
  const mx = BX + 8,
    my = 361,
    mw = BW - 16,
    mh = 362;
  b.save();
  rr(b, mx, my, mw, mh, 10);
  b.clip();
  drawMapCanvas(b, generateMap(11, mw, mh), mx, my, mw, mh, 0.62);
  b.restore();

  // painel C: próximas paradas
  const CX = BX + BW + G,
    CWd = 380;
  card(b, CX, 315, CWd, 414, 12);
  icon(b, "route", CX + 16, 327, 22, "#33455f");
  text(b, "Próximas paradas", CX + 46, 343, 15, 600, C.ink);
  linkText(b, "Ver todas", CX + CWd - 16, 343);
  DEMO_STOPS.forEach((s, i) => {
    const y = 364 + i * 72,
      k = KIND[s.kind];
    if (i) {
      b.fillStyle = "#eceff4";
      b.fillRect(CX + 16, y - 6, CWd - 32, 1.3);
    }
    b.fillStyle = k.color;
    b.beginPath();
    b.arc(CX + 28, y + 17, 11, 0, 7);
    b.fill();
    text(b, String(i + 1), CX + 28, y + 21.5, 12.5, 700, "#fff", "center");
    text(b, k.label, CX + 52, y + 15, 14, 600, C.ink);
    text(b, `Pedido ${s.id} · ${s.area}`, CX + 52, y + 33, 12, 400, C.muted);
    text(b, `${s.vol} volumes · ${kgBR(s.kg)}`, CX + 52, y + 50, 12, 400, C.muted);
    b.fillStyle = k.color + "22";
    rr(b, CX + CWd - 98, y + 31, 62, 21, 10.5);
    b.fill();
    text(b, k.label, CX + CWd - 67, y + 45.5, 11.5, 600, k.color, "center");
    icon(b, "chevR", CX + CWd - 28, y + 9, 14, "#7d8ba0");
  });

  // painel D: pedidos por região
  const D_W = 425;
  card(b, LX, 743, D_W, 260, 12);
  cardHeader(b, "bars", "Pedidos por Região", LX, 743);
  linkText(b, "Ver mais", LX + D_W - 16, 774);
  const total = DEMO_REGIONS.reduce((s, r) => s + r[1], 0);
  DEMO_REGIONS.forEach(([name, n], i) => {
    const y = 806 + i * 22.5;
    text(b, name, LX + 16, y + 4, 12.5, 400, C.ink);
    const tx = LX + 118,
      tw = D_W - 118 - 92;
    b.fillStyle = "#e9eef5";
    rr(b, tx, y - 5, tw, 9, 4.5);
    b.fill();
    b.fillStyle = "#1d3d6e";
    rr(b, tx, y - 5, Math.max(9, (tw * n) / total), 9, 4.5);
    b.fill();
    text(b, String(n), LX + D_W - 62, y + 4, 12, 500, C.ink, "right");
    text(b, `(${Math.round((n / total) * 100)}%)`, LX + D_W - 14, y + 4, 12, 400, C.muted, "right");
  });
  text(b, `Total de ${total} pedidos`, LX + D_W / 2, 992, 12, 400, C.muted, "center");

  // painel E: detalhes da rota
  const EX = LX + D_W + G,
    E_W = 425;
  card(b, EX, 743, E_W, 260, 12);
  cardHeader(b, "route", "Detalhes da Rota", EX, 743);
  text(b, "Rota 1 - Guarulhos", EX + 16, 828, 17, 600, C.ink);
  b.fillStyle = "#e6f0ff";
  rr(b, EX + E_W - 100, 811, 84, 24, 12);
  b.fill();
  text(b, "Planejada", EX + E_W - 58, 827.5, 12, 600, C.blue, "center");
  [
    ["12", "paradas"],
    ["48,2 km", "distância"],
    ["3h 45min", "tempo estimado"],
  ].forEach(([v, l], i) => {
    const x = EX + 16 + i * ((E_W - 32) / 3);
    text(b, v, x, 868, 19, 600, C.ink);
    text(b, l, x, 887, 12, 400, C.muted);
  });
  b.strokeStyle = "#e4e9f0";
  b.lineWidth = 1.3;
  rr(b, EX + 16, 896, E_W - 32, 64, 8);
  b.stroke();
  const x0 = EX + 34,
    x1 = EX + E_W - 34;
  b.strokeStyle = "#c9d3e0";
  b.lineWidth = 2;
  b.beginPath();
  b.moveTo(x0, 913);
  b.lineTo(x1, 913);
  b.stroke();
  for (let i = 0; i < 12; i++) {
    b.fillStyle = i < 4 ? C.blue : C.green;
    b.beginPath();
    b.arc(x0 + ((x1 - x0) * i) / 11, 913, 4.5, 0, 7);
    b.fill();
  }
  b.fillStyle = C.blue;
  b.beginPath();
  b.arc(EX + 38, 934, 4.5, 0, 7);
  b.fill();
  text(b, "Coletas", EX + 48, 938, 12, 500, C.ink);
  text(b, "4", EX + 48, 952, 11.5, 400, C.muted);
  b.fillStyle = C.green;
  b.beginPath();
  b.arc(EX + E_W / 2 + 10, 934, 4.5, 0, 7);
  b.fill();
  text(b, "Entregas", EX + E_W / 2 + 20, 938, 12, 500, C.ink);
  text(b, "8", EX + E_W / 2 + 20, 952, 11.5, 400, C.muted);
  b.fillStyle = "#f1f4f8";
  rr(b, EX + 16, 967, E_W - 32, 29, 8);
  b.fill();
  b.strokeStyle = "#d9e0ea";
  b.stroke();
  text(b, "Ver detalhes da rota", EX + E_W / 2, 986, 12.5, 500, C.ink, "center");

  // painel F: veículos
  const FX = EX + E_W + G,
    F_W = CW - D_W - E_W - 2 * G;
  card(b, FX, 743, F_W, 260, 12);
  cardHeader(b, "truck", "Veículos", FX, 743);
  text(b, "capacidade usada", FX + 214, 772, 11, 500, C.muted);
  linkText(b, "Ver todos", FX + F_W - 16, 774);
  DEMO_VEHICLES.forEach(([name, route, pct], i) => {
    const y = 796 + i * 40;
    icon(b, "truck", FX + 16, y + 2, 22, "#33455f");
    text(b, name, FX + 52, y + 12, 12.5, 600, C.ink);
    text(b, route, FX + 52, y + 27, 11.5, 400, C.muted);
    b.fillStyle = C.green;
    b.beginPath();
    b.arc(FX + 218, y + 8, 3.5, 0, 7);
    b.fill();
    text(b, "Planejada", FX + 226, y + 12, 11.5, 500, C.ink);
    const bx = FX + 214,
      bw = F_W - 214 - 58;
    b.fillStyle = "#e5ebf3";
    rr(b, bx, y + 18, bw, 5, 2.5);
    b.fill();
    b.fillStyle = C.blue;
    rr(b, bx, y + 18, (bw * pct) / 100, 5, 2.5);
    b.fill();
    text(b, `${pct}%`, FX + F_W - 16, y + 25, 11.5, 500, C.muted, "right");
  });

  // camada acima das rotas: zoom e legenda do mapa
  const ovl = document.createElement("canvas");
  ovl.width = W;
  ovl.height = H;
  const v = ovl.getContext("2d");
  v.scale(S, S);
  ["plus", "minus", "layers"].forEach((ic, i) => {
    card(v, mx + 10, my + 10 + i * 32, 30, 30, 6);
    icon(v, ic, mx + 16, my + 16 + i * 32, 18, "#33455f");
  });
  card(v, mx + mw - 196, my + 10, 186, 28, 8);
  [
    ["Entrega", C.green, 0],
    ["Coleta", C.blue, 66],
  ].forEach(([l, col, off]) => {
    v.fillStyle = col;
    v.beginPath();
    v.arc(mx + mw - 182 + off, my + 24, 4, 0, 7);
    v.fill();
    text(v, l, mx + mw - 174 + off, my + 28.5, 11.5, 500, C.ink);
  });
  v.strokeStyle = "#7d8ba0";
  v.lineWidth = 1.6;
  v.beginPath();
  v.moveTo(mx + mw - 64, my + 24);
  v.lineTo(mx + mw - 50, my + 24);
  v.stroke();
  text(v, "Rota", mx + mw - 44, my + 28.5, 11.5, 500, C.ink);

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
      o.scale(S, S);
      rr(o, mx, my, mw, mh, 10);
      o.clip();
      o.translate(mx, my);
      drawRoutes(o, R, progress, 0.55, 0.72);
      o.restore();
      o.drawImage(ovl, 0, 0);
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
  // aviso de dados demonstrativos
  b.fillStyle = "#fff4dc";
  rr(b, 28, my + 20, 262, 40, 20);
  b.fill();
  b.fillStyle = "#f5a922";
  b.beginPath();
  b.arc(52, my + 40, 6, 0, 7);
  b.fill();
  text(b, "Dados demonstrativos", 68, my + 46, 18, 600, "#8a5a00");
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
  text(b, "Rota 1 - Guarulhos", 40, 784, 32, 700, C.ink);
  text(b, "12 paradas · 48,2 km · 3h 45min", 40, 822, 21, 500, C.muted);
  b.fillStyle = "#e3e9f0";
  rr(b, 40, 848, W - 80, 12, 6);
  b.fill();
  b.fillStyle = C.blue;
  rr(b, 40, 848, (W - 80) * 0.72, 12, 6);
  b.fill();
  text(b, "72% da capacidade", 40, 888, 18, 500, C.muted);
  const stops = DEMO_STOPS.slice(0, 2).map((s) => [
    `${s.id} · ${s.area}`,
    `${KIND[s.kind].label} · ${s.vol} volumes · ${kgBR(s.kg)}`,
    KIND[s.kind].color,
  ]);
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
      {
        color: C.blue,
        pinColors: [C.blue, C.green, C.green],
        stops: [P(0.3, 0.42), P(0.42, 0.2), P(0.68, 0.28)],
      },
      { color: C.green, pinColors: [C.blue, C.green], stops: [P(0.24, 0.72), P(0.12, 0.5)] },
      { color: C.red, pinColors: [C.blue, C.green], stops: [P(0.78, 0.56), P(0.88, 0.3)] },
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
