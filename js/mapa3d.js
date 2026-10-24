// Mapa 3D da Grande São Paulo: pinos dos pedidos fictícios sobre a maquete, filtros e lista por cidade.
import { REGIAO } from "./dados-regiao.js";
import { esc, hhmm, kg } from "./dados.js";

export function iniciarMapa3d({ reduzir }) {
  const palco = document.querySelector("[data-m3d]");
  if (!palco || palco.dataset.pronto) return;
  palco.dataset.pronto = "1";
  const camada = palco.querySelector("[data-m3d-camada]");
  const dica = palco.querySelector("[data-m3d-dica]");
  const filtros = [...document.querySelectorAll("[data-m3d-filtros] button")];
  const listaCid = document.querySelector("[data-m3d-cidades]");
  const celular = window.matchMedia("(max-width: 700px)");

  const peds = REGIAO.pedidos;
  const contagem = {
    todos: peds.length,
    e: peds.filter((p) => p.tipo === "e").length,
    c: peds.filter((p) => p.tipo === "c").length,
    j: peds.filter((p) => p.j).length,
  };
  document.querySelectorAll("[data-m3d-filtros] [data-c]").forEach((b) => (b.textContent = contagem[b.dataset.c]));

  // cidades em ordem de pedidos
  const porCidade = new Map();
  for (const p of peds) porCidade.set(p.cidade, (porCidade.get(p.cidade) || 0) + 1);
  const cidades = [...porCidade.entries()].sort((a, b) => b[1] - a[1]);
  const max = cidades[0][1];
  const visiveis = cidades.slice(0, 8);
  const resto = cidades.slice(8).reduce((s, [, n]) => s + n, 0);
  listaCid.innerHTML =
    visiveis
      .map(
        ([c, n]) =>
          `<li><button type="button" aria-pressed="false" data-cidade="${esc(c)}"><span>${esc(c)}</span><i style="--p:${Math.round((n / max) * 100)}%"></i><b>${n}</b></button></li>`,
      )
      .join("") +
    (resto ? `<li><button type="button" aria-pressed="false" data-cidade="*outras"><span>Outras ${cidades.length - 8} cidades</span><i style="--p:${Math.round((resto / max) * 100)}%"></i><b>${resto}</b></button></li>` : "");
  const principais = new Set(visiveis.map(([c]) => c));

  let pinos = [];
  let filtro = "todos";
  let cidadeSel = null;

  function montar() {
    const v = celular.matches ? "m" : "d";
    camada.textContent = "";
    // rótulos das cidades com mais pedidos
    // rótulos das cidades (deslocados para não ficarem embaixo dos pinos)
    const rotulos = { "São Paulo": [-3, 13], "Mogi das Cruzes": [2, 1], "Santo André": [0, 0], Osasco: [-1, 1], Suzano: [0, 0], "São Bernardo do Campo": [0, 3], Barueri: [-2, 0], Cotia: [0, 0] };
    for (const [nome, [dx, dy]] of Object.entries(rotulos)) {
      const c = REGIAO.cidades[nome];
      if (!c || !c[v]) continue;
      const [x, y] = [c[v][0] + dx, c[v][1] + dy];
      if (x < 4 || x > 96 || y < 4 || y > 96) continue;
      const s = document.createElement("span");
      s.className = "cid3";
      s.style.left = `${x}%`;
      s.style.top = `${y + 3}%`;
      s.textContent = nome;
      camada.append(s);
    }
    pinos = peds.map((p, i) => {
      const [x, y] = p[v];
      const b = document.createElement("button");
      b.type = "button";
      b.className = `p3 ${p.tipo}${p.j ? " j" : ""}`;
      b.style.left = `${x}%`;
      b.style.top = `${y}%`;
      b.style.setProperty("--d", `${(i * 0.018).toFixed(3)}s`);
      b.setAttribute(
        "aria-label",
        `${p.tipo === "c" ? "Coleta" : "Entrega"} NF ${p.nf}, ${p.cidade}, ${p.peso} quilos${p.j ? `, horário ${hhmm(p.j[0])} a ${hhmm(p.j[1])}` : ""}`,
      );
      b.hidden = x < 0 || x > 100 || y < 0 || y > 100;
      b.dataset.i = i;
      camada.append(b);
      return b;
    });
    const [cx, cy] = REGIAO.cd[v];
    const cd = document.createElement("span");
    cd.className = "cd3";
    cd.style.left = `${cx}%`;
    cd.style.top = `${cy}%`;
    cd.textContent = "CD Guarulhos (exemplo)";
    camada.append(cd);
    aplicar();
  }

  function passa(p) {
    if (filtro === "e" && p.tipo !== "e") return false;
    if (filtro === "c" && p.tipo !== "c") return false;
    if (filtro === "j" && !p.j) return false;
    if (cidadeSel === "*outras") return !principais.has(p.cidade);
    if (cidadeSel && p.cidade !== cidadeSel) return false;
    return true;
  }
  function aplicar() {
    pinos.forEach((b) => b.classList.toggle("some", !passa(peds[+b.dataset.i])));
  }

  function mostrarDica(b) {
    const p = peds[+b.dataset.i];
    dica.innerHTML = `<b>${p.tipo === "c" ? "Coleta" : "Entrega"} · NF ${esc(p.nf)}</b>${esc(p.cidade)} · ${kg(p.peso)}${p.j ? `<br>Horário marcado: ${hhmm(p.j[0])}–${hhmm(p.j[1])}` : ""}${p.u ? "<br>Urgente" : ""}`;
    const r = b.getBoundingClientRect();
    const rp = palco.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - rp.left, 110), rp.width - 110);
    dica.style.left = `${x}px`;
    dica.style.top = `${r.top - rp.top}px`;
    dica.classList.add("mostra");
  }
  const esconderDica = () => dica.classList.remove("mostra");
  camada.addEventListener("pointerover", (e) => {
    const b = e.target.closest(".p3");
    if (b) mostrarDica(b);
  });
  camada.addEventListener("pointerout", (e) => {
    if (e.target.closest(".p3")) esconderDica();
  });
  camada.addEventListener("focusin", (e) => {
    const b = e.target.closest(".p3");
    if (b) mostrarDica(b);
  });
  camada.addEventListener("focusout", esconderDica);
  camada.addEventListener("click", (e) => {
    const b = e.target.closest(".p3");
    if (b) mostrarDica(b);
  });

  filtros.forEach((btn) =>
    btn.addEventListener("click", () => {
      filtro = btn.dataset.f;
      filtros.forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
      aplicar();
    }),
  );
  listaCid.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cidade]");
    if (!b) return;
    const c = b.dataset.cidade;
    cidadeSel = cidadeSel === c ? null : c;
    listaCid.querySelectorAll("[data-cidade]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cidade === cidadeSel)));
    aplicar();
  });

  montar();
  celular.addEventListener("change", montar);

  // os pinos "caem" na maquete quando a seção aparece (uma vez)
  if (!reduzir) {
    pinos.forEach((b) => (b.style.opacity = "0"));
    new IntersectionObserver(
      ([en], obs) => {
        if (!en.isIntersecting) return;
        obs.disconnect();
        pinos.forEach((b) => {
          b.style.opacity = "";
          b.classList.add("cai");
          // tira a animação no fim, para o filtro poder apagar o pino
          b.addEventListener("animationend", () => b.classList.remove("cai"), { once: true });
        });
      },
      { threshold: 0.35 },
    ).observe(palco);
  }
}
