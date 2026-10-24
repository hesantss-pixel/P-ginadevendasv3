// Desenho sobre img/mapa-guarulhos.svg (fundo ilustrativo de Guarulhos e arredores).
// A projeção é a mesma de ferramentas/mapa-3d/gerar_mapa_guarulhos.py.
const LON0 = -46.6;
const LAT1 = -23.39;
const KX = Math.cos(((-23.53 + -23.39) / 2) * (Math.PI / 180)) * 111.32;
const S = 1520 / ((-46.37 - -46.6) * KX);
export const MAPA_W = 1520;
export const MAPA_H = 1002;

export const proj = (p) => [(p.lng - LON0) * KX * S, (LAT1 - p.lat) * 110.57 * S];

const NS = "http://www.w3.org/2000/svg";
export function el(tag, attrs = {}, filhos = []) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const f of filhos) e.append(f);
  return e;
}

// pedido pendente (círculo verde = entrega, marinho = coleta)
export function pino(p, cls = "") {
  const [x, y] = proj(p);
  const g = el("g", { class: `mpin ${p.tipo === "coleta" ? "c" : "e"} ${cls}`.trim() });
  g.append(el("circle", { class: "fundo", cx: x, cy: y, r: 15 }));
  return g;
}

export function marcadorCD(cd, rotulo = "CD") {
  const [x, y] = proj(cd);
  const g = el("g");
  g.append(el("circle", { cx: x, cy: y, r: 46 }), el("circle", { cx: x, cy: y, r: 25 }));
  const t = el("text", { x, y: y + 9, "text-anchor": "middle" });
  t.textContent = rotulo;
  g.append(t);
  return g;
}

// parada numerada da rota (entrega: dourado cheio; coleta: branco com borda dourada, como no sistema)
export function numero(p, i) {
  const [x, y] = proj(p);
  const g = el("g", { class: `mnum ${p.tipo === "coleta" ? "c" : "e"}` });
  g.append(el("circle", { cx: x, cy: y, r: 27 }));
  const t = el("text", { x, y: y + 12, "text-anchor": "middle" });
  t.textContent = String(i + 1);
  g.append(t);
  return g;
}

export function caminhoRota(cd, paradas) {
  const pts = [cd, ...paradas, cd].map(proj);
  return "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
}
