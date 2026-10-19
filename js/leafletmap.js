// Carregamento sob demanda dos mapas de ruas (painel de planejamento e seção "Pedidos no mapa").
// Mapa principal: estilo vetorial claro, no visual dos aplicativos de mapa (OpenFreeMap, desenhado
// com MapLibre dentro do Leaflet). Sem WebGL, ou se o estilo não carregar, usa o mapa de
// ruas comum do OpenStreetMap, suavizado. Endereços e créditos ficam em config.js (mapTiles).
import { SITE_CONFIG } from "./config.js";

const cfg = () => SITE_CONFIG.mapTiles || {};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("não carregou: " + src));
    document.head.append(s);
  });
}
function loadCss(href) {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  document.head.append(l);
}
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

let leafletPromise;
let vectorLayerFactory = null; // L.maplibreGL quando o mapa vetorial está disponível
export function loadLeaflet() {
  leafletPromise ||= (async () => {
    loadCss("vendor/leaflet/leaflet.css");
    await loadScript("vendor/leaflet/leaflet.js");
    if (!window.L) throw new Error("Leaflet não carregou");
    if (cfg().vectorStyle && hasWebGL()) {
      try {
        loadCss("vendor/maplibre/maplibre-gl.css");
        await loadScript("vendor/maplibre/maplibre-gl.js");
        const mod = await import("../vendor/maplibre-gl-leaflet/leaflet-maplibre-gl.mjs");
        vectorLayerFactory = mod.maplibreGL;
      } catch (err) {
        console.warn("Mapa vetorial indisponível, usando o mapa de ruas comum:", err);
      }
    }
    return window.L;
  })();
  return leafletPromise;
}

export const esc = (t) =>
  String(t).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// Ajustes no estilo "liberty" para lembrar os aplicativos de mapa: fundo cinza-claro, ruas
// brancas, água azul, áreas verdes suaves, sem ícones de comércio e sem prédios em 3D.
const STYLE_TWEAKS = {
  hide: [
    "poi_r20",
    "poi_r7",
    "poi_r1",
    "building-3d",
    "road_one_way_arrow",
    "road_one_way_arrow_opposite",
  ],
  paint: {
    background: { "background-color": "#f1f3f4" },
    landuse_residential: { "fill-color": "#eceff1", "fill-opacity": 0.6 },
    park: { "fill-color": "#cdebd3" },
    landcover_wood: { "fill-color": "#cdebd3", "fill-opacity": 0.7 },
    landcover_grass: { "fill-color": "#d6efdb", "fill-opacity": 0.7 },
    water: { "fill-color": "#aadaff" },
    building: { "fill-color": "#e6e8eb" },
    road_motorway: { "line-color": "#aebfd8" },
    road_motorway_casing: { "line-color": "#93a6c3" },
    road_motorway_link: { "line-color": "#c4d1e3" },
    road_trunk_primary: { "line-color": "#ffffff" },
    road_trunk_primary_casing: { "line-color": "#c9d1db" },
    road_secondary_tertiary: { "line-color": "#ffffff" },
    road_secondary_tertiary_casing: { "line-color": "#d5dbe3" },
    road_minor: { "line-color": "#ffffff" },
    bridge_motorway: { "line-color": "#aebfd8" },
    bridge_trunk_primary: { "line-color": "#ffffff" },
    bridge_secondary_tertiary: { "line-color": "#ffffff" },
  },
};
function tweakStyle(gl) {
  for (const id of STYLE_TWEAKS.hide) {
    try {
      if (gl.getLayer(id)) gl.setLayoutProperty(id, "visibility", "none");
    } catch {
      /* camada ausente nesta versão do estilo */
    }
  }
  for (const [id, props] of Object.entries(STYLE_TWEAKS.paint)) {
    if (!gl.getLayer(id)) continue;
    for (const [k, v] of Object.entries(props)) {
      try {
        gl.setPaintProperty(id, k, v);
      } catch {
        /* propriedade não se aplica a esta camada */
      }
    }
  }
}

function addRasterTiles(L, map, el) {
  const t = cfg();
  el.classList.add("map--raster");
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
  return tiles;
}

function addVectorTiles(L, map, el) {
  const t = cfg();
  const layer = vectorLayerFactory({
    style: t.vectorStyle,
    attributionControl: { customAttribution: t.vectorAttribution },
    interactive: false,
  }).addTo(map);
  el.classList.add("map--vector");
  // se o estilo não carregar (rede bloqueada etc.), troca para o mapa de ruas comum
  let styleOk = false;
  let swapped = false;
  const swap = (why) => {
    if (swapped || styleOk) return;
    swapped = true;
    console.warn("Mapa vetorial falhou, usando o mapa de ruas comum:", why);
    map.removeLayer(layer);
    el.classList.remove("map--vector");
    addRasterTiles(L, map, el);
  };
  map.whenReady(() => {
    const gl = layer.getMaplibreMap && layer.getMaplibreMap();
    if (!gl) return swap("sem mapa GL");
    gl.on("style.load", () => {
      styleOk = true;
      tweakStyle(gl);
    });
    gl.on("error", (e) => {
      if (!styleOk) swap(e && e.error ? e.error.message : e);
    });
    setTimeout(() => swap("tempo esgotado"), 8000);
  });
  return layer;
}

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
  map.attributionControl.setPrefix(false);
  // a roda do mouse só dá zoom depois de clicar no mapa
  map.on("click focus", () => map.scrollWheelZoom.enable());
  map.on("mouseout blur", () => map.scrollWheelZoom.disable());

  if (vectorLayerFactory) {
    try {
      addVectorTiles(L, map, el);
      return map;
    } catch (err) {
      console.warn("Mapa vetorial indisponível:", err);
    }
  }
  addRasterTiles(L, map, el);
  return map;
}
