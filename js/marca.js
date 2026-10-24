// "Com a cara da sua transportadora": troca cores e logo do painel de exemplo (marcas fictícias).
const NOMES = { rotav3: "ROTAV3", aurora: "Transportes Aurora", rubi: "Expresso Rubi", atlas: "Atlas Cargas" };

export function iniciarMarca() {
  const painel = document.querySelector("[data-marca-painel]");
  const botoes = [...document.querySelectorAll("[data-marcas] [data-marca]")];
  if (!painel || painel.dataset.pronto) return;
  painel.dataset.pronto = "1";
  const nome = painel.querySelector("[data-marca-nome]");
  botoes.forEach((b) =>
    b.addEventListener("click", () => {
      const m = b.dataset.marca;
      painel.dataset.tema = m;
      nome.textContent = NOMES[m] || m;
      botoes.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }),
  );
}
