import { SITE_CONFIG } from "./config.js";
import { iniciarFilme } from "./filme.js";

const doc = document.documentElement;
const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- cabeçalho: fundo ao rolar, menu no celular, item ativo ---------- */
const cab = document.querySelector(".cabecalho");
const aoRolar = () => cab.classList.toggle("rolou", window.scrollY > 8);
window.addEventListener("scroll", aoRolar, { passive: true });
aoRolar();

const menu = document.getElementById("menu");
const botaoMenu = document.querySelector(".menu-botao");
function abrirMenu(aberto) {
  menu.classList.toggle("aberto", aberto);
  botaoMenu.setAttribute("aria-expanded", String(aberto));
  botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
  botaoMenu.querySelector("[data-abre]").hidden = aberto;
  botaoMenu.querySelector("[data-fecha]").hidden = !aberto;
}
botaoMenu.addEventListener("click", () => abrirMenu(!menu.classList.contains("aberto")));
menu.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) abrirMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("aberto")) {
    abrirMenu(false);
    botaoMenu.focus();
  }
});
const linksMenu = [...menu.querySelectorAll("[data-nav]")];
const espiao = new IntersectionObserver(
  (entradas) => {
    for (const en of entradas) {
      if (!en.isIntersecting) continue;
      linksMenu.forEach((a) =>
        a.getAttribute("href") === `#${en.target.id}` ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"),
      );
    }
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
linksMenu.forEach((a) => {
  const s = document.querySelector(a.getAttribute("href"));
  if (s) espiao.observe(s);
});

/* ---------- WhatsApp e ano ---------- */
const wa = String(SITE_CONFIG.whatsappNumber || "").replace(/\D/g, "");
const temWa = wa.length >= 12;
const linkWa = (texto) => `https://wa.me/${wa}?text=${encodeURIComponent(texto || "")}`;
document.querySelectorAll("[data-whatsapp]").forEach((a) => {
  if (!temWa) return;
  a.href = linkWa(SITE_CONFIG.whatsappMessage);
  a.target = "_blank";
  a.rel = "noopener";
});
document
  .querySelectorAll("[data-whatsapp-rotulo]")
  .forEach((el) => (el.textContent = wa.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3")));
document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- janelas (ver o sistema / agendar) ---------- */
const endpoint = String(SITE_CONFIG.formEndpoint || "").trim();
const modais = { acesso: document.getElementById("modal-acesso"), agendar: document.getElementById("modal-agendar") };
const textoAgendar = modais.agendar.querySelector("[data-modal-texto]");
const textoAgendarPadrao = textoAgendar.textContent;
let ultimoGatilho = null;
function abrirModal(qual, gatilho) {
  const tipo = qual === "acesso" ? "acesso" : "agendar";
  const m = modais[tipo];
  ultimoGatilho = gatilho || null;
  if (tipo === "agendar") {
    m.querySelector("[name=interesse]").value = qual === "rastreamento" || qual === "preco" ? qual : "demo";
    textoAgendar.textContent =
      qual === "rastreamento"
        ? "Conte sobre a sua frota. A conversa abre no WhatsApp para verificarmos se o seu rastreador pode ser conectado ao ROTAV3."
        : qual === "preco"
          ? "Conte o tamanho da frota. A conversa abre no WhatsApp para passarmos o valor do seu plano."
          : textoAgendarPadrao;
  }
  if (typeof m.showModal === "function") m.showModal();
  else m.setAttribute("open", "");
  doc.classList.add("modal-aberto");
  setTimeout(() => m.querySelector("input[name=nome]").focus(), 40);
}
Object.values(modais).forEach((m) => {
  m.addEventListener("close", () => {
    doc.classList.remove("modal-aberto");
    if (ultimoGatilho) ultimoGatilho.focus();
  });
  m.addEventListener("click", (e) => {
    if (e.target === m) m.close();
  });
  m.querySelector("[data-fechar]").addEventListener("click", () => m.close());
});
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-abrir]");
  if (!g) return;
  e.preventDefault();
  abrirModal(g.dataset.abrir, g);
});

/* ---------- formulários ---------- */
const regras = {
  nome: (v) => (v.trim().length >= 2 ? "" : "Informe seu nome."),
  empresa: (v) => (v.trim().length >= 2 ? "" : "Informe o nome da empresa."),
  frota: (v) => (v ? "" : "Escolha uma opção."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido."),
  telefone: (v) => {
    const n = v.replace(/\D/g, "").length;
    return n >= 10 && n <= 11 ? "" : "Informe um WhatsApp com DDD.";
  },
};

function mensagem(tipo, d) {
  if (tipo === "acesso") {
    return [
      "Olá! Quero ver o sistema ROTAV3 por dentro.",
      "Pode me enviar um acesso de demonstração (e-mail e senha)?",
      `Sou ${d.nome.trim()}, da ${d.empresa.trim()}.`,
      `E-mail para o acesso: ${d.email.trim()}`,
    ].join(" ");
  }
  return [
    `Olá! Sou ${d.nome.trim()}, da ${d.empresa.trim()}.`,
    d.frota ? `Temos ${d.frota} veículos.` : "",
    d.interesse === "preco"
      ? "Gostaria de saber o valor do ROTAV3 para a nossa frota."
      : "Gostaria de agendar uma demonstração do ROTAV3 com os dados da nossa operação.",
    d.interesse === "rastreamento" ? "Também quero verificar a conexão com o nosso rastreador." : "",
  ]
    .filter(Boolean)
    .join(" ");
}

document.querySelectorAll("form[data-form]").forEach((form) => {
  const tipo = form.dataset.form;
  const status = form.querySelector(".form__status");
  const botao = form.querySelector("[type=submit]");
  const rotulo = botao.querySelector("[data-rotulo]");
  if (endpoint) {
    form.querySelectorAll("[data-so-endpoint]").forEach((el) => (el.hidden = false));
    rotulo.textContent = tipo === "acesso" ? "Pedir acesso" : "Enviar pedido";
  } else if (!temWa) {
    rotulo.textContent = "Enviar";
  }
  // campos que valem neste formulário (os escondidos ficam de fora)
  const campos = () =>
    Object.keys(regras).filter((n) => {
      const el = form.elements[n];
      if (!el) return false;
      const um = el instanceof RadioNodeList ? el[0] : el;
      return !um.closest("[hidden]");
    });
  const elCampo = (n) => {
    const el = form.elements[n];
    return el instanceof RadioNodeList ? el[0] : el;
  };
  function validar(n) {
    const msg = regras[n](form.elements[n].value || "");
    const caixa = elCampo(n).closest(".campo");
    caixa.classList.toggle("invalido", Boolean(msg));
    caixa.querySelector(".campo__erro").textContent = msg;
    const alvos = form.elements[n] instanceof RadioNodeList ? [...form.elements[n]] : [elCampo(n)];
    alvos.forEach((t) => t.setAttribute("aria-invalid", msg ? "true" : "false"));
    return !msg;
  }
  Object.keys(regras).forEach((n) => {
    const el = form.elements[n];
    if (!el) return;
    const lista = el instanceof RadioNodeList ? [...el] : [el];
    lista.forEach((inp) => {
      inp.addEventListener("blur", () => {
        if (inp.type !== "radio" && inp.value) validar(n);
      });
      inp.addEventListener(inp.type === "radio" ? "change" : "input", () => {
        if (inp.closest(".campo").classList.contains("invalido")) validar(n);
      });
    });
  });
  const tel = form.elements.telefone;
  if (tel)
    tel.addEventListener("input", () => {
      const d = tel.value.replace(/\D/g, "").slice(0, 11);
      let v = d;
      if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      tel.value = v;
    });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form__status";
    status.textContent = "";
    const ruins = campos().filter((n) => !validar(n));
    if (ruins.length) {
      elCampo(ruins[0]).focus();
      status.classList.add("erro");
      status.textContent = "Confira os campos destacados.";
      return;
    }
    if (form.elements.website.value) {
      status.classList.add("ok");
      status.textContent = "Pedido recebido.";
      return;
    }
    const dados = Object.fromEntries(new FormData(form).entries());
    delete dados.website;
    dados.tipo = tipo;
    dados.origem = "site-rotav3";
    dados.enviadoEm = new Date().toISOString();

    if (!endpoint && temWa) {
      const url = linkWa(mensagem(tipo, dados));
      const janela = window.open(url, "_blank");
      if (janela) janela.opener = null;
      else window.location.href = url;
      status.classList.add("ok");
      status.textContent = "Abrimos o WhatsApp com a sua mensagem. É só tocar em enviar.";
      const de_novo = document.createElement("a");
      de_novo.href = url;
      de_novo.target = "_blank";
      de_novo.rel = "noopener";
      de_novo.textContent = "Não abriu? Toque aqui.";
      status.append(" ", de_novo);
      return;
    }
    if (!endpoint) {
      status.classList.add("ok");
      status.textContent = "Dados conferidos. O envio ainda não está configurado neste site.";
      return;
    }
    botao.disabled = true;
    botao.setAttribute("aria-busy", "true");
    try {
      // formulário comum (x-www-form-urlencoded): aceito por n8n, Formspree, Make e Apps Script, sem preflight de CORS
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams(dados),
      });
      if (!r.ok) throw new Error(String(r.status));
      form.reset();
      status.classList.add("ok");
      status.textContent =
        tipo === "acesso" ? "Pedido enviado! Mandamos o acesso pelo WhatsApp em breve." : "Pedido enviado! Em breve entraremos em contato.";
    } catch {
      status.classList.add("erro");
      status.textContent = "Não foi possível enviar agora. Tente de novo em alguns minutos ou fale pelo WhatsApp.";
    } finally {
      botao.disabled = false;
      botao.removeAttribute("aria-busy");
    }
  });
});

