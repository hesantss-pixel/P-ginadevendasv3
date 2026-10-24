// Assistente de IA: respostas de EXEMPLO montadas com os 86 pedidos fictícios do mapa 3D,
// no mesmo formato das respostas do sistema (listas, sem markdown, só com os dados recebidos).
import { REGIAO } from "./dados-regiao.js";
import { CD, hhmm } from "./dados.js";
import { linhaReta } from "./roteiro.js";

const t = (kgs) => `${(kgs / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} t`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const veiculoPara = (kgs) => (kgs <= 650 ? "Fiorino" : kgs <= 3000 ? "VUC" : kgs <= 8000 ? "Truck Toco" : "Bitruck");

const REGIOES = [
  ["Guarulhos", ["Guarulhos"]],
  ["São Paulo", ["São Paulo"]],
  ["Alto Tietê", ["Itaquaquecetuba", "Suzano", "Mogi das Cruzes", "Poá", "Ferraz de Vasconcelos", "Arujá", "Santa Isabel"]],
  ["ABC", ["Santo André", "São Bernardo do Campo", "São Caetano do Sul", "Diadema", "Mauá"]],
  ["Oeste e norte", ["Osasco", "Barueri", "Cotia", "Taboão da Serra", "Caieiras", "Mairiporã"]],
];

function respostas() {
  const peds = REGIAO.pedidos;
  const nE = peds.filter((p) => p.tipo === "e").length;
  const total = peds.reduce((s, p) => s + p.peso, 0);

  // 1. divisão por região
  const linhas = REGIOES.map(([nome, cidades], i) => {
    const ps = peds.filter((p) => cidades.includes(p.cidade));
    if (!ps.length) return "";
    const e = ps.filter((p) => p.tipo === "e");
    const c = ps.length - e.length;
    const pe = e.reduce((s, p) => s + p.peso, 0);
    const pc = ps.reduce((s, p) => s + p.peso, 0) - pe;
    const pico = Math.max(pe, pc);
    const viagens = Math.ceil(ps.length / 12);
    const quem = cidades.length > 1 ? ` (${cidades.filter((x) => ps.some((p) => p.cidade === x)).join(", ")})` : "";
    return `- Rota ${i + 1}, ${nome}${quem}: ${plural(ps.length, "pedido", "pedidos")} (${plural(e.length, "entrega", "entregas")}${c ? `, ${plural(c, "coleta", "coletas")}` : ""}), ${t(pe + pc)}. ${
      viagens > 1
        ? `Passa de 12 paradas: divida em ${viagens} viagens de ${veiculoPara(pico / viagens)}.`
        : `Cabe em 1 viagem de ${veiculoPara(pico)}.`
    }`;
  }).filter(Boolean);
  const divisao = [
    `São ${peds.length} pedidos pendentes (${nE} entregas e ${peds.length - nE} coletas, ${t(total)} no total). Uma divisão possível é por região, saindo do CD em Guarulhos:`,
    ...linhas,
    "Em cada viagem, as entregas vêm antes das coletas. Gere as rotas uma de cada vez na tela de Roteirização para conferir os horários.",
  ].join("\n");

  // 2. clientes isolados: longe do CD e sem outro pedido por perto
  const isolados = peds
    .map((p) => {
      const perto = Math.min(...peds.filter((q) => q !== p).map((q) => linhaReta(p, q)));
      return { p, perto, cd: linhaReta(CD, p) };
    })
    .filter((x) => x.perto > 6 && x.cd > 20)
    .sort((a, b) => b.cd - a.cd);
  const isolado = isolados.length
    ? [
        `Sim. ${plural(isolados.length, "pedido está", "pedidos estão")} longe do CD e sem outro pedido por perto:`,
        ...isolados.map(
          ({ p, perto, cd }) =>
            `- NF ${p.nf}, ${p.cidade}: ${p.tipo === "c" ? "coleta" : "entrega"} de ${p.peso} kg, a ${Math.round(cd)} km do CD em linha reta; o pedido mais próximo fica a ${Math.round(perto)} km.`,
        ),
        "Sugestão: junte os que ficam no mesmo lado da região numa viagem de veículo leve, ou combine com o cliente a entrega no dia em que houver mais pedidos por lá.",
      ].join("\n")
    : "Não. Todos os pedidos têm outro pedido a menos de 6 km.";

  // 3. pedidos que podem atrasar: horário marcado e urgentes
  const comHora = peds.filter((p) => p.j).sort((a, b) => a.j[0] - b.j[0] || a.j[1] - b.j[1]);
  const urgentes = peds.filter((p) => p.u && !p.j);
  const manha = comHora.filter((p) => p.j[0] < 12 * 60);
  const atraso = [
    `Atenção a ${plural(comHora.length, "pedido com horário marcado", "pedidos com horário marcado")} e ${plural(peds.filter((p) => p.u).length, "urgente", "urgentes")}:`,
    ...comHora.map(
      (p) =>
        `- NF ${p.nf}, ${p.cidade} (${p.tipo === "c" ? "coleta" : "entrega"}), horário ${hhmm(p.j[0])}–${hhmm(p.j[1])}${p.u ? ", urgente" : ""}${p.j[0] < 12 * 60 ? ": precisa entrar na primeira viagem da manhã." : "."}`,
    ),
    ...urgentes.map((p) => `- NF ${p.nf}, ${p.cidade}: urgente, sem horário marcado.`),
    `Comece pelas rotas que têm ${plural(manha.length, "o pedido da manhã", "os pedidos da manhã")}. Os horários da tarde cabem numa segunda viagem.`,
  ].join("\n");

  return {
    divisao: ["Qual a melhor divisão das rotas hoje?", divisao],
    isolado: ["Tem algum cliente isolado?", isolado],
    atraso: ["Quais pedidos podem atrasar?", atraso],
  };
}

