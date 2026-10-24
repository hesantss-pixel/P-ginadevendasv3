// "Um dia de operação": desenha os pedidos de exemplo no mapa pequeno da etapa 2.
import { CD, PEDIDOS_PLANO } from "./dados.js";
import { pino, marcadorCD } from "./mapa-filme.js";

export function iniciarDia() {
  const svg = document.querySelector("[data-mini-mapa]");
  if (!svg || svg.dataset.pronto) return;
  svg.dataset.pronto = "1";
  const noMapa = PEDIDOS_PLANO.filter((p) => p.lng >= -46.6 && p.lng <= -46.37 && p.lat >= -23.53 && p.lat <= -23.39);
  for (const p of noMapa) svg.append(pino(p));
  const cd = marcadorCD(CD);
  cd.setAttribute("class", "mf__cd");
  svg.append(cd);
}
