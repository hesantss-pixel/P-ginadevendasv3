import { SITE_CONFIG } from "./config.js";
import { initPlanMap } from "./planmap.js";
import { initOrdersMaps } from "./ordersmap.js";

const doc = document.documentElement;
doc.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Cabeçalho: sombra ao rolar, menu no celular, item ativo ---------- */
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const nav = document.getElementById("menu-principal");
const toggle = document.querySelector(".menu-toggle");
function setMenu(open) {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  toggle.querySelector("[data-icon-open]").hidden = open;
  toggle.querySelector("[data-icon-close]").hidden = !open;
}
toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    toggle.focus();
  }
});

const navLinks = [...document.querySelectorAll("[data-nav]")];
const sectionIds = navLinks.map((a) => a.dataset.nav);
const spy = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const id = en.target.id;
      navLinks.forEach((a) =>
        a.dataset.nav === id
          ? a.setAttribute("aria-current", "true")
          : a.removeAttribute("aria-current"),
      );
    }
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
sectionIds.forEach((id) => {
  const el = document.getElementById(id);
  if (el) spy.observe(el);
});

/* ---------- Animação de entrada ---------- */
const reveals = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries)
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  reveals.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 70}ms`;
    io.observe(el);
  });
}

/* ---------- Luz que segue o mouse nos cartões ---------- */
if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
  document.addEventListener(
    "pointermove",
    (e) => {
      const card =
        e.target.closest &&
        e.target.closest(".step, .tile, .trust__card, .price__card, .addon, .calc");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
}

/* ---------- WhatsApp e ano ---------- */
const wa = String(SITE_CONFIG.whatsappNumber || "").replace(/\D/g, "");
const hasWa = wa.length >= 12;
const waLink = (text) => `https://wa.me/${wa}?text=${encodeURIComponent(text || "")}`;
// (11) 95591-4618 a partir de 5511955914618
const waLabel = wa.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
document.querySelectorAll("[data-whatsapp]").forEach((a) => {
  if (!hasWa) return;
  a.href = waLink(SITE_CONFIG.whatsappMessage);
  a.target = "_blank";
  a.rel = "noopener";
  a.hidden = false;
});
document.querySelectorAll("[data-whatsapp-label]").forEach((el) => (el.textContent = waLabel));
document
  .querySelectorAll("[data-year]")
  .forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Modal de demonstração e formulário ---------- */
const modal = document.getElementById("demo-modal");
const form = document.getElementById("demo-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("demo-submit");
const endpoint = String(SITE_CONFIG.formEndpoint || "").trim();
// sem endereço de envio, mas com WhatsApp: o formulário abre o WhatsApp com a mensagem pronta
// (só nome, empresa e frota — o próprio WhatsApp já identifica o número de quem escreve)
const viaWhatsApp = !endpoint && hasWa;
const notice = document.getElementById("form-notice");
notice.hidden = Boolean(endpoint) || viaWhatsApp;
if (endpoint) {
  // com endereço de envio, pede também e-mail e WhatsApp para o retorno
  form.querySelectorAll("[data-endpoint-only]").forEach((el) => (el.hidden = false));
  document.getElementById("form-intro").textContent =
    "Conte um pouco da sua operação. Retornamos para combinar o melhor horário.";
  submitBtn.firstChild.textContent = "Enviar solicitação ";
} else if (!hasWa) {
  submitBtn.firstChild.textContent = "Enviar solicitação ";
}

const intro = document.getElementById("form-intro");
const introDefault = intro.textContent;
// interesse vem do botão que abriu o formulário (ex.: data-open-demo="rastreamento")
function openModal(interest = "") {
  form.elements.interesse.value = interest;
  intro.textContent =
    interest === "rastreamento"
      ? "Conte sobre a sua frota: a conversa abre no WhatsApp com o pedido de orçamento do rastreamento já escrito."
      : introDefault;
  if (typeof modal.showModal !== "function") {
    modal.setAttribute("open", "");
  } else modal.showModal();
  doc.classList.add("modal-open");
  setTimeout(() => form.querySelector("input[name=nome]").focus(), 30);
}
function closeModal() {
  modal.close ? modal.close() : modal.removeAttribute("open");
}
modal.addEventListener("close", () => doc.classList.remove("modal-open"));
document.querySelectorAll("[data-open-demo]").forEach((b) =>
  b.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(b.dataset.openDemo || "");
  }),
);
modal.querySelector("[data-close-demo]").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

