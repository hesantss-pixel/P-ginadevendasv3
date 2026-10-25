# ROTAV3 Systems — página de vendas (site estático)

Página de vendas do ROTAV3 em **www.rotav3.com.br**. Versão 6 (24/10/2026): refeita a partir do
sistema real, para mostrar o que ele faz de verdade — importação das notas, mapa com todos os
pedidos, criação de rota, link do motorista, baixas em tempo real e assistente de IA.

É um site estático (HTML, CSS e JavaScript), sem etapa de build: os arquivos desta pasta são o site.

## O que tem na página

| Seção | O que mostra | Arquivo |
| --- | --- | --- |
| Topo | Título "Rotas prontas no automático. Cada entrega e coleta acompanhada no mapa.", "Ver o sistema por dentro" (pede e-mail e senha de demonstração pelo WhatsApp), "Agendar demonstração" e um filme em 5 cenas feito com as telas do sistema (importar notas → mapa → gerar rota → enviar ao motorista → acompanhar ao vivo). Fundo com a maquete 3D. | `js/filme.js` |
| Um dia de operação | Linha do tempo das 07:00 às 17:30 com telas pequenas do sistema; a linha dourada enche com a rolagem. | `js/dia.js` |
| Criar rota | Planejador interativo no mapa de ruas (OpenFreeMap): veículo, entregas/coletas/as duas, saída, capacidade e limite de paradas; "Montar a próxima viagem" com os pedidos que sobraram. Gera a primeira rota sozinho quando aparece. | `js/planejador.js`, `js/roteiro.js` |
| Mapa 3D | Maquete da Grande São Paulo com os limites reais dos municípios (IBGE), relevo pela quantidade de pedidos, 86 pinos com filtro (todos, entregas, coletas, com horário) e lista por cidade. | `js/mapa3d.js`, `js/dados-regiao.js` |
| Ao vivo | A **tela do motorista real do sistema** (modo demonstração) dentro de um celular. Cada baixa marcada nele atualiza o painel do escritório ao lado (progresso, mapa, motivo, foto). | `js/aovivo.js` |
| IA | Conversa de exemplo com as três perguntas do sistema; respostas calculadas com os 86 pedidos fictícios do mapa. | `js/ia.js` |
| Sua marca | Modelos do painel com a identidade da Via Verde Transportes e da 2SL Log (telas ilustrativas, com dados demonstrativos); tocar amplia. | `index.html`, `img/modelo-*.webp` |
| Funções, Como começar, Preços, Perguntas, Contato | Texto e formulários (abrem o WhatsApp com a mensagem pronta). Preço: só "planos a partir de R$ 197/mês"; o valor da frota é consultado pelo WhatsApp ("Consultar o valor da minha frota"). | `js/main.js` |

Todos os dados das demonstrações são **fictícios** e a página avisa isso em cada lugar. Nada do que
o visitante faz nas demonstrações sai do navegador dele.

## Ver no seu computador

Os scripts usam módulos JavaScript, que não carregam abrindo o `index.html` com duplo clique. Use um
servidor local:

- **Python:** dentro desta pasta, `python -m http.server 8080` e abra `http://localhost:8080`.
- **VS Code:** extensão "Live Server" → botão direito no `index.html` → "Open with Live Server".

A seção "Ao vivo" carrega a tela do motorista publicada no endereço do sistema
(`motoristaDemoUrl` em `js/config.js`) e aceita mensagens dela também em `localhost`.

## Publicar (repositório `P-ginadevendasv3`, GitHub Pages)

O site é publicado pelo GitHub Pages a partir da branch `main`, pasta raiz, com o domínio no arquivo
`CNAME`. Para atualizar: envie os arquivos desta pasta para o repositório (pelo `git push` ou em
**Add file → Upload files**) e aguarde 1 a 2 minutos.

O repositório é público. Nunca coloque senhas ou tokens nestes arquivos.

## Onde alterar cada coisa

- **WhatsApp, envio dos formulários, endereço do motorista de exemplo, mapa de ruas:** `js/config.js`.
  - `whatsappNumber`: `5511955914618`.
  - `formEndpoint`: vazio = os formulários abrem o WhatsApp com a mensagem pronta. Preenchido (webhook
    do n8n, Formspree, Make, Apps Script), os formulários pedem também e-mail e WhatsApp e enviam um
    POST comum (`application/x-www-form-urlencoded`) com `tipo` (`acesso` ou `agendar`), `nome`,
    `empresa`, `frota`, `email`, `telefone`, `interesse`, `origem` e `enviadoEm`. O destino precisa
    responder 2xx e liberar o domínio do site em CORS.
- **Mensagens do WhatsApp:** função `mensagem()` em `js/main.js`.
  - Ver o sistema: "Olá! Quero ver o sistema ROTAV3 por dentro. Pode me enviar um acesso de
    demonstração (e-mail e senha)? Sou …, da …. E-mail para o acesso: …"
  - Agendar: "Olá! Sou …, da …. Temos … veículos. Gostaria de agendar uma demonstração do ROTAV3 com
    os dados da nossa operação."
  - Consultar valor: "Olá! Sou …, da …. Temos … veículos. Gostaria de saber o valor do ROTAV3 para a
    nossa frota."
