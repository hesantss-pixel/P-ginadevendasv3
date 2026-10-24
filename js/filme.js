// Filme do topo: as telas do sistema em cinco cenas (importar, mapa, rota, envio, ao vivo).
// Tudo em HTML/SVG, com dados fictícios. Com "reduzir movimento", mostra cada cena já pronta.
import { CD, ROTA_FILME, PEDIDOS_PLANO, hhmm, esc } from "./dados.js";
import { proj, el, pino, marcadorCD, numero, caminhoRota } from "./mapa-filme.js";

const CENAS = [
  { pg: "pedidos", titulo: "Pedidos", sub: "Entregas e coletas por região e importação das notas fiscais", dur: 6800 },
  { pg: "mapa", titulo: "Mapa", sub: "Entregas e coletas pendentes — atualizado ao vivo", dur: 5600 },
  { pg: "rot", titulo: "Roteirização", sub: "Escolha o veículo e a capacidade e gere a melhor sequência de entregas e coletas", dur: 7600 },
  { pg: "rotas", titulo: "Rotas", sub: "Rotas confirmadas e despachadas — histórico salvo", dur: 6400 },
  { pg: "rotas", titulo: "Rotas", sub: "Rotas confirmadas e despachadas — histórico salvo", dur: 8600 },
];

// pedidos que aparecem no recorte do mapa
const NO_MAPA = PEDIDOS_PLANO.filter((p) => p.lng >= -46.6 && p.lng <= -46.37 && p.lat >= -23.53 && p.lat <= -23.39);

