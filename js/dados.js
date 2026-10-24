// Dados FICTÍCIOS usados nas demonstrações desta página. Nenhum pedido, empresa ou endereço é de
// cliente real. As coordenadas ficam no centro aproximado dos bairros citados.

// Centro de distribuição de onde saem as rotas de exemplo (ponto fictício perto da Via Dutra).
export const CD = { lat: -23.456, lng: -46.488, nome: "CD Guarulhos (exemplo)" };

// Rota de exemplo do topo: a mesma que aparece na tela do motorista de demonstração do sistema.
export const ROTA_FILME = {
  veiculo: "VUC",
  motorista: "Carlos (exemplo)",
  saida: 450, // 07:30, em minutos desde a meia-noite
  km: 38.4,
  paradas: [
    { nf: "31024", tipo: "entrega", dest: "Mercado Bela Vista", bairro: "Vila Augusta", lat: -23.4637, lng: -46.5398, peso: 180, chegada: 472 },
    { nf: "31031", tipo: "entrega", dest: "Farmácia Central", bairro: "Centro", lat: -23.4673, lng: -46.528, peso: 95, chegada: 501 },
    { nf: "31047", tipo: "entrega", dest: "Padaria Primavera", bairro: "Macedo", lat: -23.4891, lng: -46.5466, peso: 120, chegada: 544, janela: [540, 600] },
    { nf: "31052", tipo: "entrega", dest: "Loja do Construtor", bairro: "Cumbica", lat: -23.4562, lng: -46.4618, peso: 310, chegada: 588 },
    { nf: "31060", tipo: "entrega", dest: "Auto Peças Avenida", bairro: "Pimentas", lat: -23.443, lng: -46.408, peso: 64, chegada: 631 },
    { nf: "88013", tipo: "coleta", dest: "Fábrica de Embalagens Sul", bairro: "Bonsucesso", lat: -23.4312, lng: -46.4053, peso: 260, chegada: 665 },
  ],
};

