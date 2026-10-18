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

  // Mapa de ruas dos mapas de pedidos. Padrão: OpenStreetMap, gratuito, sem chave, com crédito
  // obrigatório no canto do mapa e sem garantia de disponibilidade (regras em
  // https://operations.osmfoundation.org/policies/tiles/). Com muito acesso, troque por um
  // provedor pago (MapTiler, Stadia, Mapbox etc.) colando aqui a URL e o crédito que ele indicar.
  mapTiles: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>',
    maxZoom: 19,
  },
};