export function iniciarFilme({ reduzir }) {
  const filme = document.getElementById("filme");
  if (!filme) return;
  const $ = (s) => filme.querySelector(s);
  const botoes = [...document.querySelectorAll(".capitulos [data-ir]")];
  const btnPausa = document.querySelector(".capitulos [data-pausa]");

  // ---------- montagem (uma vez) ----------
  const nE = NO_MAPA.filter((p) => p.tipo === "entrega").length;
  const nC = NO_MAPA.length - nE;
  $("[data-n-todos]").textContent = NO_MAPA.length;
  $("[data-n-ent]").textContent = nE;
  $("[data-n-col]").textContent = nC;
  $("[data-imp-msg]").textContent = `✅ ${NO_MAPA.length} notas importadas: ${nE} entregas e ${nC} coletas.`;
  filme.querySelector(".res__nota").textContent =
    `Esta viagem levou ${ROTA_FILME.paradas.length} de ${NO_MAPA.length} pedidos. Os outros continuam pendentes.`;

  const tab = $("[data-tab-pedidos]");
  // tabela: entregas e coletas misturadas, como aparecem depois de importar
  const ents = NO_MAPA.filter((p) => p.tipo === "entrega");
  const cols = NO_MAPA.filter((p) => p.tipo === "coleta");
  const linhasTab = [...ents.slice(0, 3), cols[0], ...ents.slice(3, 6), cols[1], ents[6]].filter(Boolean);
  tab.innerHTML = linhasTab
    .map(
      (p) => `<div class="tab__lin"><span class="nf">${esc(p.nf)}</span><span class="dst">${esc(p.dest)}</span>
        <span class="cid">${esc(p.bairro)}, ${esc(p.cidade)}</span><span class="peso">${p.peso} kg</span>
        <span class="tipo ${p.tipo === "coleta" ? "c" : "e"}">${p.tipo}</span></div>`,
    )
    .join("");
  const linhas = [...tab.children];

  const gPinos = $("[data-mf-pinos]");
  const pinos = NO_MAPA.map((p, i) => {
    const g = pino(p);
    g.dataset.nf = p.nf;
    g.style.setProperty("--d", `${(i * 0.07).toFixed(2)}s`);
    gPinos.append(g);
    return g;
  });
  $("[data-mf-cd]").append(marcadorCD(CD));
  const rota = $("[data-mf-rota]");
  rota.setAttribute("d", caminhoRota(CD, ROTA_FILME.paradas));
  const gNums = $("[data-mf-nums]");
  const nums = ROTA_FILME.paradas.map((p, i) => {
    const g = numero(p, i);
    gNums.append(g);
    return g;
  });
  const naRota = new Set(ROTA_FILME.paradas.map((p) => p.nf));

  const lista = $("[data-res-lista]");
  lista.innerHTML = ROTA_FILME.paradas
    .map((p, i) => {
      const jan = p.janela ? ` · <em>horário ${hhmm(p.janela[0])}–${hhmm(p.janela[1])}</em>` : "";
      return `<li><span class="n ${p.tipo === "coleta" ? "c" : "e"}">${i + 1}</span>
        <span class="d"><b>${esc(p.dest)}</b><small>${p.tipo === "coleta" ? "Coleta" : "Entrega"} · NF ${esc(p.nf)}${jan}</small></span>
        <time>${hhmm(p.chegada)}</time></li>`;
    })
    .join("");
  const itensRes = [...lista.children];

  const chips = $("[data-chips]");
  chips.innerHTML = ROTA_FILME.paradas
    .map(
      (p, i) =>
        `<li><b>${i + 1}.</b> ${p.tipo === "coleta" ? "Coleta" : "Entrega"} NF ${esc(p.nf)} · ${esc(p.bairro)}<span></span></li>`,
    )
    .join("");
  const itensChip = [...chips.children];

  const cel = filme.querySelector(".filme__cel");
  const celLista = cel.querySelector("[data-cel-lista]");
  const celProg = cel.querySelector("[data-cel-prog]");
  const celProgTxt = cel.querySelector("[data-cel-prog-txt]");
  const HORAS_BAIXA = ["07:58", "08:26", "09:07"];

  function desenharCelular(feitas, toque = -1) {
    celLista.innerHTML = ROTA_FILME.paradas
      .slice(0, 4)
      .map((p, i) => {
        const ok = i < feitas;
        const prox = i === feitas;
        const verbo = p.tipo === "coleta" ? "Coletado" : "Entregue";
        return `<li class="${ok ? "ok" : ""} ${prox ? "prox" : ""} ${i === toque ? "toque" : ""}">
          <b>${i + 1}. ${esc(p.dest)}</b><small>${esc(p.bairro)} · previsto ~${hhmm(p.chegada)}</small>
          ${ok ? `<div class="feito">✓ ${verbo} às ${HORAS_BAIXA[i] || hhmm(p.chegada + 6)}</div>` : prox ? `<div class="acoes"><span class="ok">${verbo}</span><span class="nok">Não realizado</span></div>` : ""}
        </li>`;
      })
      .join("");
    celProg.style.width = `${(feitas / ROTA_FILME.paradas.length) * 100}%`;
    celProgTxt.textContent = `${feitas} de ${ROTA_FILME.paradas.length}`;
  }

  const progTxt = $("[data-prog-txt]");
  const prog = $("[data-prog]");
  function baixas(n) {
    itensChip.forEach((li, i) => {
      li.classList.toggle("ok", i < n);
      li.querySelector("span").textContent = i < n ? `✓ entregue ${HORAS_BAIXA[i]}` : "";
    });
    nums.forEach((g, i) => g.classList.toggle("feito", i < n));
    progTxt.textContent = `${n} de ${ROTA_FILME.paradas.length} paradas com baixa`;
    prog.style.width = `${(n / ROTA_FILME.paradas.length) * 100}%`;
  }

  // caminhão
  const caminhao = $("[data-mf-caminhao]");
  const pontos = [CD, ...ROTA_FILME.paradas].map(proj);
  function posCaminhao([x, y]) {
    caminhao.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  }
  let rafCaminhao = 0;
  function andar(de, ate, ms) {
    cancelAnimationFrame(rafCaminhao);
    const [a, b] = [pontos[de], pontos[ate]];
    const t0 = performance.now();
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      posCaminhao([a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]);
      if (k < 1) rafCaminhao = requestAnimationFrame(passo);
    };
    rafCaminhao = requestAnimationFrame(passo);
  }

  // ---------- cenas ----------
  const titulo = $("[data-titulo]");
  const sub = $("[data-sub]");
  const navItens = [...filme.querySelectorAll(".app__nav [data-pg]")];
  const filtroBtns = [...filme.querySelectorAll(".mf__filtro span")];
  let timers = [];
  const depois = (ms, fn) => timers.push(setTimeout(fn, ms));
  const limpar = () => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(rafCaminhao);
  };
  const ESTADOS = ["importou", "apertou", "calculando", "roteirizou", "enviou", "abriu"];

  function rotaPronta(animar) {
    filme.classList.add("roteirizou");
    pinos.forEach((g) => g.classList.toggle("apaga", !naRota.has(g.dataset.nf)));
    rota.classList.remove("desenha");
    if (animar) {
      rota.getBoundingClientRect();
      rota.classList.add("desenha");
      nums.forEach((g, i) => depois(350 + i * 300, () => g.classList.add("mostra")));
      itensRes.forEach((li, i) => depois(250 + i * 140, () => li.classList.add("mostra")));
    } else {
      rota.style.transition = "none";
      rota.classList.add("desenha");
      rota.getBoundingClientRect();
      rota.style.transition = "";
      nums.forEach((g) => g.classList.add("mostra"));
      itensRes.forEach((li) => li.classList.add("mostra"));
    }
  }

  function montar(n, animar) {
    limpar();
    filme.dataset.cena = String(n);
    filme.classList.remove(...ESTADOS);
    const c = CENAS[n];
    titulo.textContent = c.titulo;
    sub.textContent = c.sub;
    navItens.forEach((s) => s.classList.toggle("on", s.dataset.pg === c.pg));
    botoes.forEach((b, i) => b.setAttribute("aria-pressed", String(i === n)));
    // estado-base de cada elemento
    linhas.forEach((l) => l.classList.remove("mostra"));
    pinos.forEach((g) => g.classList.remove("cai", "apaga"));
    rota.classList.remove("desenha");
    nums.forEach((g) => g.classList.remove("mostra", "feito"));
    itensRes.forEach((li) => li.classList.remove("mostra"));
    filtroBtns.forEach((b, i) => b.classList.toggle("on", i === 0));
    caminhao.classList.remove("mostra");
    baixas(0);
    desenharCelular(0);

    if (n === 0) {
      if (!animar) {
        filme.classList.add("importou");
        linhas.forEach((l) => l.classList.add("mostra"));
        return;
      }
      depois(1300, () => filme.classList.add("importou"));
      linhas.forEach((l, i) => depois(1500 + i * 150, () => l.classList.add("mostra")));
    }
    if (n === 1) {
      if (!animar) return;
      pinos.forEach((g) => g.classList.add("cai"));
      depois(3000, () => {
        filtroBtns.forEach((b, i) => b.classList.toggle("on", i === 2));
        pinos.forEach((g) => g.classList.toggle("apaga", !g.classList.contains("c")));
      });
      depois(4500, () => {
        filtroBtns.forEach((b, i) => b.classList.toggle("on", i === 0));
        pinos.forEach((g) => g.classList.remove("apaga"));
      });
    }
    if (n === 2) {
      if (!animar) return rotaPronta(false);
      depois(1500, () => filme.classList.add("apertou"));
      depois(1750, () => filme.classList.replace("apertou", "calculando"));
      depois(2600, () => {
        filme.classList.remove("calculando");
        rotaPronta(true);
      });
    }
    if (n === 3) {
      rotaPronta(false);
      if (!animar) {
        filme.classList.add("enviou", "abriu");
        return;
      }
      depois(1200, () => filme.classList.add("enviou"));
      depois(3700, () => filme.classList.add("abriu"));
    }
    if (n === 4) {
      rotaPronta(false);
      filme.classList.add("enviou", "abriu");
      caminhao.classList.add("mostra");
      if (!animar) {
        posCaminhao(pontos[3]);
        baixas(3);
        desenharCelular(3);
        return;
      }
      posCaminhao(pontos[0]);
      const seg = 1300;
      [1, 2, 3].forEach((k, i) => {
        const t = 500 + i * (seg + 1100);
        depois(t, () => andar(k - 1, k, seg));
        depois(t + seg + 150, () => desenharCelular(k - 1, k - 1));
        depois(t + seg + 600, () => {
          baixas(k);
          desenharCelular(k);
        });
      });
    }
  }

  // ---------- linha do tempo (avança sozinha; pausa fora da tela) ----------
  let atual = 2;
  let pausado = reduzir; // quem pediu menos movimento vê as cenas paradas e troca pelos botões
  let visivel = false;
  let inicio = 0;
  let decorrido = 0;
  let raf = 0;

  function irPara(n, animar = !reduzir) {
    atual = (n + CENAS.length) % CENAS.length;
    decorrido = 0;
    inicio = performance.now();
    montar(atual, animar);
    pintarProgresso();
  }
  function pintarProgresso() {
    botoes.forEach((b, i) => b.style.setProperty("--prog", i === atual ? (pausado ? 1 : Math.min(1, decorrido / CENAS[atual].dur)) : 0));
  }
  function tique(t) {
    raf = 0;
    if (pausado || !visivel || document.hidden) return;
    decorrido = t - inicio;
    pintarProgresso();
    if (decorrido >= CENAS[atual].dur) irPara(atual + 1);
    raf = requestAnimationFrame(tique);
  }
  function rodar() {
    if (raf || pausado || !visivel || document.hidden) return;
    inicio = performance.now() - decorrido;
    raf = requestAnimationFrame(tique);
  }
  function parar() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  botoes.forEach((b) =>
    b.addEventListener("click", () => {
      irPara(+b.dataset.ir);
      rodar();
    }),
  );
  function definirPausa(p) {
    pausado = p;
    filme.classList.toggle("pausado", p);
    btnPausa.setAttribute("aria-label", p ? "Continuar a demonstração" : "Pausar a demonstração");
    btnPausa.querySelector("[data-ic-pausa]").hidden = p;
    btnPausa.querySelector("[data-ic-play]").hidden = !p;
    if (p) parar();
    else rodar();
    pintarProgresso();
  }
  btnPausa.addEventListener("click", () => definirPausa(!pausado));
  if (reduzir) definirPausa(true);

  new IntersectionObserver(
    ([e]) => {
      visivel = e.isIntersecting;
      if (visivel) rodar();
      else parar();
    },
    { threshold: 0.25 },
  ).observe(filme);
  document.addEventListener("visibilitychange", () => (document.hidden ? parar() : rodar()));

  // começa mostrando a rota pronta (o quadro mais importante) e depois volta ao início do fluxo
  irPara(2, !reduzir);
}
