// Gerador de mapa ilustrativo (ruas, parques, rio) usado no painel interativo e nas telas 3D.
// É determinístico: a mesma semente sempre gera o mesmo desenho. Não representa um lugar real.

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAP_COLORS = {
  land: "#eef1f4",
  park: "#d6ead6",
  water: "#cfe1f2",
  minor: "#ffffff",
  minorCase: "#e2e6eb",
  major: "#f8da8f",
  majorCase: "#ecc56b",
  highway: "#f6b26b",
};

// Gera a geometria do mapa em coordenadas de 0..W x 0..H.
export function generateMap(seed, W, H) {
  const r = rng(seed);
  const parks = [];
  for (let i = 0; i < 7; i++) {
    const cx = r() * W,
      cy = r() * H,
      rad = (0.05 + r() * 0.07) * Math.min(W, H) * 1.4;
    const pts = [];
    const n = 9;
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * Math.PI * 2;
      const rr = rad * (0.65 + r() * 0.45);
      pts.push([cx + Math.cos(ang) * rr * 1.25, cy + Math.sin(ang) * rr]);
    }
    parks.push(pts);
  }

  const water = [];
  const wy = H * (0.78 + r() * 0.08);
  for (let x = -40; x <= W + 40; x += W / 14)
    water.push([x, wy + Math.sin((x / W) * 5.2 + r()) * H * 0.035]);

  // ruas menores: grade levemente girada, com falhas aleatórias
  const minor = [];
  const ang = (r() - 0.5) * 0.35;
  const ca = Math.cos(ang),
    sa = Math.sin(ang);
  const step = Math.min(W, H) / 11;
  const span = Math.max(W, H) * 1.5;
  const rot = (x, y) => [W / 2 + x * ca - y * sa, H / 2 + x * sa + y * ca];
  for (let d = -span / 2; d <= span / 2; d += step * (0.7 + r() * 0.6)) {
    let t = -span / 2;
    while (t < span / 2) {
      const len = step * (1.5 + r() * 5);
      if (r() > 0.18) minor.push([rot(d, t), rot(d + (r() - 0.5) * step * 0.2, t + len)]);
      t += len + step * (r() > 0.7 ? 0.8 : 0);
    }
  }
  for (let d = -span / 2; d <= span / 2; d += step * (0.7 + r() * 0.6)) {
    let t = -span / 2;
    while (t < span / 2) {
      const len = step * (1.5 + r() * 5);
      if (r() > 0.18) minor.push([rot(t, d), rot(t + len, d + (r() - 0.5) * step * 0.2)]);
      t += len + step * (r() > 0.7 ? 0.8 : 0);
    }
  }

  // avenidas: curvas suaves cruzando o mapa
  const major = [];
  for (let i = 0; i < 5; i++) {
    const horizontal = i % 2 === 0;
    const pts = [];
    const base = (0.15 + r() * 0.7) * (horizontal ? H : W);
    const amp = (0.05 + r() * 0.08) * (horizontal ? H : W);
    const ph = r() * 6;
    for (let k = 0; k <= 12; k++) {
      const t = -0.05 + (k / 12) * 1.1;
      const off = Math.sin(t * 3.4 + ph) * amp;
      pts.push(horizontal ? [t * W, base + off] : [base + off, t * H]);
    }
    major.push(pts);
  }
  const highway = [];
  for (let k = 0; k <= 12; k++) {
    const t = -0.05 + (k / 12) * 1.1;
    highway.push([t * W, H * (0.12 + t * 0.62) + Math.sin(t * 4 + 1) * H * 0.05]);
  }
  return { W, H, parks, water, minor, major, highway };
}

