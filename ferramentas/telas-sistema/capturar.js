// Fotografa o sistema ROTAV3 de verdade rodando, para a página de vendas.
//
// - O sistema é o repositório 2slrotav3 servido em http://127.0.0.1:8771 (SISTEMA=pasta dele).
// - Firebase simulado (o mesmo dos testes do sistema) com dados de demonstração: transportadora,
//   clientes, motoristas e placas são fictícios.
// - O fundo do mapa é um desenho nosso (mapa-fundo-claro.svg). A rede aqui é fechada, então
//   os blocos do mapa de ruas não carregam; a página avisa que o fundo do mapa é ilustrativo.
//
// Uso:  cd 2slrotav3 && python3 -m http.server 8771 &
//       NODE_PATH=... node capturar.js          → gera PNG em ./saida/
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SISTEMA = process.env.SISTEMA || '/home/claude/2slrotav3';
const FAKE = path.join(SISTEMA, 'tests/tela/fakefb');
const LEAF = path.join(SISTEMA, 'tests/tela/vendor/leaflet');
const SAIDA = path.join(__dirname, 'saida');
const { CD, PEDIDOS, ROTA, TOKEN } = require('./dados-video.js');
const MAPA_B64 = fs.readFileSync(path.join(__dirname, 'mapa-fundo-claro.b64'), 'utf8').trim();

const CSS_MAPA = `
.leaflet-tile-pane{display:none!important}
.leaflet-container{background-color:#edf0f3!important;background-image:url("data:image/svg+xml;base64,${MAPA_B64}")!important;
  background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
.leaflet-control-attribution{display:none!important}
`;

// rota em andamento: 2 de 6 paradas com baixa, veículo visto há 2 minutos.
// Montada com os mesmos campos que o sistema grava ao confirmar uma rota.
const AGORA = Date.now();
const tz = (h, m) => { const d = new Date(AGORA); const s = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return Date.parse(`${s}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-03:00`); };
const HOJE = new Date(AGORA - 3 * 3600e3).toISOString().slice(0, 10);
const IDS = ROTA.paradas.map((p) => p.nf);
const pedidos = JSON.parse(JSON.stringify(PEDIDOS));
const paradas = IDS.map((id, i) => { const p = pedidos[id];
  return { id, nf: String(p.nf), tipo: p.tipo, dest: p.dest, endereco: '', bairro: p.bairro, cidade: p.cidade, uf: 'SP',
    peso: p.peso, itens: p.itens, lat: p.lat, lng: p.lng, chegada_min: 450 + i * 42, janela_ini: null, janela_fim: null }; });
const RID = 'rota_demo_1';
Object.entries(pedidos).forEach(([id, p]) => { if (IDS.includes(id)) { p.status = 'despachado'; p.rota_atual = RID; } });
const rota = { id: RID, criada_em: new Date(tz(6, 52)).toISOString(), data: HOJE, saida: '07:00',
  veiculo: 'Accelo 1016 · RTV3A01', motorista: 'Marcos (exemplo)', cap_kg: 6000, placa: 'RTV3A01',
  km: 47.8, tempo_min: 236, peso_total: paradas.reduce((s, p) => s + p.peso, 0), num_paradas: paradas.length,
  entregas: paradas.filter((p) => p.tipo === 'entrega').length, coletas: paradas.filter((p) => p.tipo === 'coleta').length,
  status: 'em_rota', paradas, fonte_dist: 'OSRM', volta: true, fator_tempo: 1.25,
  token: TOKEN, link_expira: AGORA + 6 * 86400e3 };
rota.tracado = tracadoEmL([[CD.lat, CD.lng], ...paradas.map((p) => [p.lat, p.lng]), [CD.lat, CD.lng]]);
const BAIXAS = { 0: { status: 'feito', hora: tz(7, 34), recebedor: 'Ana Paula', temFoto: true },
  1: { status: 'feito', hora: tz(8, 16), recebedor: 'Jonas M.', temFoto: true } };