// Pedidos pendentes do planejador interativo (Guarulhos, Arujá, Itaquaquecetuba e zona leste de SP).
// janela: [início, fim] em minutos desde a meia-noite.
export const PEDIDOS_PLANO = [
  { nf: "31024", tipo: "entrega", dest: "Mercado Bela Vista", bairro: "Vila Augusta", cidade: "Guarulhos", lat: -23.4637, lng: -46.5398, peso: 180 },
  { nf: "31031", tipo: "entrega", dest: "Farmácia Central", bairro: "Centro", cidade: "Guarulhos", lat: -23.4673, lng: -46.528, peso: 95 },
  { nf: "31047", tipo: "entrega", dest: "Padaria Primavera", bairro: "Macedo", cidade: "Guarulhos", lat: -23.4891, lng: -46.5466, peso: 120, janela: [540, 600] },
  { nf: "31052", tipo: "entrega", dest: "Loja do Construtor", bairro: "Cumbica", cidade: "Guarulhos", lat: -23.4562, lng: -46.4618, peso: 310 },
  { nf: "31060", tipo: "entrega", dest: "Auto Peças Avenida", bairro: "Pimentas", cidade: "Guarulhos", lat: -23.443, lng: -46.408, peso: 64 },
  { nf: "31066", tipo: "entrega", dest: "Distribuidora Ponte Grande", bairro: "Ponte Grande", cidade: "Guarulhos", lat: -23.4765, lng: -46.5245, peso: 410 },
  { nf: "31071", tipo: "entrega", dest: "Restaurante Sabor da Vila", bairro: "Vila Galvão", cidade: "Guarulhos", lat: -23.4525, lng: -46.564, peso: 75 },
  { nf: "31075", tipo: "entrega", dest: "Papelaria Estrela", bairro: "Gopoúva", cidade: "Guarulhos", lat: -23.4605, lng: -46.5505, peso: 48 },
  { nf: "31079", tipo: "entrega", dest: "Clínica Bem Viver", bairro: "Jardim Maia", cidade: "Guarulhos", lat: -23.4545, lng: -46.5195, peso: 36, janela: [480, 570] },
  { nf: "31083", tipo: "entrega", dest: "Hortifrúti Boa Safra", bairro: "Itapegica", cidade: "Guarulhos", lat: -23.4905, lng: -46.5305, peso: 260 },
  { nf: "31088", tipo: "entrega", dest: "Pet Shop Amigo Fiel", bairro: "Picanço", cidade: "Guarulhos", lat: -23.4685, lng: -46.5135, peso: 58 },
  { nf: "31092", tipo: "entrega", dest: "Materiais Elétricos Luz", bairro: "Jardim Presidente Dutra", cidade: "Guarulhos", lat: -23.448, lng: -46.43, peso: 140 },
  { nf: "31096", tipo: "entrega", dest: "Mercadinho São João", bairro: "Bonsucesso", cidade: "Guarulhos", lat: -23.4205, lng: -46.4175, peso: 155 },
  { nf: "31101", tipo: "entrega", dest: "Lanchonete do Ponto", bairro: "Centro", cidade: "Itaquaquecetuba", lat: -23.486, lng: -46.348, peso: 66, janela: [840, 960] },
  { nf: "31105", tipo: "entrega", dest: "Ferragens Arujá", bairro: "Centro", cidade: "Arujá", lat: -23.3965, lng: -46.321, peso: 220 },
  { nf: "31110", tipo: "entrega", dest: "Empório Penha", bairro: "Penha", cidade: "São Paulo", lat: -23.527, lng: -46.542, peso: 90, janela: [600, 720] },
  { nf: "31114", tipo: "entrega", dest: "Drogaria Tatuapé", bairro: "Tatuapé", cidade: "São Paulo", lat: -23.54, lng: -46.576, peso: 41 },
  { nf: "31118", tipo: "entrega", dest: "Mercado Vila Maria", bairro: "Vila Maria", cidade: "São Paulo", lat: -23.513, lng: -46.58, peso: 175 },
  { nf: "31122", tipo: "entrega", dest: "Loja Ermelino", bairro: "Ermelino Matarazzo", cidade: "São Paulo", lat: -23.499, lng: -46.479, peso: 85 },
  { nf: "31126", tipo: "entrega", dest: "Atacado São Miguel", bairro: "São Miguel Paulista", cidade: "São Paulo", lat: -23.4975, lng: -46.442, peso: 340 },
  { nf: "88013", tipo: "coleta", dest: "Fábrica de Embalagens Sul", bairro: "Bonsucesso", cidade: "Guarulhos", lat: -23.4312, lng: -46.4053, peso: 260 },
  { nf: "88017", tipo: "coleta", dest: "Metalúrgica Cumbica", bairro: "Cidade Jardim Cumbica", cidade: "Guarulhos", lat: -23.4588, lng: -46.4475, peso: 420 },
  { nf: "88021", tipo: "coleta", dest: "Confecções Ponte Grande", bairro: "Ponte Grande", cidade: "Guarulhos", lat: -23.481, lng: -46.519, peso: 180 },
  { nf: "88026", tipo: "coleta", dest: "Gráfica Vila Augusta", bairro: "Vila Augusta", cidade: "Guarulhos", lat: -23.4665, lng: -46.5455, peso: 95 },
  { nf: "88030", tipo: "coleta", dest: "Plásticos Itaquá", bairro: "Vila Virgínia", cidade: "Itaquaquecetuba", lat: -23.4795, lng: -46.36, peso: 510 },
  { nf: "88034", tipo: "coleta", dest: "Embalagens Arujá", bairro: "Jardim Real", cidade: "Arujá", lat: -23.389, lng: -46.315, peso: 300 },
];

// Veículos do planejador (os mesmos nomes do sistema; capacidade inicial sugerida).
export const VEICULOS = [
  { id: "fiorino", nome: "Fiorino", cap: 650, dica: "furgão leve" },
  { id: "vuc", nome: "VUC", cap: 3000, dica: "veículo urbano de carga" },
  { id: "toco", nome: "Truck Toco", cap: 8000, dica: "2 eixos" },
];

export const hhmm = (min) => {
  const m = Math.round(min);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
export const kg = (n) => `${Math.round(n).toLocaleString("pt-BR")} kg`;
export const esc = (t) =>
  String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
