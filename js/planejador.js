// Planejador interativo ("Monte uma rota agora"): mesmas escolhas da tela de roteirização do sistema,
// com pedidos fictícios e a rota calculada no navegador (js/roteiro.js).
import { loadLeaflet, createMap } from "./leafletmap.js";
import { CD, PEDIDOS_PLANO, VEICULOS, hhmm, kg, esc } from "./dados.js";
import { roteirizar } from "./roteiro.js";

const tempo = (min) => {
  const m = Math.round(min);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
};
const km = (n) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

export async function iniciarPlanejador({ reduzir }) {
  const form = document.querySelector("[data-plan-form]");
  const caixaRes = document.querySelector("[data-plan-res]");
  const mapaEl = document.getElementById("plan-mapa");
  if (!form || form.dataset.pronto) return;
  form.dataset.pronto = "1";

  // veículos
  const vWrap = form.querySelector("[data-plan-veiculos]");
  vWrap.innerHTML = VEICULOS.map(
    (v) =>
      `<label><input type="radio" name="veiculo" value="${v.id}"${v.id === "vuc" ? " checked" : ""} /><span>${esc(v.nome)}<small>${kg(v.cap)}</small></span></label>`,
  ).join("");
  form.addEventListener("change", (e) => {
    if (e.target.name === "veiculo") form.elements.cap.value = VEICULOS.find((v) => v.id === e.target.value).cap;
  });
  const saidaMax = form.querySelector("[data-plan-max-txt]");
  form.elements.max.addEventListener("input", () => (saidaMax.textContent = form.elements.max.value));

  let pendentes = PEDIDOS_PLANO.map((p) => ({ ...p }));
  let viagem = 0;
  let ultimo = null;
  let L = null;
  let mapa = null;
  let camadaPinos = null;
  let camadaRota = null;

  function dicaPedido(p) {
    const jan = p.janela ? `<br>Horário: ${hhmm(p.janela[0])}–${hhmm(p.janela[1])}` : "";
    return `<b>${esc(p.dest)}</b><br>${p.tipo === "coleta" ? "Coleta" : "Entrega"} · NF ${esc(p.nf)} · ${kg(p.peso)}<br>${esc(p.bairro)}, ${esc(p.cidade)}${jan}`;
  }

  function desenharPendentes(naRota) {
    if (!mapa) return;
    camadaPinos.clearLayers();
    for (const p of pendentes) {
      if (naRota.has(p.nf)) continue;
      const fora = ultimo !== null;
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="pmk ${p.tipo === "coleta" ? "c" : "e"}${fora ? " fora" : ""}" style="width:16px;height:16px"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        keyboard: false,
      })
        .bindTooltip(dicaPedido(p), { className: "dica", direction: "top", offset: [0, -8] })
        .addTo(camadaPinos);
    }
  }

  function desenharRota(r) {
    if (!mapa) return;
    camadaRota.clearLayers();
    const naRota = new Set(r.paradas.map((p) => p.nf));
    desenharPendentes(naRota);
    if (!r.paradas.length) return;
    const pts = [[CD.lat, CD.lng], ...r.paradas.map((p) => [p.lat, p.lng]), [CD.lat, CD.lng]];
    L.polyline(pts, { color: "#ffffff", weight: 8, opacity: 0.85, interactive: false }).addTo(camadaRota);
    const linha = L.polyline(pts, { color: "#e09c12", weight: 4.5, opacity: 1, interactive: false, className: reduzir ? "" : "rota-linha" }).addTo(camadaRota);
    if (!reduzir && linha._path) {
      const len = Math.ceil(linha._path.getTotalLength());
      linha._path.style.setProperty("--len", len);
      linha._path.addEventListener(
        "animationend",
        () => {
          linha._path.classList.remove("rota-linha");
          linha._path.style.removeProperty("--len");
        },
        { once: true },
      );
    }
    r.paradas.forEach((p, i) => {
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="pnum ${p.tipo === "coleta" ? "c" : "e"}" style="width:28px;height:28px;--d:${reduzir ? 0 : (0.25 + i * 0.09).toFixed(2)}s">${i + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 500 + i,
        keyboard: false,
      })
        .bindTooltip(`${dicaPedido(p)}<br><b>Chega às ${hhmm(p.inicio)}</b>`, { className: "dica", direction: "top", offset: [0, -14] })
        .addTo(camadaRota);
    });
    mapa.flyToBounds(L.latLngBounds(pts), { padding: [40, 40], duration: reduzir ? 0 : 0.8, maxZoom: 14 });
  }

  // ---------- resultado ----------
  function mostrarResultado(r, op) {
    const v = VEICULOS.find((x) => x.id === op.veiculo);
    const nE = r.paradas.filter((p) => p.tipo === "entrega").length;
    const nC = r.paradas.length - nE;
    const nome = `${v ? v.nome : "Veículo"} · ${plural(r.paradas.length, "parada", "paradas")}`;
    if (!r.paradas.length) {
      caixaRes.innerHTML = `<div class="pr__cab"><b>Viagem ${viagem}</b></div>
        <p class="pr__aviso pr__aviso--x">Nenhum pedido ${op.tipos.length > 1 ? "" : op.tipos[0] === "coleta" ? "de coleta " : "de entrega "}cabe nesta viagem com essas opções. Aumente a capacidade, mude a hora de saída ou escolha outro tipo.</p>
        ${r.foraJanela.length ? avisoJanela(r, op) : ""}
        <div class="pr__acoes"><button type="button" data-plan-recomecar>Recomeçar com todos os pedidos</button></div>`;
      return;
    }
    const tipos = nE && nC ? `${plural(nE, "entrega", "entregas")}, ${plural(nC, "coleta", "coletas")}` : nC ? plural(nC, "coleta", "coletas") : plural(nE, "entrega", "entregas");
    const usoPct = Math.round((r.cargaMax / op.cap) * 100);
    const carga =
      nE && nC
        ? `Sai do CD com <b>${kg(r.cargaSaida)}</b> de entregas e volta com <b>${kg(r.cargaRetorno)}</b> de coletas (máximo a bordo: ${usoPct}% da capacidade).`
        : nC
          ? `Volta ao CD com <b>${kg(r.cargaRetorno)}</b> de coletas (${usoPct}% da capacidade).`
          : `Sai do CD com <b>${kg(r.cargaSaida)}</b> (${usoPct}% da capacidade).`;
    const itens = r.paradas
      .map((p, i) => {
        const jan = p.janela ? ` · <em>horário ${hhmm(p.janela[0])}–${hhmm(p.janela[1])}</em>` : "";
        const espera = p.espera > 0.5 ? `<small>aguarda ${Math.round(p.espera)} min</small>` : "";
        return `<li><span class="n ${p.tipo === "coleta" ? "c" : "e"}">${i + 1}</span>
          <span><b>${esc(p.dest)}</b><small>${p.tipo === "coleta" ? "Coleta" : "Entrega"} · NF ${esc(p.nf)} · ${esc(p.bairro)}${p.cidade !== "Guarulhos" ? `, ${esc(p.cidade)}` : ""}${jan}</small></span>
          <time>${hhmm(p.inicio)}${espera}</time></li>`;
      })
      .join("");
    const restam = r.total - r.paradas.length;
    caixaRes.innerHTML = `
      <div class="pr__cab"><b>Viagem ${viagem} · ${esc(nome)}</b><span>${tipos}</span></div>
      <div class="pr__kpis">
        <div><b>${km(r.km)}</b>distância</div>
        <div><b>${tempo(r.duracao)}</b>tempo total</div>
        <div><b>${hhmm(r.volta)}</b>volta ao CD</div>
      </div>
      <p class="pr__carga">${carga}</p>
      <ol class="pr__lista">${itens}</ol>
      <p class="pr__aviso">Esta viagem levou ${r.paradas.length} de ${plural(r.total, "pedido", "pedidos")}${restam ? `. ${restam === 1 ? "O outro continua pendente" : `Os outros ${restam} continuam pendentes`} para a próxima viagem.` : "."}</p>
      ${r.foraJanela.length ? avisoJanela(r, op) : ""}
      <div class="pr__acoes">
        ${restam ? '<button type="button" class="pr__prox" data-plan-proxima>Montar a próxima viagem</button>' : ""}
        <button type="button" data-plan-recomecar>Recomeçar</button>
      </div>`;
  }
  function avisoJanela(r, op) {
    const lista = r.foraJanela.map((p) => `NF ${esc(p.nf)} (${hhmm(p.janela[0])}–${hhmm(p.janela[1])})`).join(", ");
    return `<p class="pr__aviso pr__aviso--x">Fora da janela de horário: ${lista}. Saindo às ${hhmm(op.saida)}, não dá para chegar no horário marcado; ${r.foraJanela.length === 1 ? "o pedido fica" : "os pedidos ficam"} para outra viagem.</p>`;
  }

  function lerOpcoes() {
    const f = form.elements;
    const [h, m] = String(f.saida.value || "07:00").split(":").map(Number);
    const tipo = f.tipo.value;
    return {
      veiculo: f.veiculo.value,
      cd: CD,
      cap: Math.max(100, Math.min(40000, Number(f.cap.value) || 0)),
      maxParadas: Math.max(1, Math.min(20, Number(f.max.value) || 8)),
      saida: (h || 0) * 60 + (m || 0),
      tipos: tipo === "ambos" ? ["entrega", "coleta"] : [tipo],
    };
  }

  function gerar() {
    const op = lerOpcoes();
    viagem += 1;
    ultimo = roteirizar(pendentes, op);
    ultimo.op = op;
    mostrarResultado(ultimo, op);
    desenharRota(ultimo);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (ultimo) viagem -= 1; // gerar de novo substitui a viagem atual
    gerar();
  });
  // a primeira rota é gerada sozinha quando o mapa aparece, para já mostrar o resultado
  new IntersectionObserver(
    ([en], obs) => {
      if (!en.isIntersecting) return;
      obs.disconnect();
      if (!ultimo && viagem === 0) gerar();
    },
    { threshold: 0.45 },
  ).observe(mapaEl);

  caixaRes.addEventListener("click", (e) => {
    if (e.target.closest("[data-plan-proxima]") && ultimo) {
      const usados = new Set(ultimo.paradas.map((p) => p.nf));
      pendentes = pendentes.filter((p) => !usados.has(p.nf));
      ultimo = null;
      gerar();
      caixaRes.scrollTop = 0;
    }
    if (e.target.closest("[data-plan-recomecar]")) {
      pendentes = PEDIDOS_PLANO.map((p) => ({ ...p }));
      viagem = 0;
      ultimo = null;
      if (mapa) {
        camadaRota.clearLayers();
        desenharPendentes(new Set());
        mapa.flyToBounds(L.latLngBounds([[CD.lat, CD.lng], ...pendentes.map((p) => [p.lat, p.lng])]), { padding: [36, 36], duration: reduzir ? 0 : 0.8 });
      }
      caixaRes.innerHTML = '<p class="plan__vazio">Todos os pedidos voltaram a ficar pendentes. Escolha as opções e toque em <b>Gerar rota</b>.</p>';
    }
  });
  // ---------- mapa (carrega em paralelo; a lista funciona mesmo sem ele) ----------
  (async () => {
    try {
      L = await loadLeaflet();
      mapa = createMap(L, mapaEl, { reduceMotion: reduzir });
      camadaPinos = L.layerGroup().addTo(mapa);
      camadaRota = L.layerGroup().addTo(mapa);
      L.marker([CD.lat, CD.lng], {
        icon: L.divIcon({ className: "", html: '<div class="pcd" style="width:30px;height:30px">CD</div>', iconSize: [30, 30], iconAnchor: [15, 15] }),
        zIndexOffset: 1000,
        keyboard: false,
      })
        .bindTooltip(`<b>${esc(CD.nome)}</b><br>Ponto de saída e de volta das rotas`, { className: "dica", direction: "top", offset: [0, -14] })
        .addTo(mapa);
      mapa.fitBounds(L.latLngBounds([[CD.lat, CD.lng], ...pendentes.map((p) => [p.lat, p.lng])]), { padding: [36, 36] });
      if (ultimo) desenharRota(ultimo);
      else desenharPendentes(new Set());
    } catch (err) {
      console.warn("Mapa do planejador indisponível:", err);
      mapaEl.parentElement.classList.add("mapa--offline");
    }
  })();
}