const FROTA = {
  m1: { id: 'm1', nome: 'Marcos (exemplo)', modelo: 'Accelo 1016', placa: 'RTV3A01', veiculo_id: 'tres4', veiculo_nome: 'Caminhão 3/4', cap_kg: 6000 },
  m2: { id: 'm2', nome: 'Carla (exemplo)', modelo: 'Fiorino', placa: 'RTV3B02', veiculo_id: 'fiorino', veiculo_nome: 'Fiorino', cap_kg: 650 },
  m3: { id: 'm3', nome: '', modelo: '915C', placa: 'RTV3C03', veiculo_id: 'tres4', veiculo_nome: 'Caminhão 3/4', cap_kg: 5500 },
  m4: { id: 'm4', nome: 'João (exemplo)', modelo: 'Atego 2426', placa: 'RTV3D04', veiculo_id: 'bitruck', veiculo_nome: 'Bitruck', cap_kg: 14000 },
};
const POS = { lat: -23.4452, lng: -46.4130, hora: AGORA - 120e3, precisao: 8 };

const seed = (d) => {
  window.__FAKE = {
    user: { uid: 'uid-op', email: 'operacao@exemplo.com.br', getIdToken: async () => 'T' },
    db: {
      acesso: { 'uid-op': true }, membros: { 'uid-op': 'emp1' },
      entregador: { [d.TOKEN]: {
        info: { rota: 'Rota 1', data: d.rota.data, motorista: d.rota.motorista, veiculo: d.rota.veiculo, empresa: 'Transportadora Exemplo', eid: 'emp1' },
        paradas: d.rota.paradas, expira: d.rota.link_expira,
        posicao: { ...d.POS, hora: Date.now() - 120e3 }, baixas: d.BAIXAS } },
      empresas: { emp1: { info: { nome: 'Transportadora Exemplo' },
        config: { deposito: d.CD }, pedidos_rota: d.pedidos, motoristas: d.FROTA,
        rotas_confirmadas: { [d.rota.id]: d.rota } } },
    },
  };
};


// Traçado da rota (polyline6, como o servidor de rotas devolve). Sem rede aqui, a linha
// liga as paradas em reta, sobre o mapa ilustrativo.
function polyline6(pts) {
  let out = '', pl = 0, pg = 0;
  const e = (v) => { v = v < 0 ? ~(v << 1) : v << 1; let r = ''; while (v >= 0x20) { r += String.fromCharCode((0x20 | (v & 0x1f)) + 63); v >>= 5; } return r + String.fromCharCode(v + 63); };
  for (const [lat, lng] of pts) { const a = Math.round(lat * 1e6), g = Math.round(lng * 1e6); out += e(a - pl) + e(g - pg); pl = a; pg = g; }
  return out;
}
function tracadoEmL(pts) {
  const r = [pts[0]];
  for (let i = 1; i < pts.length; i++) r.push(pts[i]);
  return polyline6(r);
}

// /solve simulado: a rota automática pega os pedidos mais perto do CD que cabem no veículo
function solve(body) {
  const cap = (body.veiculos && body.veiculos[0] && body.veiculos[0].capKg) || 6000;
  const d = (a, b) => Math.hypot(a.lat - b.lat, (a.lng - b.lng) * 0.92);
  const livres = body.pedidos.slice().sort((a, b) => d(a, CD) - d(b, CD));
  const esc = []; let kg = 0;
  for (const p of livres) { if (esc.length >= 8) break; if (kg + (+p.peso || 0) > cap) continue; esc.push(p); kg += +p.peso || 0; }
  const ord = []; let at = CD; const resto = esc.filter((p) => p.tipo !== 'coleta'), col = esc.filter((p) => p.tipo === 'coleta');
  for (const grupo of [resto, col]) while (grupo.length) { grupo.sort((a, b) => d(a, at) - d(b, at)); at = grupo.shift(); ord.push(at); }
  return { routes: [{ veiculo: body.veiculos[0].nome || 'Caminhão 3/4', veiculo_id: body.veiculos[0].id,
    pedidos: ord.map((x, i) => ({ ...x, chegada_min: 450 + 22 + i * 31 })), km: 47.8, mins: 236,
    tracado: tracadoEmL([[CD.lat, CD.lng], ...ord.map((x) => [x.lat, x.lng]), [CD.lat, CD.lng]]) }],
    nao_alocados: [], fonte_distancia: 'OSRM', salvo: false };
}

