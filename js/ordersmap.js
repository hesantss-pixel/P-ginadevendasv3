// Mapas de ruas da seção "Pedidos no mapa" (Leaflet + mapa de ruas configurado em config.js).
// Mapa 1: todos os pedidos como bolinhas verdes. Mapa 2: coletas e entregas separadas, com filtro.
// Todos os pedidos são DEMONSTRATIVOS (js/data.js).
import { SITE_CONFIG } from "./config.js";
import { ORDERS, DEPOT_GEO, fmtKg } from "./data.js";

const KIND_TEXT = { entrega: "Entrega", coleta: "Coleta" };
const ARROW = {
  // entrega: seta para baixo (deixar a mercadoria); coleta: seta para cima (buscar a mercadoria)
  entrega: '<path d="M12 5v13M6 12l6 6 6-6"/>',
  coleta: '<path d="M12 19V6M6 12l6-6 6 6"/>',
};

let leafletPromise;
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  leafletPromise ||= new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "vendor/leaflet/leaflet.css";
    document.head.append(css);
    const s = document.createElement("script");
    s.src = "vendor/leaflet/leaflet.js";
    s.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet não carregou")));
    s.onerror = () => reject(new Error("Leaflet não carregou"));
    document.head.append(s);
  });
  return leafletPromise;
}

const allOrders = () =>
  Object.entries(ORDERS).flatMap(([kind, g]) => g.items.map((o) => ({ ...o, kind })));

const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function popupHTML(o, withKind) {
  const kind = withKind
    ? `<span class="mpop__kind mpop__kind--${o.kind}">${KIND_TEXT[o.kind]}</span>`
    : "";
  return `<div class="mpop">${kind}<strong>Pedido ${esc(o.id)}</strong>
    <span>${esc(o.city)} — ${esc(o.area)}</span>
    <span>${o.vol} volumes · ${fmtKg(o.kg)}</span></div>`;
}

function createMap(L, el, reduceMotion) {
  el.textContent = "";
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const map = L.map(el, {
    scrollWheelZoom: false, // não "prende" a rolagem da página
    dragging: !touch, // no celular, um dedo rola a página; dois dedos dão zoom
    tapHold: false,
    zoomSnap: 0.25,
    fadeAnimation: !reduceMotion,
    zoomAnimation: !reduceMotion,
    markerZoomAnimation: !reduceMotion,
  });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  // a roda do mouse só dá zoom depois de clicar no mapa
  map.on("click focus", () => map.scrollWheelZoom.enable());
  map.on("mouseout blur", () => map.scrollWheelZoom.disable());

  const t = SITE_CONFIG.mapTiles || {};
  const tiles = L.tileLayer(t.url, {
    attribution: t.attribution,
    maxZoom: t.maxZoom || 19,
    crossOrigin: false,
  }).addTo(map);
  let loaded = 0;
  let failed = 0;
  tiles.on("tileload", () => {
    loaded++;
    el.classList.remove("is-offline");
  });
  tiles.on("tileerror", () => {
    failed++;
    if (!loaded && failed >= 3) el.classList.add("is-offline");
  });
  return map;
}

function depotMarker(L) {
  const text = `${DEPOT_GEO.name} (demonstrativo)`;
  const m = L.marker([DEPOT_GEO.lat, DEPOT_GEO.lng], {
    icon: L.divIcon({
      className: "mk-wrap",
      html: '<span class="mk mk--cd"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 5l9 5.5V20H3z"/><path d="M8 20v-6h8v6"/></svg></span>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12],
    }),
    title: `${DEPOT_GEO.name} (demonstrativo)`,
    alt: DEPOT_GEO.name,
    zIndexOffset: -100,
  });
  return labelMarker(m, text).bindPopup(
    `<div class="mpop"><strong>${DEPOT_GEO.name}</strong><span>Ponto de saída das rotas</span></div>`,
  );
}

function labelMarker(m, text) {
  m.on("add", () => {
    const el = m.getElement();
    if (el) {
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", text);
    }
  });
  return m;
}

