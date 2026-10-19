// Dados DEMONSTRATIVOS usados no painel de planejamento e nos mapas de pedidos.
// Pedidos, pesos e números são fictícios e servem só para ilustrar a interface.
// Cada ponto (lat/lng) fica no centro aproximado do bairro citado — não são endereços de clientes.
// A maior parte dos pedidos fica perto do centro de distribuição, em Guarulhos; alguns ficam mais
// longe (Arujá, Itaquaquecetuba, Tatuapé, Penha). Os itens estão na ordem das paradas da rota.

// Centro de distribuição de onde saem as rotas (posição fictícia, perto da Via Dutra).
export const DEPOT_GEO = { lat: -23.456, lng: -46.488, name: "Centro de distribuição" };

export const ORDERS = {
  entrega: {
    color: "#2f6fe4",
    label: "Entregas",
    // distância em linha reta entre as paradas × 1,3; tempo a 30 km/h + 8 min por parada
    distance: "92 km",
    time: "4h 10min",
    items: [
      {
        id: "#1024",
        city: "Guarulhos",
        area: "Pimentas",
        vol: 6,
        kg: 87.2,
        lat: -23.443,
        lng: -46.401,
      },
      {
        id: "#1028",
        city: "Arujá",
        area: "Centro",
        vol: 7,
        kg: 120.2,
        lat: -23.3965,
        lng: -46.321,
      },
      {
        id: "#1027",
        city: "Guarulhos",
        area: "Bonsucesso",
        vol: 4,
        kg: 49.3,
        lat: -23.421,
        lng: -46.412,
      },
      {
        id: "#1025",
        city: "Guarulhos",
        area: "Taboão",
        vol: 2,
        kg: 12.4,
        lat: -23.425,
        lng: -46.492,
      },
      {
        id: "#1026",
        city: "Guarulhos",
        area: "Vila Rio de Janeiro",
        vol: 5,
        kg: 64.0,
        lat: -23.439,
        lng: -46.505,
      },
      {
        id: "#1021",
        city: "Guarulhos",
        area: "Vila Galvão",
        vol: 4,
        kg: 58.4,
        lat: -23.4525,
        lng: -46.564,
      },
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
        id: "#1023",
        city: "São Paulo",
        area: "Tatuapé",
        vol: 3,
        kg: 41.5,
        lat: -23.54,
        lng: -46.576,
      },
    ],
  },
  coleta: {
    color: "#c98410",
    label: "Coletas",
    distance: "63 km",
    time: "2h 55min",
    items: [
      {
        id: "#2032",
        city: "Guarulhos",
        area: "Macedo",
        vol: 2,
        kg: 18.5,
        lat: -23.48,
        lng: -46.545,
      },
      {
        id: "#2031",
        city: "Guarulhos",
        area: "Itapegica",
        vol: 5,
        kg: 72.0,
        lat: -23.49,
        lng: -46.53,
      },
      {
        id: "#2036",
        city: "São Paulo",
        area: "Penha",
        vol: 3,
        kg: 49.0,
        lat: -23.527,
        lng: -46.542,
      },
      {
        id: "#2033",
        city: "Itaquaquecetuba",
        area: "Centro",
        vol: 4,
        kg: 56.3,
        lat: -23.486,
        lng: -46.348,
      },
      {
        id: "#2035",
        city: "Guarulhos",
        area: "Jardim Presidente Dutra",
        vol: 6,
        kg: 81.4,
        lat: -23.448,
        lng: -46.43,
      },
      {
        id: "#2034",
        city: "Guarulhos",
        area: "Cumbica",
        vol: 3,
        kg: 34.8,
        lat: -23.449,
        lng: -46.469,
      },
    ],
  },
};

export const VEHICLE_CAPACITY_KG = 650;

export const fmtKg = (n) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";
