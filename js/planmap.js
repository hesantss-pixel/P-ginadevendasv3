// Painel interativo da seção "Planejamento": abas Entregas/Coletas, lista de pedidos,
// mapa com arrastar/zoom, marcadores clicáveis, resumo da rota e capacidade do veículo.
import { generateMap, mapToSVG, routeSVG, streetPath } from "./mapgen.js";
import {
  ORDERS,
  DEPOT,
  MAP_W,
  MAP_H,
  MAP_SEED,
  CONTEXT_ROUTES,
  VEHICLE_CAPACITY_KG,
  fmtKg,
} from "./data.js";

const PIN = (color) =>
  `<svg viewBox="0 0 30 38" aria-hidden="true"><path d="M15 36.5S3 25.6 3 15.6A12 12 0 0 1 27 15.6c0 10-12 20.9-12 20.9z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15.5" r="4.6" fill="#fff"/></svg>`;

export function initPlanMap() {
  const root = document.getElementById("plan-map");
  if (!root) return;
  const layer = document.getElementById("plan-map-layer");
  const tip = document.getElementById("plan-map-tip");
  const list = document.getElementById("lista-pedidos");
  const tabs = [...document.querySelectorAll(".tabs .tab")];
  const zoomBtns = document.querySelectorAll(".map__zoom button");

  const map = generateMap(MAP_SEED, MAP_W, MAP_H);
  const routes = {};
  for (const kind of Object.keys(ORDERS)) {
    const pts = [
      [DEPOT.x, DEPOT.y],
      ...ORDERS[kind].items.map((i) => [i.x, i.y]),
      [DEPOT.x, DEPOT.y],
    ];
    routes[kind] = streetPath(pts, kind === "entrega" ? 3 : 11);
  }
  let svg = mapToSVG(map);
  for (const c of CONTEXT_ROUTES)
    svg += routeSVG(streetPath(c.pts, 5), c.color, { width: 3.5, opacity: 0.5 });
  for (const kind of Object.keys(ORDERS))
    svg += routeSVG(routes[kind], ORDERS[kind].color, { width: 5, id: `route-${kind}` });
  svg += "</svg>";
  layer.innerHTML = svg;
  layer.style.width = MAP_W + "px";
  layer.style.height = MAP_H + "px";

  const depot = document.createElement("span");
  depot.className = "map__depot";
  depot.innerHTML = '<svg class="ico"><use href="#i-warehouse"/></svg>';
  root.appendChild(depot);

  const pins = [];
  for (const kind of Object.keys(ORDERS)) {
    for (const item of ORDERS[kind].items) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "map__pin";
      b.dataset.kind = kind;
      b.dataset.id = item.id;
      b.setAttribute("aria-pressed", "false");
      b.setAttribute(
        "aria-label",
        `${kind === "entrega" ? "Entrega" : "Coleta"} ${item.id}, ${item.city}`,
      );
      b.innerHTML = PIN(ORDERS[kind].color);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        select(kind, item.id, false);
      });
      root.appendChild(b);
      pins.push({ el: b, kind, item });
    }
  }

  let active = "entrega";
  let selected = null;
  let z = 1,
    tx = 0,
    ty = 0,
    s0 = 1,
    cw = 0,
    ch = 0;

  function clampView() {
    const w = MAP_W * s0 * z,
      h = MAP_H * s0 * z;
    tx = w <= cw ? (cw - w) / 2 : Math.min(0, Math.max(cw - w, tx));
    ty = h <= ch ? (ch - h) / 2 : Math.min(0, Math.max(ch - h, ty));
  }
  function apply() {
    const k = s0 * z;
    layer.style.transform = `translate(${tx}px, ${ty}px) scale(${k})`;
    for (const p of pins) {
      p.el.style.left = tx + p.item.x * k + "px";
      p.el.style.top = ty + p.item.y * k + "px";
    }
    depot.style.left = tx + DEPOT.x * k + "px";
    depot.style.top = ty + DEPOT.y * k + "px";
    if (selected) {
      const it = ORDERS[selected.kind].items.find((i) => i.id === selected.id);
      const X = tx + it.x * k,
        Y = ty + it.y * k;
      const tw = tip.offsetWidth || 180,
        th = tip.offsetHeight || 60;
      const cx = Math.min(cw - tw / 2 - 8, Math.max(tw / 2 + 8, X));
      tip.style.left = cx + "px";
      tip.style.top = Y + "px";
      tip.style.setProperty("--ax", `calc(50% + ${Math.round(X - cx)}px)`);
      tip.classList.toggle("is-below", Y - th - 46 < 6);
    }
  }
  function layout() {
    const fresh = cw === 0;
    cw = root.clientWidth;
    ch = root.clientHeight;
    if (!cw || !ch) return;
    s0 = Math.max(cw / MAP_W, ch / MAP_H);
    if (fresh) {
      tx = (cw - MAP_W * s0) / 2;
      ty = (ch - MAP_H * s0) / 2;
    }
    clampView();
    apply();
  }
  function zoomAt(factor, cx = cw / 2, cy = ch / 2) {
    const nz = Math.min(3.2, Math.max(1, z * factor));
    const mx = (cx - tx) / (s0 * z),
      my = (cy - ty) / (s0 * z);
    z = nz;
    tx = cx - mx * s0 * z;
    ty = cy - my * s0 * z;
    clampView();
    apply();
  }
  function centerOn(x, y) {
    tx = cw / 2 - x * s0 * z;
    ty = ch / 2 - y * s0 * z;
    clampView();
    apply();
  }

  new ResizeObserver(layout).observe(root);
  layout();

  // arrastar e pinça
  const pointers = new Map();
  let last = null,
    pinchDist = 0,
    moved = 0;
  root.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".map__pin")) return;
    root.setPointerCapture(e.pointerId);
    moved = 0;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    last = [e.clientX, e.clientY];
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
  });
  root.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const rect = root.getBoundingClientRect();
      if (pinchDist)
        zoomAt(d / pinchDist, (a[0] + b[0]) / 2 - rect.left, (a[1] + b[1]) / 2 - rect.top);
      pinchDist = d;
      return;
    }
    tx += e.clientX - last[0];
    ty += e.clientY - last[1];
    moved += Math.abs(e.clientX - last[0]) + Math.abs(e.clientY - last[1]);
    last = [e.clientX, e.clientY];
    clampView();
    apply();
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    pinchDist = 0;
    if (pointers.size === 1) last = [...pointers.values()][0];
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener("click", (e) => {
    if (!e.target.closest(".map__pin") && moved < 5) clearSelection();
  });
  root.addEventListener("keydown", (e) => {
    const step = 50;
    const keys = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (keys[e.key]) {
      e.preventDefault();
      tx += keys[e.key][0];
      ty += keys[e.key][1];
      clampView();
      apply();
    } else if (e.key === "+" || e.key === "=") zoomAt(1.3);
    else if (e.key === "-") zoomAt(1 / 1.3);
    else if (e.key === "Escape") clearSelection();
  });
  zoomBtns.forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.zoom === "in") zoomAt(1.35);
      else if (b.dataset.zoom === "out") zoomAt(1 / 1.35);
      else {
        z = 1;
        cw = 0;
        layout();
      }
    }),
  );

  function renderList() {
    const o = ORDERS[active];
    list.innerHTML = "";
    for (const it of o.items) {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button" class="order" aria-pressed="false" data-id="${it.id}">
        <span class="order__pin" style="background:${o.color}"><svg class="ico"><use href="#i-pin"/></svg></span>
        <span><strong>${it.id} · ${it.city}</strong><small>${it.vol} volume${it.vol > 1 ? "s" : ""} · ${fmtKg(it.kg)}</small></span></button>`;
      li.firstElementChild.addEventListener("click", () => select(active, it.id, true));
      list.appendChild(li);
    }
    const total = o.items.reduce((s, i) => s + i.kg, 0);
    document.getElementById("st-dist").textContent = o.distance;
    document.getElementById("st-time").textContent = o.time;
    document.getElementById("st-weight").textContent = fmtKg(total).replace(",0 kg", " kg");
    document.getElementById("st-stops").textContent = o.items.length;
    document.getElementById("st-stops-label").textContent = o.label;
    const pct = Math.round((total / VEHICLE_CAPACITY_KG) * 100);
    document.getElementById("cap-pct").textContent = pct + "%";
    document.getElementById("cap-bar").style.width = pct + "%";
    for (const p of pins) {
      const on = p.kind === active;
      p.el.classList.toggle("is-dim", !on);
      p.el.tabIndex = on ? 0 : -1;
      p.el.setAttribute("aria-hidden", on ? "false" : "true");
    }
    for (const kind of Object.keys(ORDERS)) {
      const g = layer.querySelector(`#route-${kind}`);
      if (g) {
        g.setAttribute("opacity", kind === active ? "1" : "0.22");
        if (kind === active) g.parentNode.appendChild(g);
      }
    }
  }

  function select(kind, id, pan) {
    if (kind !== active) return;
    selected = { kind, id };
    const it = ORDERS[kind].items.find((i) => i.id === id);
    for (const p of pins)
      p.el.setAttribute("aria-pressed", String(p.kind === kind && p.item.id === id));
    list
      .querySelectorAll(".order")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    const label = kind === "entrega" ? "Entrega" : "Coleta";
    tip.innerHTML = `<strong>${it.id} · ${it.city}</strong><span><svg class="ico"><use href="#i-package"/></svg>${label} · ${it.vol} volume${it.vol > 1 ? "s" : ""} · ${fmtKg(it.kg)}</span>`;
    tip.hidden = false;
    if (pan) centerOn(it.x, it.y + 60 / (s0 * z));
    else apply();
  }
  function clearSelection() {
    selected = null;
    tip.hidden = true;
    pins.forEach((p) => p.el.setAttribute("aria-pressed", "false"));
    list.querySelectorAll(".order").forEach((b) => b.setAttribute("aria-pressed", "false"));
  }

  function setTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    list.setAttribute("aria-labelledby", tab.id);
    active = tab.dataset.kind;
    clearSelection();
    renderList();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => setTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus();
        setTab(n);
      }
    });
  });

  renderList();
  // começa com um pedido selecionado, como na referência
  requestAnimationFrame(() => select("entrega", "#1023", false));
}
