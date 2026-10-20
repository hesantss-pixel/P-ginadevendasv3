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
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -14],
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
      // linha = ordem das paradas (liga os pontos em linha reta; não é o trajeto pelas ruas).
      // Visual de rota dos aplicativos de mapa: contorno branco, linha colorida e um brilho que
      // corre no sentido da rota.
      const path = [depotLL, ...pts, depotLL];
      const seqHalo = L.polyline(path, {
        color: "#ffffff",
        weight: 9,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      });
      const seqLine = L.layerGroup([
        L.polyline(path, {
          color: g.color,
          weight: 4.5,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }),
        L.polyline(path, {
          color: "#ffffff",
          weight: 2.5,
          opacity: 0.85,
          dashArray: "2 16",
          lineCap: "round",
          className: reduceMotion ? "" : "route-flow",
          interactive: false,
        }),
      ]);
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
            html: `<span class="mk mk--seq mk--pin" style="--c:${g.color}"><b>${i + 1}</b></span>`,
            iconSize: [30, 38],
            iconAnchor: [15, 37],
            popupAnchor: [0, -34],
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

    /* ---------- rastreamento (SIMULAÇÃO do módulo opcional) ---------- */
    // Um veículo percorre a ordem das paradas (linha reta entre elas), para no ponto de cada
    // parada e volta ao centro de distribuição. Não usa nenhuma localização real.
    const trackBtn = root.parentElement.querySelector("[data-track-toggle]");
    const trackCard = root.parentElement.querySelector("[data-track]");
    const trackNext = trackCard && trackCard.querySelector("[data-track-next]");
    const van = L.marker(depotLL, {
      icon: L.divIcon({
        className: "mk-wrap mk-wrap--van",
        html: '<span class="mk mk--van"><svg class="ico" aria-hidden="true"><use href="#i-truck"/></svg></span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
      keyboard: false,
      interactive: false,
      zIndexOffset: 1000,
    });
    const tracker = { on: false, raf: 0, visible: true, plan: null, t: 0, last: 0, label: "" };
    function buildPlan(kind) {
      const items = ORDERS[kind].items;
      const pts = [depotLL, ...items.map((o) => [o.lat, o.lng]), depotLL];
      const k = Math.cos((DEPOT_GEO.lat * Math.PI) / 180);
      const lens = pts.slice(1).map((b, i) => Math.hypot(b[0] - pts[i][0], (b[1] - pts[i][1]) * k));
      const sum = lens.reduce((x, y) => x + y, 0);
      const segs = [];
      let T = 0;
      lens.forEach((len, i) => {
        const travel = 1.2 + (len / sum) * 18; // segundos: a volta inteira leva ~40 s
        const dwell = i < items.length ? 1.1 : 0.6;
        segs.push({ a: pts[i], b: pts[i + 1], start: T, travel, dwell, i });
        T += travel + dwell;
      });
      return { segs, total: T, items };
    }
    function trackAt(time) {
      const plan = tracker.plan;
      const t = time % plan.total;
      const seg = plan.segs.find((s) => t < s.start + s.travel + s.dwell) || plan.segs.at(-1);
      const u = Math.min(1, (t - seg.start) / seg.travel);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; // acelera e freia
      van.setLatLng([seg.a[0] + (seg.b[0] - seg.a[0]) * e, seg.a[1] + (seg.b[1] - seg.a[1]) * e]);
      const n = seg.i + 1;
      const item = plan.items[seg.i];
      let label;
      const place = item && (item.area === "Centro" ? item.city : item.area);
      if (n > plan.items.length) label = "Voltando ao centro de distribuição";
      else if (u >= 1) label = `Na parada ${n} · ${place}`;
      else label = `Próxima parada: ${n} · ${place}`;
      if (label !== tracker.label && trackNext) trackNext.textContent = tracker.label = label;
    }
    function loop(ts) {
      tracker.raf = 0;
      if (!tracker.on || !tracker.visible || document.hidden) return;
      const dt = tracker.last ? Math.min(0.1, (ts - tracker.last) / 1000) : 0;
      tracker.last = ts;
      tracker.wall = performance.now();
      tracker.t += dt;
      trackAt(tracker.t);
      tracker.raf = requestAnimationFrame(loop);
    }
    function kick() {
      if (tracker.raf || !tracker.on || reduceMotion) return;
      tracker.last = 0;
      tracker.wall = performance.now();
      tracker.raf = requestAnimationFrame(loop);
    }
    // vigia: se o navegador deixar de chamar a animação (aconteceu em testes), ela recomeça
    setInterval(() => {
      if (!tracker.on || reduceMotion || !tracker.visible || document.hidden) return;
      if (performance.now() - (tracker.wall || 0) < 700) return;
      cancelAnimationFrame(tracker.raf);
      tracker.raf = 0;
      kick();
    }, 1000);
    function setTracking(on) {
      tracker.on = on;
      if (trackBtn) trackBtn.setAttribute("aria-pressed", String(on));
      if (trackCard) trackCard.hidden = !on;
      if (!on) {
        cancelAnimationFrame(tracker.raf);
        tracker.raf = 0;
        map.removeLayer(van);
        return;
      }
      van.addTo(map);
      // com "reduzir movimento", o veículo fica parado a caminho da 3ª parada
      if (reduceMotion) trackAt(tracker.plan.segs[2].start + tracker.plan.segs[2].travel * 0.5);
      else {
        trackAt(tracker.t);
        kick();
      }
    }
    function resetTracking(kind) {
      tracker.plan = buildPlan(kind);
      tracker.t = 0;
      tracker.label = "";
      if (tracker.on) setTracking(true);
    }
    new IntersectionObserver((en) => {
      tracker.visible = en.some((x) => x.isIntersecting);
      kick();
    }).observe(root);
    document.addEventListener("visibilitychange", kick);
    if (trackBtn) {
      trackBtn.hidden = false;
      trackBtn.addEventListener("click", () => setTracking(!tracker.on));
    }

    function showKind(kind) {
      map.closePopup();
      resetTracking(kind);
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
    setTracking(true);
    return { map, showKind, focusStop, setTracking, tracker };
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
