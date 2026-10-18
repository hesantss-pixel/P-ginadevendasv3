// Dados DEMONSTRATIVOS usados no painel interativo e nos mapas de pedidos.
// Pedidos, cidades, pesos e números são fictícios e servem só para ilustrar a interface.

export const MAP_W = 1200;
export const MAP_H = 1000;
// posiciona os pontos no miolo do mapa (sobra borda para o painel nunca mostrar fundo vazio)
const P = (x, y) => ({
  x: Math.round(330 + (x - 100) * 0.8),
  y: Math.round(200 + (y - 100) * 1.1),
});
export const MAP_SEED = 7;

export const DEPOT = { ...P(500, 360), name: "Centro de distribuição" };

export const ORDERS = {
  entrega: {
    color: "#2f6fe4",
    label: "Entregas",
    distance: "78 km",
    time: "2h 15min",
    items: [
      {
        id: "#1021",
        city: "São Paulo",
        area: "Sé",
        vol: 4,
        kg: 58.4,
        lat: -23.5503,
        lng: -46.634,
        ...P(380, 250),
      },
      {
        id: "#1022",
        city: "Guarulhos",
        area: "Centro",
        vol: 2,
        kg: 22.0,
        lat: -23.4628,
        lng: -46.5333,
        ...P(565, 150),
      },
      {
        id: "#1023",
        city: "Osasco",
        area: "Km 18",
        vol: 3,
        kg: 41.5,
        lat: -23.5455,
        lng: -46.757,
        ...P(705, 235),
      },
      {
        id: "#1024",
        city: "Santo André",
        area: "Jardim",
        vol: 6,
        kg: 87.2,
        lat: -23.6555,
        lng: -46.528,
        ...P(770, 385),
      },
      {
        id: "#1025",
        city: "São Bernardo",
        area: "Rudge Ramos",
        vol: 2,
        kg: 12.4,
        lat: -23.646,
        lng: -46.575,
        ...P(655, 505),
      },
      {
        id: "#1026",
        city: "Diadema",
        area: "Centro",
        vol: 5,
        kg: 64.0,
        lat: -23.6861,
        lng: -46.6228,
        ...P(470, 545),
      },
      {
        id: "#1027",
        city: "São Caetano",
        area: "Barcelona",
        vol: 4,
        kg: 49.3,
        lat: -23.623,
        lng: -46.556,
        ...P(330, 470),
      },
      {
        id: "#1028",
        city: "Mauá",
        area: "Vila Assis",
        vol: 7,
        kg: 120.2,
        lat: -23.668,
        lng: -46.46,
        ...P(250, 335),
      },
    ],
  },
  coleta: {
    color: "#c98410",
    label: "Coletas",
    distance: "64 km",
    time: "1h 50min",
    items: [
      {
        id: "#2031",
        city: "Barueri",
        area: "Alphaville",
        vol: 5,
        kg: 72.0,
        lat: -23.498,
        lng: -46.849,
        ...P(180, 165),
      },
      {
        id: "#2032",
        city: "Carapicuíba",
        area: "Centro",
        vol: 2,
        kg: 18.5,
        lat: -23.5225,
        lng: -46.8356,
        ...P(315, 105),
      },
      {
        id: "#2033",
        city: "Cotia",
        area: "Granja Viana",
        vol: 4,
        kg: 56.3,
        lat: -23.59,
        lng: -46.835,
        ...P(115, 300),
      },
      {
        id: "#2034",
        city: "Taboão da Serra",
        area: "Centro",
        vol: 3,
        kg: 34.8,
        lat: -23.608,
        lng: -46.758,
        ...P(195, 455),
      },
      {
        id: "#2035",
        city: "Embu das Artes",
        area: "Centro",
        vol: 6,
        kg: 81.4,
        lat: -23.649,
        lng: -46.852,
        ...P(335, 590),
      },
      {
        id: "#2036",
        city: "Itapevi",
        area: "Centro",
        vol: 3,
        kg: 49.0,
        lat: -23.549,
        lng: -46.934,
        ...P(560, 640),
      },
    ],
  },
};

// Centro de distribuição usado nos mapas de ruas (posição fictícia, só para ilustrar).
export const DEPOT_GEO = { lat: -23.5165, lng: -46.588, name: "Centro de distribuição" };

// Os pontos dos mapas de ruas (lat/lng) ficam no centro aproximado de cada bairro citado.
// Não são endereços de clientes.

export const VEHICLE_CAPACITY_KG = 650;

// Rotas de contexto (só desenho, sem interação), para o mapa parecer uma operação completa.
export const CONTEXT_ROUTES = [
  {
    color: "#e5484d",
    pts: [
      [500, 360],
      [610, 300],
      [690, 330],
      [860, 300],
      [905, 180],
      [820, 110],
    ].map(([x, y]) => {
      const q = P(x, y);
      return [q.x, q.y];
    }),
  },
  {
    color: "#f5a922",
    pts: [
      [500, 360],
      [560, 430],
      [590, 610],
      [760, 600],
      [880, 520],
      [930, 620],
    ].map(([x, y]) => {
      const q = P(x, y);
      return [q.x, q.y];
    }),
  },
];

export const fmtKg = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
