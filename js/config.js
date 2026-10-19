// Configurações do site. Edite só este arquivo para ligar o WhatsApp e o envio real do formulário.
export const SITE_CONFIG = {
  // Número do WhatsApp comercial com DDI e DDD, só dígitos. Ex.: "5511912345678".
  // Enquanto estiver vazio, o botão "Falar no WhatsApp" fica escondido.
  whatsappNumber: "",
  whatsappMessage: "Olá! Quero conhecer o ROTAV3 Systems.",

  // Endereço que recebe o formulário (POST com os campos do formulário). Pode ser um webhook do
  // n8n, Formspree, Make, Google Apps Script etc. O destino precisa responder com status 2xx.
  // Enquanto estiver vazio, o formulário só valida os campos e avisa que está em modo de
  // demonstração — nada é enviado.
  formEndpoint: "",

  // Mapas de ruas (painel de planejamento e "Pedidos no mapa").
  // vectorStyle: mapa claro no estilo dos aplicativos de mapa, do OpenFreeMap (gratuito, sem chave,
  // uso comercial permitido, sem limite de acessos — https://openfreemap.org). Precisa de WebGL.
  // url/attribution: reserva usada quando o mapa vetorial não carrega (OpenStreetMap; regras em
  // https://operations.osmfoundation.org/policies/tiles/).
  mapTiles: {
    vectorStyle: "https://tiles.openfreemap.org/styles/liberty",
    vectorAttribution:
      '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>',
    maxZoom: 19,
  },
};