async function abrir(b, arquivo, W, H, mob, escala, gps) {
  const ctx = await b.newContext({ ...(gps ? { geolocation: gps, permissions: ['geolocation'] } : {}), timezoneId: 'America/Sao_Paulo', locale: 'pt-BR', viewport: { width: W, height: H }, isMobile: !!mob, hasTouch: !!mob, deviceScaleFactor: escala || 1 });
  await ctx.route(/gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[a-z]+\.js)/, (r) =>
    r.fulfill({ path: path.join(FAKE, r.request().url().match(/(firebase-[a-z]+\.js)/)[1]), contentType: 'text/javascript' }));
  await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/leaflet\/[\d.]+\/(leaflet\.min\.(js|css))/, (r) => {
    const f = r.request().url().match(/leaflet\.min\.(js|css)/)[1];
    r.fulfill({ path: path.join(LEAF, f === 'js' ? 'leaflet.js' : 'leaflet.css'), contentType: f === 'js' ? 'text/javascript' : 'text/css' });
  });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|tile\.openstreetmap|basemaps|cartocdn|arcgisonline|cdnjs\.cloudflare\.com\/ajax\/libs\/(xlsx|pdf)|railway\.app|viacep|nominatim/, (r) => r.abort());
  await ctx.route(/railway\.app\/solve/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(solve(JSON.parse(r.request().postData()))) }));
  await ctx.route(/railway\.app\/tracado/, (r) => {
    const body = JSON.parse(r.request().postData());
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ tracado: tracadoEmL(body.pontos.map((x) => [x.lat, x.lng])) }) });
  });
  await ctx.route(/railway\.app\/avaliar/, (r) => {
    const body = JSON.parse(r.request().postData());
    r.fulfill({ contentType: 'application/json', body: JSON.stringify({ km: 47.8, mins: 236,
      chegada_min: body.pedidos.map((_, i) => 472 + i * 31), fonte_distancia: 'OSRM', passa_da_jornada: false }) });
  });
  await ctx.addInitScript(seed, { CD, pedidos, rota, FROTA, POS, TOKEN, BAIXAS });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERRO:', e.message));
  await p.goto('http://127.0.0.1:8771/' + arquivo, { waitUntil: 'load' });
  await p.addStyleTag({ content: CSS_MAPA });
  await p.waitForTimeout(1200);
  return { ctx, p };
}
const foto = async (p, nome, el) => {
  await p.mouse.move(2, 2).catch(() => {});
  await (el ? p.locator(el).first() : p).screenshot({ path: path.join(SAIDA, nome + '.png') });
  console.log('  ·', nome);
};
const ir = async (p, pag, ms) => { await p.evaluate((x) => window.irParaPagina(x), pag); await p.waitForTimeout(ms || 1500); };

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const so = (process.argv[2] || '').split(',').filter(Boolean);
  const quer = (n) => !so.length || so.includes(n);
  const b = await chromium.launch({ args: ['--lang=pt-BR'], env: { ...process.env, LANG: 'pt_BR.UTF-8', LANGUAGE: 'pt_BR:pt' } });

  if (quer('escritorio')) {
    const { ctx, p } = await abrir(b, 'index.html', 1600, 1000, false, 1);
    await ir(p, 'dashboard', 1800); await foto(p, 'painel');
    await ir(p, 'pedidos'); await foto(p, 'pedidos');
    await ir(p, 'mapa', 2200);
    for (let i = 0; i < 2; i++) { await p.click('#mapa-completo .leaflet-control-zoom-in'); await p.waitForTimeout(500); }
    await foto(p, 'mapa');
    await ir(p, 'motoristas'); await foto(p, 'frota');
    await ir(p, 'rotas', 1800);
    await p.evaluate(() => { const c = document.querySelector('#page-rotas .rc-card .rc-card-head'); if (c) c.click(); });
    await p.waitForTimeout(1800);
    const mr = await p.$('#page-rotas .leaflet-container');
    if (mr) { const bb = await mr.boundingBox(); for (let i = 0; i < 1; i++) { await p.mouse.dblclick(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(500); } }
    await foto(p, 'rota');
    await ir(p, 'roteirizacao', 900);
    await p.evaluate(() => window.usarMotoristaD && window.usarMotoristaD('m3'));
    await p.waitForTimeout(500);
    await p.click('text=Continuar →').catch(() => {});
    await p.waitForTimeout(400);
    await foto(p, 'roteirizacao-confirmar');
    await p.click('text=Gerar Rota Agora').catch((e) => console.log('  ! gerar', e.message));
    await p.waitForTimeout(2600); await foto(p, 'roteirizacao');
    await ctx.close();
  }


  // "Sua marca": o mesmo painel com outras cores e outro logo (empresa fictícia), como é feito
  // na implantação (as cores do sistema são variáveis de CSS e o logo é um arquivo).
  if (quer('marca')) {
    const { ctx, p } = await abrir(b, 'index.html', 1600, 1000, false, 1);
    await ir(p, 'dashboard', 1800);
    const logo = '<svg xmlns="http://www.w3.org/2000/svg" width="304" height="74" viewBox="0 0 304 74"><rect x="2" y="9" width="56" height="56" rx="14" fill="#14b8a6"/><path d="M14 47 L30 22 L46 47 Z" fill="#fff"/><text x="70" y="42" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="30" fill="#ffffff">VALE NORTE</text><text x="71" y="63" font-family="Arial,Helvetica,sans-serif" font-weight="600" font-size="14" letter-spacing="4" fill="#5eead4">LOGÍSTICA</text></svg>';
    await p.evaluate((svg) => {
      const st = document.createElement('style');
      st.textContent = `:root{--vv:#14b8a6!important;--vv2:#0d9488!important;--mid:#0f766e!important;--ac:#0f766e!important;--brand:#14b8a6!important;--lime:#99f6e4!important;
        --vv-glow:rgba(20,184,166,.22)!important;--gold-grad:linear-gradient(180deg,#5eead4 0%,#14b8a6 55%,#0d9488 100%)!important;}
        .sidebar{background:#0b3a35!important;border-right-color:#0b3a35!important}
        .sb-item{color:#cfe9e4!important} .sb-item svg{stroke:#8fd3c7!important}
        .sb-item.active{color:#06231f!important} .sb-item.active svg{stroke:#06231f!important}
        .sb-footer{opacity:.25}`;
      document.head.appendChild(st);
      const img = document.querySelector('.sb-logo img'); if (img) img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }, logo);
    await p.waitForTimeout(600); await foto(p, 'marca-exemplo');
    await ctx.close();
  }

  if (quer('motorista')) {
    const m = await abrir(b, 'motorista.html#' + TOKEN, 330, 714, true, 2, { latitude: POS.lat, longitude: POS.lng, accuracy: 8 });
    await m.p.waitForTimeout(2500); await foto(m.p, 'motorista-lista');
    await m.p.evaluate(() => window.scrollTo(0, 0)); await m.p.waitForTimeout(400);
    await m.p.click('[data-acao=loc]').catch((e) => console.log('  ! loc', e.message)); await m.p.waitForTimeout(2500);
    await m.p.evaluate(() => window.scrollTo(0, 0)); await m.p.waitForTimeout(400); await foto(m.p, 'motorista-topo');
    await m.p.click('.btn.ok >> nth=0'); await m.p.waitForTimeout(700);
    await m.p.fill('form input:not([type=file]) >> nth=0', 'Roberto S.').catch((e) => console.log('  ! nome', e.message));
    await m.p.setInputFiles('form input[type=file]', path.join(__dirname, 'canhoto-exemplo.jpg')).catch((e) => console.log('  ! foto', e.message));
    await m.p.waitForTimeout(800);
    await m.p.evaluate(() => { const f = document.querySelector('form'); if (f) f.scrollIntoView({ block: 'center' }); });
    await m.p.waitForTimeout(500); await foto(m.p, 'motorista-baixa');
    await m.ctx.close();
  }

  if (quer('celular')) {
    const c = await abrir(b, 'index.html', 330, 714, true, 2);
    await ir(c.p, 'dashboard', 1800); await foto(c.p, 'painel-celular');
    await ir(c.p, 'mapa', 2200); await foto(c.p, 'mapa-celular');
    await c.ctx.close();
  }
  await b.close();
})();