- **Textos, preço inicial e perguntas:** `index.html` (o "a partir de" também está no `<meta name="description">` e no JSON-LD).
- **Pedidos do planejador, rota do topo, veículos:** `js/dados.js`.
- **Cores, tamanhos e espaçamentos:** variáveis no começo de `css/style.css`.
- **CNPJ:** rodapé do `index.html`, dados estruturados (JSON-LD) e `privacidade.html`.

## Como responder um pedido de "Ver o sistema"

1. A mensagem chega no WhatsApp com nome, empresa e e-mail.
2. No sistema, entre como administrador → **Acessos** → "Criar acesso de demonstração" com o nome e o
   e-mail. O sistema gera a senha e o botão do WhatsApp manda link, e-mail, senha e validade (7 dias).
3. A conta de demonstração entra com 86 pedidos fictícios, não vê nem altera os dados reais e pode
   gerar rotas, abrir a tela do motorista e conversar com a IA (com limite por hora no servidor).

As regras do banco (`firebase/database.rules.json` no repositório do sistema) precisam estar
publicadas no Firebase para a página Acessos gravar.

## Mapas e 3D

- **Mapa 3D:** imagem pré-renderizada (three.js r169) com os limites dos municípios do IBGE e rodovias
  e rios do Natural Earth; os pinos, rótulos e o CD são HTML por cima da imagem, nas posições
  calculadas na renderização. Nada de WebGL no celular do visitante. Como refazer:
  `ferramentas/mapa-3d/README.md`.
- **Fundo dos mapas do filme e do painel ao vivo:** `img/mapa-guarulhos.svg`, ilustrativo (limites
  reais, quadras só como textura).
- **Planejador:** mapa de ruas do OpenFreeMap (gratuito, sem chave, uso comercial permitido), com o
  OpenStreetMap como reserva se o mapa vetorial não carregar.
- **Rota do planejador:** calculada no navegador (`js/roteiro.js`) com as mesmas regras do sistema
  (capacidade, limite de paradas, janela de horário, entregas antes das coletas, 15 min por parada,
  jornada de 8 h), mas com distância em linha reta × 1,3. A página diz isso logo abaixo do mapa.

## Animações e acessibilidade

- O filme do topo avança sozinho só quando está na tela, tem botão de pausa e capítulos clicáveis.
- Com "reduzir movimento" ligado no aparelho, nada anda sozinho: cada cena aparece pronta.
- A linha do "dia de operação" e o endireitar do filme usam animação ligada à rolagem
  (`animation-timeline`) só nos navegadores que suportam; nos outros, ficam no estado final.
- Formulários com rótulos, mensagens de erro ligadas aos campos e foco visível.

## Fontes e licenças

- Fontes servidas pelo próprio site (`fonts/`, recorte latino em WOFF2): Inter, Sora e JetBrains
  Mono, licença SIL Open Font License (arquivos `OFL-*.txt`).
- Ícones 3D: Fluent Emoji (Microsoft, licença MIT — `img/ic/LICENSE-fluent-emoji.txt`).
- Leaflet (BSD-2), MapLibre GL JS (BSD-3) e o plugin maplibre-gl-leaflet (ISC) em `vendor/`.
- Mapas: © colaboradores do OpenStreetMap, OpenMapTiles, OpenFreeMap. Limites: IBGE. Natural Earth:
  domínio público. Os créditos aparecem no rodapé e nos mapas.

## O que foi testado (24/10/2026)

Chromium (Playwright) a 1440, 390, 360 e 320 px de largura e com "reduzir movimento": filme e
capítulos, pausa, planejador (gerar, trocar veículo e tipo, próxima viagem, fora da janela,
recomeçar), filtros e dicas do mapa 3D, tela do motorista real dentro do celular mandando as baixas
para o painel (sem rolar a página de fora), conversa da IA, modelos ampliando, os dois formulários
(validação e mensagem do WhatsApp), menu do celular, sem rolagem lateral e sem erros no console.

Não foi possível testar daqui: os mapas de ruas reais (o ambiente de teste bloqueia os servidores de
mapa) e o Safari do iPhone.

## Domínio www.rotav3.com.br (comprado em 23/10/2026, válido até 23/10/2027)

- Registrado no Registro.br no CNPJ da ROTAV3; DNS do próprio Registro.br.
- 4 registros A no domínio sem www (185.199.108.153, .109.153, .110.153, .111.153) e CNAME `www` →
  `hesantss-pixel.github.io`.
- `CNAME`, endereço canônico, `robots.txt` e `sitemap.xml` apontam para o domínio.
- Em Settings → Pages, marque **Enforce HTTPS** quando a opção estiver disponível.

## Histórico

- v1 a v5.8 (18 a 23/10/2026): primeira página, versões com painel em perspectiva, maquetes 3D
  ilustrativas, planejador, mapas de pedidos, oferta e preços, domínio próprio.
- **v6 (24/10/2026):** página refeita a partir do sistema real; "Ver o sistema" no topo; filme do
  produto; dia de operação; planejador com as regras do sistema; mapa 3D da Grande SP; tela do
  motorista real sincronizando com o painel; IA; modelos com a identidade de outras empresas; fontes no próprio site.
- **v6.1 (25/10/2026):** título "Rotas prontas no automático. Cada entrega e coleta acompanhada no
  mapa."; tabela de planos trocada por "a partir de R$ 197/mês" + consulta do valor pela frota.
