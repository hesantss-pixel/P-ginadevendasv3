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
      let id = en.target.id;
      if (id === "planejamento") id = "inicio";
      navLinks.forEach((a) =>
        a.dataset.nav === id
          ? a.setAttribute("aria-current", "true")
          : a.removeAttribute("aria-current"),
      );
    }
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
[...sectionIds, "planejamento"].forEach((id) => {
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

/* ---------- WhatsApp e ano ---------- */
const wa = String(SITE_CONFIG.whatsappNumber || "").replace(/\D/g, "");
document.querySelectorAll("[data-whatsapp]").forEach((a) => {
  if (wa.length < 12) return;
  a.href = `https://wa.me/${wa}?text=${encodeURIComponent(SITE_CONFIG.whatsappMessage || "")}`;
  a.target = "_blank";
  a.rel = "noopener";
  a.hidden = false;
});
document
  .querySelectorAll("[data-year]")
  .forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Modal de demonstração e formulário ---------- */
const modal = document.getElementById("demo-modal");
const form = document.getElementById("demo-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("demo-submit");
const endpoint = String(SITE_CONFIG.formEndpoint || "").trim();
document.getElementById("form-notice").hidden = Boolean(endpoint);

function openModal() {
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
    openModal();
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
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido."),
  telefone: (v) => {
    const n = v.replace(/\D/g, "").length;
    return n >= 10 && n <= 11 ? "" : "Informe um WhatsApp com DDD.";
  },
};
function validateField(input) {
  const rule = rules[input.name];
  if (!rule) return true;
  const msg = rule(input.value);
  const field = input.closest(".field");
  field.classList.toggle("is-invalid", Boolean(msg));
  field.querySelector(".field__error").textContent = msg;
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  return !msg;
}
Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener("blur", () => {
    if (input.value) validateField(input);
  });
  input.addEventListener("input", () => {
    if (input.closest(".field").classList.contains("is-invalid")) validateField(input);
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.className = "form-status";
  statusEl.textContent = "";
  const invalid = Object.keys(rules)
    .map((n) => form.elements[n])
    .filter((i) => !validateField(i));
  if (invalid.length) {
    invalid[0].focus();
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

/* ---------- Painel interativo ---------- */
initPlanMap();

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
