// Carregamento sob demanda do Leaflet e criação dos mapas de ruas (usado pelo painel de
// planejamento e pela seção "Pedidos no mapa"). O mapa de ruas vem de config.js (mapTiles).
import { SITE_CONFIG } from "./config.js";

let leafletPromise;
export function loadLeaflet() {
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

export const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

export function createMap(L, el, { reduceMotion = false, zoomControl = true } = {}) {
  el.textContent = "";
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const map = L.map(el, {
    zoomControl,
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