// Curva suave (Catmull-Rom) passando pelos pontos; devolve lista densa de pontos.
export function smoothPath(points, segs = 10) {
  if (points.length < 3) return points.slice();
  const out = [];
  const p = [points[0], ...points, points[points.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    for (let s = 0; s < segs; s++) {
      const t = s / segs,
        t2 = t * t,
        t3 = t2 * t;
      out.push(
        [0, 1].map(
          (k) =>
            0.5 *
            (2 * p1[k] +
              (-p0[k] + p2[k]) * t +
              (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
              (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
        ),
      );
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

// Caminho "de rua": vai de ponto a ponto em L (como andar por quarteirões) e depois suaviza os cantos.
export function streetPath(points, seed = 1) {
  const r = rng(seed);
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = out[out.length - 1];
    const [bx, by] = points[i];
    if (r() > 0.5) out.push([bx, ay]);
    else out.push([ax, by]);
    out.push([bx, by]);
  }
  return smoothPath(out, 6);
}

// Desenha o mapa em um contexto 2D de canvas, dentro do retângulo (x, y, w, h).
export function drawMapCanvas(ctx, map, x, y, w, h, scale = 1) {
  const sx = w / map.W,
    sy = h / map.H;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.fillStyle = MAP_COLORS.land;
  ctx.fillRect(0, 0, map.W, map.H);
  ctx.fillStyle = MAP_COLORS.park;
  for (const poly of map.parks) {
    tracePoly(ctx, smoothPath([...poly, poly[0]], 6));
    ctx.fill();
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = MAP_COLORS.water;
  ctx.lineWidth = 16 * scale;
  tracePath(ctx, map.water);
  ctx.stroke();
  ctx.strokeStyle = MAP_COLORS.minorCase;
  ctx.lineWidth = 4.2 * scale;
  for (const s of map.minor) {
    tracePath(ctx, s);
    ctx.stroke();
  }
  ctx.strokeStyle = MAP_COLORS.minor;
  ctx.lineWidth = 2.6 * scale;
  for (const s of map.minor) {
    tracePath(ctx, s);
    ctx.stroke();
  }
  for (const m of map.major) {
    const pts = smoothPath(m, 6);
    ctx.strokeStyle = MAP_COLORS.majorCase;
    ctx.lineWidth = 7 * scale;
    tracePath(ctx, pts);
    ctx.stroke();
    ctx.strokeStyle = MAP_COLORS.major;
    ctx.lineWidth = 5 * scale;
    tracePath(ctx, pts);
    ctx.stroke();
  }
  const hw = smoothPath(map.highway, 6);
  ctx.strokeStyle = "#e39a52";
  ctx.lineWidth = 9 * scale;
  tracePath(ctx, hw);
  ctx.stroke();
  ctx.strokeStyle = MAP_COLORS.highway;
  ctx.lineWidth = 6.5 * scale;
  tracePath(ctx, hw);
  ctx.stroke();
  ctx.restore();
}

export function tracePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}
function tracePoly(ctx, pts) {
  tracePath(ctx, pts);
  ctx.closePath();
}

// Mesmo mapa como SVG (para o painel interativo, que precisa ficar nítido com zoom).
export function mapToSVG(map) {
  const f = (n) => Math.round(n * 10) / 10;
  const d = (pts) => "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L");
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${map.W} ${map.H}" width="${map.W}" height="${map.H}" aria-hidden="true">`;
  s += `<rect width="${map.W}" height="${map.H}" fill="${MAP_COLORS.land}"/>`;
  s +=
    `<g fill="${MAP_COLORS.park}">` +
    map.parks.map((p) => `<path d="${d(smoothPath([...p, p[0]], 6))}Z"/>`).join("") +
    "</g>";
  s += `<path d="${d(map.water)}" fill="none" stroke="${MAP_COLORS.water}" stroke-width="16" stroke-linecap="round"/>`;
  const minor = map.minor.map((m) => d(m)).join("");
  s += `<path d="${minor}" fill="none" stroke="${MAP_COLORS.minorCase}" stroke-width="4.2" stroke-linecap="round"/>`;
  s += `<path d="${minor}" fill="none" stroke="${MAP_COLORS.minor}" stroke-width="2.6" stroke-linecap="round"/>`;
  const major = map.major.map((m) => d(smoothPath(m, 6))).join("");
  s += `<path d="${major}" fill="none" stroke="${MAP_COLORS.majorCase}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${major}" fill="none" stroke="${MAP_COLORS.major}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hw = d(smoothPath(map.highway, 6));
  s += `<path d="${hw}" fill="none" stroke="#e39a52" stroke-width="9" stroke-linecap="round"/>`;
  s += `<path d="${hw}" fill="none" stroke="${MAP_COLORS.highway}" stroke-width="6.5" stroke-linecap="round"/>`;
  return s; // o chamador fecha a tag depois de acrescentar as rotas
}

export function routeSVG(pts, color, { width = 5, opacity = 1, id = "" } = {}) {
  const f = (n) => Math.round(n * 10) / 10;
  const dd = "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L");
  return `<g opacity="${opacity}"${id ? ` id="${id}"` : ""}><path d="${dd}" fill="none" stroke="#fff" stroke-width="${width + 3.5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${dd}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
