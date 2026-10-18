// Dados DEMONSTRATIVOS usados no painel de planejamento e nos mapas de pedidos.
// Pedidos, pesos e números são fictícios e servem só para ilustrar a interface.
// Cada ponto (lat/lng) fica no centro aproximado do bairro citado — não são endereços de clientes.
// Os itens estão na ordem das paradas da rota de demonstração.

// Centro de distribuição de onde saem as rotas (posição fictícia).
export const DEPOT_GEO = { lat: -23.5165, lng: -46.588, name: "Centro de distribuição" };

export const ORDERS = {
  entrega: {
    color: "#2f6fe4",
    label: "Entregas",
    // distância em linha reta entre as paradas × 1,3; tempo a 30 km/h + 8 min por parada
    distance: "129 km",
    time: "5h 20min",
    items: [
      {
        id: "#1022",
        city: "Guarulhos",
        area: "Centro",
        vol: 2,
        kg: 22.0,
        lat: -23.4628,
        lng: -46.5333,
      },
      {
        id: "#1028",
        city: "Mauá",
        area: "Vila Assis",
        vol: 7,
        kg: 120.2,
        lat: -23.668,
        lng: -46.46,
      },
      {
        id: "#1024",
        city: "Santo André",
        area: "Jardim",
        vol: 6,
        kg: 87.2,
        lat: -23.6555,
        lng: -46.528,
      },
      {
        id: "#1027",
        city: "São Caetano",
        area: "Barcelona",
        vol: 4,
        kg: 49.3,
        lat: -23.623,
        lng: -46.556,
      },
      {
        id: "#1025",
        city: "São Bernardo",
        area: "Rudge Ramos",
        vol: 2,
        kg: 12.4,
        lat: -23.646,
        lng: -46.575,
      },
      {
        id: "#1026",
        city: "Diadema",
        area: "Centro",
        vol: 5,
        kg: 64.0,
        lat: -23.6861,
        lng: -46.6228,
      },
      { id: "#1021", city: "São Paulo", area: "Sé", vol: 4, kg: 58.4, lat: -23.5503, lng: -46.634 },
      { id: "#1023", city: "Osasco", area: "Km 18", vol: 3, kg: 41.5, lat: -23.5455, lng: -46.757 },
    ],
  },
  coleta: {
    color: "#c98410",
    label: "Coletas",
    distance: "113 km",
    time: "4h 35min",
    items: [
      {
        id: "#2032",
        city: "Carapicuíba",
        area: "Centro",
        vol: 2,
        kg: 18.5,
        lat: -23.5225,
        lng: -46.8356,
      },
      {
        id: "#2031",
        city: "Barueri",
        area: "Alphaville",
        vol: 5,
        kg: 72.0,
        lat: -23.498,
        lng: -46.849,
      },
      {
        id: "#2036",
        city: "Itapevi",
        area: "Centro",
        vol: 3,
        kg: 49.0,
        lat: -23.549,
        lng: -46.934,
      },
      {
        id: "#2033",
        city: "Cotia",
        area: "Granja Viana",
        vol: 4,
        kg: 56.3,
        lat: -23.59,
        lng: -46.835,
      },
      {
        id: "#2035",
        city: "Embu das Artes",
        area: "Centro",
        vol: 6,
        kg: 81.4,
        lat: -23.649,
        lng: -46.852,
      },
      {
        id: "#2034",
        city: "Taboão da Serra",
        area: "Centro",
        vol: 3,
        kg: 34.8,
        lat: -23.608,
        lng: -46.758,
      },
    ],
  },
};

export const VEHICLE_CAPACITY_KG = 650;

export const fmtKg = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
