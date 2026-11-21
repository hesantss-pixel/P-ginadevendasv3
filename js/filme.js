// Topo: as telas reais do sistema em cinco quadros (importar, mapa, rota, motorista, ao vivo).
// Avança sozinho, pausa fora da tela; com "reduzir movimento" fica parado e troca pelos botões.
const CENAS = [
  { titulo: "ROTAV3 · Pedidos", dur: 5200 },
  { titulo: "ROTAV3 · Mapa", dur: 5600 },
  { titulo: "ROTAV3 · Roteirização", dur: 5600 },
  { titulo: "ROTAV3 · Rota do motorista", dur: 5200 },
  { titulo: "ROTAV3 · Rotas — ao vivo", dur: 6400 },
];

export function iniciarFilme({ reduzir }) {
  const filme = document.getElementById("filme");
  if (!filme) return;
  const telas = [...filme.querySelectorAll("[data-tela]")];
  const titulo = filme.querySelector("[data-filme-titulo]");
  const botoes = [...document.querySelectorAll(".capitulos [data-ir]")];
  const btnPausa = document.querySelector(".capitulos [data-pausa]");
  if (!telas.length) return;

  let atual = 0;
  let pausado = reduzir;
  let visivel = false;
  let inicio = 0;
  let decorrido = 0;
  let raf = 0;

  function mostrar(n) {
    filme.dataset.cena = String(n);
    telas.forEach((t, i) => t.classList.toggle("on", i === n));
    // a próxima já começa a carregar, para a troca não piscar
    const prox = telas[(n + 1) % telas.length]?.querySelector("img");
    if (prox && prox.loading === "lazy") prox.loading = "eager";
    if (titulo) titulo.textContent = CENAS[n].titulo;
    botoes.forEach((b, i) => b.setAttribute("aria-pressed", String(i === n)));
  }
  function irPara(n) {
    atual = (n + CENAS.length) % CENAS.length;
    decorrido = 0;
    inicio = performance.now();
    mostrar(atual);
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

  irPara(0);
}
