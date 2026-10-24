// Configurações do site. Edite só este arquivo para trocar o WhatsApp, ligar o envio real dos
// formulários ou mudar o endereço do sistema.
export const SITE_CONFIG = {
  // WhatsApp comercial com DDI e DDD, só dígitos. Ex.: "5511912345678".
  whatsappNumber: "5511955914618",
  whatsappMessage: "Olá! Quero conhecer o ROTAV3 Systems.",

  // Endereço que recebe os formulários (POST com os campos). Pode ser um webhook do n8n, Formspree,
  // Make, Google Apps Script etc. O destino precisa responder com status 2xx.
  // Enquanto estiver vazio, os formulários abrem o WhatsApp com a mensagem pronta.
  formEndpoint: "",

  // Tela do motorista do sistema em modo de demonstração (rota de exemplo, sem banco de dados).
  // A seção "Ao vivo" mostra essa página dentro de um celular. Só aceita mensagens desta origem.
  motoristaDemoUrl: "https://hesantss-pixel.github.io/2slrotav3/motorista.html#demo",

  // Mapa de ruas do planejador.
  // vectorStyle: estilo claro do OpenFreeMap (gratuito, sem chave, uso comercial permitido —
  // https://openfreemap.org). Precisa de WebGL.
  // url/attribution: reserva quando o mapa vetorial não carrega (OpenStreetMap; regras em
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