function fit(map, latlngs, reduceMotion) {
  map.fitBounds(latlngs, { padding: [28, 28], maxZoom: 13, animate: !reduceMotion });
}

/* ---------- Mapa 1: todos os pedidos (bolinhas verdes) ---------- */
function buildAllOrdersMap(L, el, reduceMotion) {
  const map = createMap(L, el, reduceMotion);
  const orders = allOrders();
  const icon = L.divIcon({
    className: "mk-wrap",
    html: '<span class="mk mk--pedido"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
  for (const o of orders) {
    const text = `Pedido ${o.id}, ${o.city} — ${o.area}`;
    labelMarker(L.marker([o.lat, o.lng], { icon, title: text, alt: text }), text)
      .bindPopup(popupHTML(o, false))
      .addTo(map);
  }
  depotMarker(L).addTo(map);
  fit(
    map,
    orders.map((o) => [o.lat, o.lng]),
    true,
  );
  return { map, count: orders.length };
}

/* ---------- Mapa 2: coletas e entregas ---------- */
function buildKindsMap(L, el, reduceMotion, filterButtons) {
  const map = createMap(L, el, reduceMotion);
  const layers = {};
  for (const [kind, g] of Object.entries(ORDERS)) {
    const icon = L.divIcon({
      className: "mk-wrap",
      html: `<span class="mk mk--${kind}"><svg viewBox="0 0 24 24" aria-hidden="true">${ARROW[kind]}</svg></span>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -13],
    });
    layers[kind] = L.layerGroup(
      g.items.map((o) => {
        const text = `${KIND_TEXT[kind]} — pedido ${o.id}, ${o.city} — ${o.area}`;
        return labelMarker(
          L.marker([o.lat, o.lng], { icon, title: text, alt: text }),
          text,
        ).bindPopup(popupHTML({ ...o, kind }, true));
      }),
    ).addTo(map);
  }
  depotMarker(L).addTo(map);

  const show = (filter) => {
    const visible = [];
    for (const [kind, layer] of Object.entries(layers)) {
      const on = filter === "todas" || filter === kind;
      if (on) {
        map.addLayer(layer);
        ORDERS[kind].items.forEach((o) => visible.push([o.lat, o.lng]));
      } else map.removeLayer(layer);
    }
    map.closePopup();
    filterButtons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.filter === filter)),
    );
    visible.push([DEPOT_GEO.lat, DEPOT_GEO.lng]);
    fit(map, visible, reduceMotion);
  };
  filterButtons.forEach((b) => b.addEventListener("click", () => show(b.dataset.filter)));
  show("todas");
  return { map, layers, show };
}

export function initOrdersMaps({ reduceMotion = false } = {}) {
  const section = document.getElementById("mapa");
  if (!section) return;
  const elAll = document.getElementById("map-pedidos");
  const elKinds = document.getElementById("map-tipos");
  const buttons = [...section.querySelectorAll("[data-filter]")];

  // contadores a partir dos dados
  const n = { entrega: ORDERS.entrega.items.length, coleta: ORDERS.coleta.items.length };
  n.todas = n.entrega + n.coleta;
  section.querySelectorAll("[data-count]").forEach((c) => (c.textContent = n[c.dataset.count]));

  const start = () =>
    loadLeaflet()
      .then((L) => {
        const api = {
          all: buildAllOrdersMap(L, elAll, reduceMotion),
          kinds: buildKindsMap(L, elKinds, reduceMotion, buttons),
        };
        section.classList.add("is-ready");
        window.__rotav3 = Object.assign(window.__rotav3 || {}, { maps: api });
      })
      .catch((err) => {
        console.warn("Mapas indisponíveis:", err);
        [elAll, elKinds].forEach((el) => {
          el.classList.add("is-failed");
          el.textContent = "Não foi possível carregar o mapa agora.";
        });
      });

  if (!("IntersectionObserver" in window)) return start();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      start();
    },
    { rootMargin: "400px 0px" },
  );
  io.observe(section);
}