const tel = form.elements.telefone;
tel.addEventListener("input", () => {
  const d = tel.value.replace(/\D/g, "").slice(0, 11);
  let v = d;
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 7) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  tel.value = v;
});

const rules = {
  nome: (v) => (v.trim().length >= 2 ? "" : "Informe seu nome."),
  empresa: (v) => (v.trim().length >= 2 ? "" : "Informe o nome da empresa."),
  frota: (v) => (v ? "" : "Escolha uma opção."),
};
if (endpoint) {
  rules.email = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido.";
  rules.telefone = (v) => {
    const n = v.replace(/\D/g, "").length;
    return n >= 10 && n <= 11 ? "" : "Informe um WhatsApp com DDD.";
  };
}
// campos de rádio (frota) vêm como RadioNodeList
const fieldEl = (name) => {
  const el = form.elements[name];
  return el instanceof RadioNodeList ? el[0] : el;
};
function validateField(name) {
  const rule = rules[name];
  if (!rule) return true;
  const msg = rule(form.elements[name].value || "");
  const field = fieldEl(name).closest(".field");
  field.classList.toggle("is-invalid", Boolean(msg));
  field.querySelector(".field__error").textContent = msg;
  const targets =
    form.elements[name] instanceof RadioNodeList ? [...form.elements[name]] : [fieldEl(name)];
  targets.forEach((t) => t.setAttribute("aria-invalid", msg ? "true" : "false"));
  return !msg;
}
Object.keys(rules).forEach((name) => {
  const el = form.elements[name];
  const list = el instanceof RadioNodeList ? [...el] : [el];
  list.forEach((input) => {
    input.addEventListener("blur", () => {
      if (input.type !== "radio" && input.value) validateField(name);
    });
    input.addEventListener(input.type === "radio" ? "change" : "input", () => {
      if (input.closest(".field").classList.contains("is-invalid")) validateField(name);
    });
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.className = "form-status";
  statusEl.textContent = "";
  const invalid = Object.keys(rules).filter((n) => !validateField(n));
  if (invalid.length) {
    fieldEl(invalid[0]).focus();
    statusEl.classList.add("is-error");
    statusEl.textContent = "Confira os campos destacados.";
    return;
  }
  if (form.elements.website.value) {
    statusEl.classList.add("is-ok");
    statusEl.textContent = "Solicitação recebida.";
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  delete data.website;
  data.origem = "landing-rotav3";
  data.enviadoEm = new Date().toISOString();

  if (viaWhatsApp) {
    const frota = String(data.frota || "").toLowerCase();
    const text = [
      `Olá! Sou ${data.nome.trim()}, da ${data.empresa.trim()}.`,
      frota ? `Temos ${frota} veículos.` : "",
      "Quero ver o ROTAV3 com os nossos pedidos.",
      data.interesse === "rastreamento"
        ? "Também quero um orçamento do módulo de rastreamento."
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    const url = waLink(text);
    const win = window.open(url, "_blank");
    if (win) win.opener = null;
    else window.location.href = url;
    statusEl.classList.add("is-ok");
    statusEl.textContent = "Abrimos o WhatsApp com a sua mensagem. É só tocar em enviar. ";
    const again = document.createElement("a");
    again.href = url;
    again.target = "_blank";
    again.rel = "noopener";
    again.textContent = "Não abriu? Toque aqui.";
    statusEl.append(again);
    return;
  }
  if (!endpoint) {
    statusEl.classList.add("is-ok");
    statusEl.textContent =
      "Tudo certo com os dados. Este formulário ainda está em modo de demonstração, então nada foi enviado.";
    return;
  }
  submitBtn.disabled = true;
  submitBtn.setAttribute("aria-busy", "true");
  try {
    // envia como formulário comum (application/x-www-form-urlencoded): é aceito por n8n, Formspree,
    // Make e Google Apps Script e não exige "preflight" de CORS
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams(data),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    statusEl.classList.add("is-ok");
    statusEl.textContent = "Solicitação enviada! Em breve entraremos em contato.";
  } catch {
    statusEl.classList.add("is-error");
    statusEl.textContent = "Não foi possível enviar agora. Tente novamente em alguns minutos.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.removeAttribute("aria-busy");
  }
});

/* ---------- Imagens que ampliam ao toque ---------- */
// cada <img data-zoom> ganha um botão em volta; data-zoom="url" abre uma versão maior
const zoomDlg = document.getElementById("zoom-dialog");
const zoomImg = document.getElementById("zoom-img");
if (zoomDlg && zoomImg) {
  document.querySelectorAll("img[data-zoom]").forEach((img) => {
    const target = img.closest("picture") || img;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "zoomable";
    btn.setAttribute("aria-label", `Ampliar imagem: ${img.alt}`);
    target.replaceWith(btn);
    btn.append(target);
    const hint = document.createElement("span");
    hint.className = "zoomable__hint";
    hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = '<svg class="ico"><use href="#i-search"/></svg>Ampliar';
    btn.append(hint);
    btn.addEventListener("click", () => {
      zoomImg.src = img.dataset.zoom || img.currentSrc || img.src;
      zoomImg.alt = img.alt;
      zoomImg.classList.toggle("is-tall", img.naturalHeight > img.naturalWidth * 0.9);
      if (typeof zoomDlg.showModal === "function") zoomDlg.showModal();
      else zoomDlg.setAttribute("open", "");
      doc.classList.add("modal-open");
    });
  });
  const closeZoom = () => (zoomDlg.close ? zoomDlg.close() : zoomDlg.removeAttribute("open"));
  zoomDlg.querySelector("[data-zoom-close]").addEventListener("click", closeZoom);
  zoomDlg.addEventListener("click", (e) => {
    if (e.target === zoomDlg) closeZoom();
  });
  zoomDlg.addEventListener("close", () => {
    doc.classList.remove("modal-open");
    zoomImg.removeAttribute("src");
  });
}

/* ---------- Calculadora: quanto custa montar rotas à mão ---------- */
const calcIn = ["calc-h", "calc-d", "calc-r"].map((id) => document.getElementById(id));
if (calcIn.every(Boolean)) {
  // aceita vírgula decimal; limita a valores possíveis (24 h por dia, 31 dias por mês)
  const num = (el, max) =>
    Math.min(max, Math.max(0, Number(String(el.value).replace(/\s/g, "").replace(",", ".")) || 0));
  const fmtH = (n) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " h";
  const fmtR = (n) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const update = () => {
    const hours = num(calcIn[0], 24) * num(calcIn[1], 31);
    document.getElementById("calc-hours").textContent = fmtH(hours);
    document.getElementById("calc-cost").textContent = fmtR(hours * num(calcIn[2], 100000));
  };
  calcIn.forEach((el) => el.addEventListener("input", update));
  update();
}

/* ---------- Painel do topo em perspectiva 3D (só com mouse e sem "reduzir movimento") ---------- */
const tiltEl = document.querySelector("[data-tilt]");
if (tiltEl && !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const heroEl = document.querySelector(".hero");
  let raf = 0;
  heroEl.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = heroEl.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tiltEl.style.setProperty("--ry", `${(-6 + x * 4).toFixed(2)}deg`);
      tiltEl.style.setProperty("--rx", `${(2 - y * 3).toFixed(2)}deg`);
    });
  });
  heroEl.addEventListener("pointerleave", () => {
    tiltEl.style.removeProperty("--ry");
    tiltEl.style.removeProperty("--rx");
  });
}

