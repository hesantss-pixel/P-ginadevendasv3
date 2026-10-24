// Roteirização SIMULADA no navegador, só para a demonstração desta página.
// Segue as mesmas regras do sistema (capacidade do veículo, limite de paradas, janela de horário,
// entregas antes das coletas na mesma viagem, jornada de 8 h e 15 min por parada), mas com
// distâncias estimadas em linha reta × 1,3. No sistema, a rota é calculada pelo Google OR-Tools com
// distâncias pelas ruas.

export const PARAM = {
  fator: 1.3, // linha reta → ruas (estimativa)
  kmh: 30, // velocidade média na cidade
  servico: 15, // minutos por parada (igual ao sistema)
  jornada: 480, // 8 h
  esperaMax: 180, // espera máxima numa parada até a janela abrir (igual ao sistema)
  custoEspera: 0.25, // km "equivalentes" por minuto parado esperando a janela (evita esperas longas)
};

const R = 6371;
export function linhaReta(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const kmEntre = (a, b) => linhaReta(a, b) * PARAM.fator;
const minDe = (km) => (km / PARAM.kmh) * 60;

// Horários de uma sequência de paradas saindo do CD em "saida" (minutos desde a meia-noite).
export function simular(seq, cd, saida) {
  let t = saida;
  let pos = cd;
  let km = 0;
  let viavel = true;
  let espera = 0;
  const paradas = [];
  for (const p of seq) {
    const d = kmEntre(pos, p);
    km += d;
    t += minDe(d);
    const chegada = t;
    let inicio = t;
    if (p.janela) {
      if (t < p.janela[0]) inicio = p.janela[0];
      if (inicio > p.janela[1] || inicio - chegada > PARAM.esperaMax) viavel = false;
    }
    espera += inicio - chegada;
    paradas.push({ ...p, chegada, inicio, espera: inicio - chegada });
    t = inicio + PARAM.servico;
    pos = p;
  }
  const dv = kmEntre(pos, cd);
  km += dv;
  t += minDe(dv);
  if (t - saida > PARAM.jornada) viavel = false;
  return { paradas, km, volta: t, duracao: t - saida, viavel, custo: km + espera * PARAM.custoEspera };
}

const pesoDe = (lista, tipo) => lista.reduce((s, p) => s + (p.tipo === tipo ? p.peso : 0), 0);
// entregas sempre antes das coletas
const ordemOk = (seq) => {
  let viuColeta = false;
  for (const p of seq) {
    if (p.tipo === "coleta") viuColeta = true;
    else if (viuColeta) return false;
  }
  return true;
};

function cabe(seq, cap) {
  return pesoDe(seq, "entrega") <= cap && pesoDe(seq, "coleta") <= cap;
}

// Inserção mais barata a partir de uma semente, até o limite de paradas.
function construir(semente, cands, cd, saida, cap, maxParadas) {
  let seq = [semente];
  const resto = new Set(cands.filter((p) => p !== semente));
  while (seq.length < maxParadas && resto.size) {
    let melhor = null;
    for (const p of resto) {
      if (!cabe([...seq, p], cap)) continue;
      for (let i = 0; i <= seq.length; i++) {
        const nova = [...seq.slice(0, i), p, ...seq.slice(i)];
        if (!ordemOk(nova)) continue;
        const s = simular(nova, cd, saida);
        if (!s.viavel) continue;
        if (!melhor || s.custo < melhor.custo - 1e-9) melhor = { seq: nova, custo: s.custo, p };
      }
    }
    if (!melhor) break;
    seq = melhor.seq;
    resto.delete(melhor.p);
  }
  return seq;
}

// Melhora a sequência com 2-opt e realocação de uma parada (respeitando as regras).
function melhorar(seq, cd, saida) {
  let atual = seq;
  let kmAtual = simular(atual, cd, saida).custo;
  for (let volta = 0; volta < 40; volta++) {
    let achou = false;
    for (let i = 0; i < atual.length - 1 && !achou; i++) {
      for (let j = i + 1; j < atual.length && !achou; j++) {
        const nova = [...atual.slice(0, i), ...atual.slice(i, j + 1).reverse(), ...atual.slice(j + 1)];
        if (!ordemOk(nova)) continue;
        const s = simular(nova, cd, saida);
        if (s.viavel && s.custo < kmAtual - 1e-6) {
          atual = nova;
          kmAtual = s.custo;
          achou = true;
        }
      }
    }
    for (let i = 0; i < atual.length && !achou; i++) {
      const sem = [...atual.slice(0, i), ...atual.slice(i + 1)];
      for (let j = 0; j <= sem.length && !achou; j++) {
        if (j === i) continue;
        const nova = [...sem.slice(0, j), atual[i], ...sem.slice(j)];
        if (!ordemOk(nova)) continue;
        const s = simular(nova, cd, saida);
        if (s.viavel && s.custo < kmAtual - 1e-6) {
          atual = nova;
          kmAtual = s.custo;
          achou = true;
        }
      }
    }
    if (!achou) break;
  }
  return atual;
}

/**
 * Monta UMA viagem, como o sistema: escolhe os pedidos que cabem e a melhor sequência.
 * @param {Array} pedidos pendentes
 * @param {{cd, cap, maxParadas, saida, tipos: string[]}} op
 */
export function roteirizar(pedidos, { cd, cap, maxParadas, saida, tipos }) {
  const cands = pedidos.filter((p) => tipos.includes(p.tipo));
  // como o sistema: pedido cuja janela não dá para cumprir nem indo direto fica de fora
  const foraJanela = [];
  const validos = [];
  for (const p of cands) {
    if (p.peso > cap) {
      validos.push(p); // não cabe sozinho: vai aparecer em "ficaram para depois"
      continue;
    }
    // como o sistema: a janela já fechou quando o veículo chega indo direto, ou só abre depois da jornada
    const direto = saida + minDe(kmEntre(cd, p));
    if (p.janela && (direto > p.janela[1] || p.janela[0] > saida + PARAM.jornada - PARAM.servico)) foraJanela.push(p);
    else validos.push(p);
  }
  let melhor = null;
  for (const semente of validos) {
    if (semente.peso > cap || !simular([semente], cd, saida).viavel) continue;
    const seq = melhorar(construir(semente, validos, cd, saida, cap, maxParadas), cd, saida);
    const s = simular(seq, cd, saida);
    if (!melhor || seq.length > melhor.seq.length || (seq.length === melhor.seq.length && s.custo < melhor.s.custo - 1e-9)) {
      melhor = { seq, s };
    }
  }
  if (!melhor) {
    return { paradas: [], km: 0, volta: saida, duracao: 0, foraJanela, ficaram: validos, cargaSaida: 0, cargaRetorno: 0, cargaMax: 0, total: cands.length };
  }
  const usados = new Set(melhor.seq);
  const pe = pesoDe(melhor.seq, "entrega");
  const pc = pesoDe(melhor.seq, "coleta");
  return {
    paradas: melhor.s.paradas,
    km: melhor.s.km,
    volta: melhor.s.volta,
    duracao: melhor.s.duracao,
    foraJanela,
    ficaram: validos.filter((p) => !usados.has(p)),
    cargaSaida: pe,
    cargaRetorno: pc,
    cargaMax: Math.max(pe, pc),
    total: cands.length,
  };
}