/* ---------- imagens que ampliam (modelos de painel) ---------- */
const zoom = document.getElementById("zoom");
const zoomImg = zoom.querySelector("[data-zoom-img]");
let zoomGatilho = null;
document.querySelectorAll("[data-ampliar]").forEach((b) =>
  b.addEventListener("click", () => {
    zoomGatilho = b;
    const img = b.querySelector("img");
    zoomImg.src = b.dataset.ampliar;
    zoomImg.alt = img ? img.alt : "";
    if (typeof zoom.showModal === "function") zoom.showModal();
    else zoom.setAttribute("open", "");
    doc.classList.add("modal-aberto");
  }),
);
zoom.querySelector("[data-fechar-zoom]").addEventListener("click", () => zoom.close());
zoom.addEventListener("click", (e) => {
  if (e.target === zoom) zoom.close();
});
zoom.addEventListener("close", () => {
  doc.classList.remove("modal-aberto");
  zoomImg.removeAttribute("src");
  if (zoomGatilho) zoomGatilho.focus();
});

/* ---------- filme do topo ---------- */
iniciarFilme({ reduzir });

/* ---------- módulos das seções: carregam quando a seção chega perto ---------- */
const sob_demanda = [
  ["#como-funciona", () => import("./dia.js").then((m) => m.iniciarDia({ reduzir }))],
  ["#criar-rota", () => import("./planejador.js").then((m) => m.iniciarPlanejador({ reduzir }))],
  ["#mapa", () => import("./mapa3d.js").then((m) => m.iniciarMapa3d({ reduzir }))],
  ["#ao-vivo", () => import("./aovivo.js").then((m) => m.iniciarAoVivo({ reduzir }))],
  ["#ia", () => import("./ia.js").then((m) => m.iniciarIA({ reduzir }))],
];
const carregador = new IntersectionObserver(
  (entradas) => {
    for (const en of entradas) {
      if (!en.isIntersecting) continue;
      carregador.unobserve(en.target);
      const item = sob_demanda.find(([sel]) => document.querySelector(sel) === en.target);
      item[1]().catch((err) => console.error("Não carregou:", item[0], err));
    }
  },
  { rootMargin: "600px 0px" },
);
sob_demanda.forEach(([sel]) => {
  const s = document.querySelector(sel);
  if (s) carregador.observe(s);
});
