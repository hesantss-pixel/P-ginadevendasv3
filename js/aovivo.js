// "Ao vivo": a tela do motorista do sistema (modo demonstração) dentro de um celular e um painel do
// escritório que muda a cada baixa marcada. A tela do motorista avisa esta página por postMessage;
// nada sai do navegador de quem está testando.
import { SITE_CONFIG } from "./config.js";
import { CD, ROTA_FILME, esc } from "./dados.js";
import { proj, el, numero, marcadorCD, caminhoRota } from "./mapa-filme.js";

const horaTs = (ts) => (ts ? new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

export function iniciarAoVivo({ reduzir }) {
  const iframe = document.querySelector("[data-vivo-iframe]");
  if (!iframe || iframe.dataset.pronto) return;
  iframe.dataset.pronto = "1";
  const tela = iframe.parentElement;
  const carregando = document.querySelector("[data-vivo-carregando]");
  const fio = document.querySelector(".vivo__fio");
  const lista = document.querySelector("[data-pv-lista]");
  const prog = document.querySelector("[data-pv-prog]");
  const progTxt = document.querySelector("[data-pv-prog-txt]");
  const status = document.querySelector("[data-pv-status]");
  const vivoTxt = document.querySelector("[data-pv-vivo]");
  const ultimoTxt = document.querySelector("[data-pv-ultimo]");
  const svg = document.querySelector("[data-pv-mapa]");
  const url = SITE_CONFIG.motoristaDemoUrl;
  const origem = new URL(url).origin;
  const fotos = {};

  // mapa do painel: rota de exemplo, paradas numeradas e o veículo
  const paradas = ROTA_FILME.paradas;
  const linha = el("path", { d: caminhoRota(CD, paradas), class: "mf__rota desenha", pathLength: "1" });
  svg.append(linha);
  const cdG = marcadorCD(CD);
  cdG.setAttribute("class", "mf__cd");
  svg.append(cdG);
  const nums = paradas.map((p, i) => {
    const g = numero(p, i);
    g.classList.add("mostra");
    svg.append(g);
    return g;
  });
  const veic = el("g", { class: "mf__caminhao mostra" });
  veic.append(el("circle", { r: 30, class: "mf__halo" }), el("circle", { r: 21, class: "mf__vei" }));
  const t = el("text", { y: 8, "text-anchor": "middle" });
  t.textContent = "🚚";
  veic.append(t);
  svg.append(veic);
  let posAtual = proj(CD);
  let raf = 0;
  const colocar = ([x, y]) => veic.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  colocar(posAtual);
  function mover(destino) {
    cancelAnimationFrame(raf);
    if (reduzir) {
      posAtual = destino;
      return colocar(destino);
    }
    const de = posAtual;
    const t0 = performance.now();
    const ms = 1100;
    const passo = (agora) => {
      const k = Math.min(1, (agora - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      posAtual = [de[0] + (destino[0] - de[0]) * e, de[1] + (destino[1] - de[1]) * e];
      colocar(posAtual);
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }

  let estado = paradas.map((p) => ({ nf: p.nf, tipo: p.tipo, dest: p.dest, bairro: p.bairro, baixa: null }));
  function desenhar(novos = new Set()) {
    const n = estado.length;
    const feitas = estado.filter((p) => p.baixa).length;
    lista.innerHTML = estado
      .map((p, i) => {
        const b = p.baixa;
        const verbo = p.tipo === "coleta" ? "Coletado" : "Entregue";
        let linhaB = "";
        if (b && b.status === "feito") {
          linhaB = `<strong>✓ ${verbo} às ${horaTs(b.hora)}${b.recebedor ? ` · ${esc(b.recebedor)}` : ""}${b.temFoto ? " · 📷 foto" : ""}</strong>`;
        } else if (b) {
          linhaB = `<strong>✗ Não realizado: ${esc(b.motivo || "sem motivo")}${b.obs ? ` — ${esc(b.obs)}` : ""}</strong><span>Volta para os pedidos pendentes</span>`;
        }
        const foto = fotos[i] && b && b.temFoto ? `<img class="pv__foto" src="${fotos[i]}" alt="Foto enviada na baixa da parada ${i + 1}" />` : "";
        return `<li class="${b ? (b.status === "feito" ? "ok" : "nok") : ""}${novos.has(i) ? " novo" : ""}">
          <b>${i + 1}. ${p.tipo === "coleta" ? "Coleta" : "Entrega"} NF ${esc(p.nf)}</b>
          <span>${esc(p.dest)} · ${esc(p.bairro)}</span>${linhaB}${foto}</li>`;
      })
      .join("");
    prog.style.width = `${(feitas / n) * 100}%`;
    progTxt.textContent = `${feitas} de ${n} paradas com baixa`;
    status.textContent = feitas === n ? "✓ Concluída" : "🚚 Em rota";
    status.classList.toggle("fim", feitas === n);
    nums.forEach((g, i) => {
      const b = estado[i].baixa;
      g.classList.toggle("feito", Boolean(b && b.status === "feito"));
    });
    // o veículo fica na última parada com baixa (simulação da localização ao vivo)
    let ult = -1;
    estado.forEach((p, i) => {
      if (p.baixa && (ult < 0 || (p.baixa.hora || 0) >= (estado[ult].baixa.hora || 0))) ult = i;
    });
    if (ult >= 0) {
      mover(proj(paradas[ult]));
      vivoTxt.textContent = `Localização ao vivo (simulada): perto da parada ${ult + 1}`;
      const b = estado[ult].baixa;
      ultimoTxt.hidden = false;
      ultimoTxt.textContent = `Última baixa: parada ${ult + 1}, ${estado[ult].dest}, às ${horaTs(b.hora)}.`;
    } else {
      mover(proj(CD));
      vivoTxt.textContent = "Localização ao vivo (simulada): saindo do CD";
      ultimoTxt.hidden = true;
    }
  }
  desenhar();

  let recebeu = false;
  window.addEventListener("message", (e) => {
    if (e.origin !== origem || e.source !== iframe.contentWindow) return;
    const d = e.data;
    if (!d || d.origem !== "rotav3-motorista") return;
    recebeu = true;
    if (d.tipo === "foto" && Number.isInteger(d.i) && typeof d.foto === "string" && d.foto.startsWith("data:image/jpeg;base64,")) {
      fotos[d.i] = d.foto;
      return;
    }
    if (d.tipo !== "estado" || !Array.isArray(d.paradas)) return;
    const novos = new Set();
    const prox = estado.map((p, i) => {
      const nova = d.paradas[i] && d.paradas[i].baixa;
      const antes = p.baixa;
      if (nova && (!antes || antes.status !== nova.status || antes.hora !== nova.hora)) novos.add(i);
      if (!nova) delete fotos[i];
      return { ...p, baixa: nova || null };
    });
    estado = prox;
    if (novos.size && !reduzir) {
      fio.classList.remove("pulso");
      void fio.offsetWidth;
      fio.classList.add("pulso");
    }
    desenhar(novos);
  });

  // escala do iframe: a tela do motorista tem 390 px de largura dentro do celular
  const ajustar = () => tela.style.setProperty("--k", (tela.clientWidth / 390).toFixed(4));
  new ResizeObserver(ajustar).observe(tela);
  ajustar();

  iframe.addEventListener("load", () => {
    carregando.classList.add("some");
    try {
      iframe.contentWindow.postMessage({ origem: "rotav3-site", tipo: "pedir-estado" }, origem);
    } catch {
      /* sem acesso à janela */
    }
  });
  setTimeout(() => {
    if (!recebeu && !carregando.classList.contains("some")) {
      carregando.innerHTML = `Não foi possível abrir a tela do motorista aqui. <a href="${esc(url)}" target="_blank" rel="noopener">Abrir em outra aba</a>.`;
    }
  }, 12000);
  iframe.src = url;

  document.querySelector("[data-vivo-recomecar]").addEventListener("click", () => {
    for (const k of Object.keys(fotos)) delete fotos[k];
    try {
      iframe.contentWindow.postMessage({ origem: "rotav3-site", tipo: "recomecar" }, origem);
    } catch {
      /* sem acesso à janela */
    }
  });
}
