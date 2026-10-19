// Painel interativo da seção "Planejamento": abas Entregas/Coletas, lista de paradas na ordem
// da rota, mapa de ruas com as paradas numeradas, resumo da rota e capacidade do veículo.
// Todos os pedidos são DEMONSTRATIVOS (js/data.js).
import { loadLeaflet, createMap, esc } from "./leafletmap.js";
import { ORDERS, DEPOT_GEO, VEHICLE_CAPACITY_KG, fmtKg } from "./data.js";

const KIND_TEXT = { entrega: "Entrega", coleta: "Coleta" };
const volumes = (n) => `${n} volume${n > 1 ? "s" : ""}`;

export function initPlanMap({ reduceMotion = false } = {}) {
  const root = document.getElementById("plan-map");
  if (!root) return;
  const list = document.getElementById("lista-pedidos");
  const tabs = [...document.querySelectorAll(".tabs .tab")];
  const zoomBtns = document.querySelectorAll(".map__zoom button");

  let active = "entrega";
  let selectedId = null;
  let api = null; // preenchido quando o mapa carrega

  /* ---------- lista e resumo (funcionam mesmo antes de o mapa carregar) ---------- */
  function renderList() {
    const o = ORDERS[active];
    list.innerHTML = "";
    o.items.forEach((it, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<button type="button" class="order" aria-pressed="false" data-id="${esc(it.id)}">
        <span class="order__seq" style="background:${o.color}" aria-label="Parada ${i + 1}">${i + 1}</span>
        <span><strong>${esc(it.id)} · ${esc(it.area === "Centro" ? it.city : it.area)}</strong><small>${esc(it.area === "Centro" ? "Centro" : it.city)} · ${volumes(it.vol)} · ${fmtKg(it.kg)}</small></span></button>`;
      li.firstElementChild.addEventListener("click", () => select(it.id, true));
      list.appendChild(li);
    });
    const total = o.items.reduce((s, i) => s + i.kg, 0);
    document.getElementById("st-dist").textContent = o.distance;
    document.getElementById("st-time").textContent = o.time;
    document.getElementById("st-weight").textContent = fmtKg(total).replace(",0 kg", " kg");
    document.getElementById("st-stops").textContent = o.items.length;
    document.getElementById("st-stops-label").textContent = o.label;
    const pct = Math.round((total / VEHICLE_CAPACITY_KG) * 100);
    document.getElementById("cap-pct").textContent = pct + "%";
    document.getElementById("cap-bar").style.width = pct + "%";
  }

  function select(id, fromList) {
    selectedId = id;
    list
      .querySelectorAll(".order")
      .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    if (api) api.focusStop(id, fromList);
  }

  function setTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    list.setAttribute("aria-labelledby", tab.id);
    active = tab.dataset.kind;
    selectedId = null;
    renderList();
    if (api) api.showKind(active);
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

  /* ---------- mapa de ruas ---------- */
  function buildMap(L) {
    const map = createMap(L, root, { reduceMotion, zoomControl: false });
    const depotLL = [DEPOT_GEO.lat, DEPOT_GEO.lng];
    const groups = {};
    const markers = {};

    L.marker(depotLL, {
      icon: L.divIcon({
        className: "mk-wrap",
        html: '<span class="mk mk--cd"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 5l9 5.5V20H3z"/><path d="M8 20v-6h8v6"/></svg></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -12],
      }),
      title: `${DEPOT_GEO.name} (demonstrativo)`,
      keyboard: false,
      zIndexOffset: 500,
    })
      .bindPopup(
        `<div class="mpop"><strong>${DEPOT_GEO.name}</strong><span>Saída e volta da rota</span></div>`,
      )
      .addTo(map);

    for (const [kind, g] of Object.entries(ORDERS)) {
      const pts = g.items.map((o) => [o.lat, o.lng]);
      // linha pontilhada = ordem das paradas (não é o trajeto pelas ruas)
      const seqLine = L.polyline([depotLL, ...pts, depotLL], {
        color: g.color,
        weight: 3.5,
        opacity: 0.9,
        dashArray: "1 9",
        lineCap: "round",
        interactive: false,
      });
      const seqHalo = L.polyline([depotLL, ...pts, depotLL], {
        color: "#ffffff",
        weight: 7,
        opacity: 0.7,
        lineCap: "round",
        interactive: false,
      });
      // pontos pequenos da outra aba, só para dar contexto
      const ghosts = g.items.map((o) =>
        L.circleMarker([o.lat, o.lng], {
          radius: 4.5,
          color: "#ffffff",
          weight: 1.5,
          fillColor: g.color,
          fillOpacity: 0.55,
          interactive: false,
        }),
      );
      markers[kind] = {};
      const stops = g.items.map((o, i) => {
        const text = `Parada ${i + 1}: ${KIND_TEXT[kind].toLowerCase()} do pedido ${o.id}, ${o.city}`;
        const m = L.marker([o.lat, o.lng], {
          icon: L.divIcon({
            className: "mk-wrap",
            html: `<span class="mk mk--seq" style="--c:${g.color}">${i + 1}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -13],
          }),
          title: text,
          riseOnHover: true,
        }).bindPopup(
          `<div class="mpop"><span class="mpop__kind mpop__kind--${kind}">${KIND_TEXT[kind]} · parada ${i + 1}</span><strong>Pedido ${esc(o.id)}</strong><span>${esc(o.city)} — ${esc(o.area)}</span><span>${volumes(o.vol)} · ${fmtKg(o.kg)}</span></div>`,
          { autoPanPadding: [24, 24] },
        );
        m.on("add", () => {
          const el = m.getElement();
          el.setAttribute("role", "button");
          el.setAttribute("aria-label", text);
        });
        m.on("click", () => select(o.id, false));
        m.on("popupopen", () => m.getElement()?.classList.add("is-active"));
        m.on("popupclose", () => m.getElement()?.classList.remove("is-active"));
        markers[kind][o.id] = m;
        return m;
      });
      groups[kind] = {
        route: L.layerGroup([seqHalo, seqLine, ...stops]),
        ghosts: L.layerGroup(ghosts),
        bounds: L.latLngBounds([depotLL, ...pts]),
      };
    }

    const fitActive = (animate) =>
      map.fitBounds(groups[active].bounds, {
        paddingTopLeft: [34, 58],
        paddingBottomRight: [64, 34],
        maxZoom: 13,
        animate: animate && !reduceMotion,
      });

    function showKind(kind) {
      map.closePopup();
      for (const [k, g] of Object.entries(groups)) {
        if (k === kind) {
          map.removeLayer(g.ghosts);
          map.addLayer(g.route);
        } else {
          map.removeLayer(g.route);
          map.addLayer(g.ghosts);
        }
      }
      fitActive(true);
    }
    function focusStop(id, pan) {
      const m = markers[active][id];
      if (!m) return;
      if (pan && !map.getBounds().pad(-0.12).contains(m.getLatLng()))
        map.panTo(m.getLatLng(), { animate: !reduceMotion });
      m.openPopup();
    }

    zoomBtns.forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.zoom === "in") map.zoomIn();
        else if (b.dataset.zoom === "out") map.zoomOut();
        else fitActive(true);
      }),
    );

    showKind(active);
    fitActive(false);
    return { map, showKind, focusStop };
  }

  const start = () =>
    loadLeaflet()
      .then((L) => {
        api = buildMap(L);
        root.closest(".app__map").classList.add("is-ready");
        if (selectedId) api.focusStop(selectedId, true);
        window.__rotav3 = Object.assign(window.__rotav3 || {}, { plan: api });
      })
      .catch((err) => {
        console.warn("Mapa do painel indisponível:", err);
        root.classList.add("is-failed");
        root.textContent = "Não foi possível carregar o mapa agora.";
      });

  if (!("IntersectionObserver" in window)) return start();
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      start();
    },
    { rootMargin: "500px 0px" },
  );
  io.observe(root);
}