/* ---------- Painel interativo ---------- */
initPlanMap({ reduceMotion });

/* ---------- Mapas de ruas (pedidos / coletas e entregas) ---------- */
initOrdersMaps({ reduceMotion });

/* ---------- Mapa 3D (carregado só quando o navegador suporta WebGL) ---------- */
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
const webgl = hasWebGL();
if (!webgl) doc.classList.add("no-webgl");

const cityBox = document.querySelector(".city");
// imagem estática no lugar do 3D (sem WebGL ou se a cena falhar)
function useFallback(box) {
  box.classList.add("is-fallback");
  const img = box.querySelector("img[data-src]");
  if (img && !img.src) img.src = img.dataset.src;
}
if (!webgl) {
  useFallback(cityBox);
}
if (webgl) {
  const cityIO = new IntersectionObserver(
    (entries) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      cityIO.disconnect();
      import("./city3d.js")
        .then((m) => m.initCity(document.getElementById("city3d"), cityBox, { reduceMotion }))
        .then((api) => {
          window.__rotav3 = Object.assign(window.__rotav3 || {}, { city: api });
        })
        .catch((err) => {
          console.warn("Mapa 3D indisponível:", err);
          useFallback(cityBox);
        });
    },
    { rootMargin: "500px 0px" },
  );
  cityIO.observe(cityBox);
}