export function iniciarIA({ reduzir }) {
  const chat = document.querySelector("[data-chat]");
  if (!chat || chat.dataset.pronto) return;
  chat.dataset.pronto = "1";
  const msgs = chat.querySelector("[data-chat-msgs]");
  const botoes = [...chat.querySelectorAll("[data-pergunta]")];
  const R = respostas();
  let ocupado = false;

  function bolha(cls, texto) {
    const b = document.createElement("div");
    b.className = `bal ${cls}`;
    b.textContent = texto;
    msgs.append(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }
  bolha("bal--ia", `Olá! Estou vendo os ${REGIAO.pedidos.length} pedidos pendentes de hoje. Pergunte sobre a operação.`);

  async function perguntar(chave) {
    if (ocupado) return;
    ocupado = true;
    botoes.forEach((b) => (b.disabled = true));
    const [pergunta, resposta] = R[chave];
    bolha("bal--eu", pergunta);
    const dig = document.createElement("div");
    dig.className = "bal bal--ia bal--digitando";
    dig.setAttribute("aria-label", "A IA está escrevendo");
    dig.innerHTML = "<i></i><i></i><i></i>";
    msgs.append(dig);
    msgs.scrollTop = msgs.scrollHeight;
    await new Promise((r) => setTimeout(r, reduzir ? 150 : 900));
    dig.remove();
    const b = bolha("bal--ia", reduzir ? resposta : "");
    if (!reduzir) {
      // escreve aos poucos, como a resposta chegando
      b.setAttribute("aria-busy", "true");
      for (let i = 0; i < resposta.length; i += 3) {
        b.textContent = resposta.slice(0, i + 3);
        if (i % 30 === 0) msgs.scrollTop = msgs.scrollHeight;
        await new Promise((r) => setTimeout(r, 8));
      }
      b.removeAttribute("aria-busy");
      msgs.scrollTop = msgs.scrollHeight;
    }
    botoes.forEach((x) => {
      x.disabled = false;
      if (x.dataset.pergunta === chave) x.setAttribute("aria-pressed", "true");
    });
    ocupado = false;
  }
  botoes.forEach((b) => b.addEventListener("click", () => perguntar(b.dataset.pergunta)));

  // já começa com uma pergunta respondida, para a conversa não aparecer vazia
  const [p0, r0] = R.atraso;
  bolha("bal--eu", p0);
  bolha("bal--ia", r0);
  botoes.find((b) => b.dataset.pergunta === "atraso")?.setAttribute("aria-pressed", "true");
  msgs.scrollTop = 0;
}
