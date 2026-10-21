# ROTAV3 Systems — landing page (site estático)

Página de vendas do ROTAV3 Systems. Versão 3 (19/10/2026), reorganizada a partir da pesquisa de conversão: topo com o mecanismo do produto e o painel em perspectiva 3D, "Como funciona" em 3 passos, planejador interativo logo em seguida, seção escura de dores com mapa 3D e calculadora, mapas de pedidos, funcionalidades em bento com telas reais, modelos de personalização, "Para quem é", transparência (o que faz e o que ainda não faz), preço, perguntas, chamada final, formulário de 3 campos que abre o WhatsApp e política de privacidade.

É um site estático (HTML, CSS e JavaScript), sem etapa de build: os arquivos desta pasta são o site. Isso permite publicar direto no GitHub Pages.

## Ver no seu computador

Os scripts usam módulos JavaScript, que o navegador **não** carrega abrindo o `index.html` com duplo clique. Use um servidor local, por exemplo:

- **VS Code:** instale a extensão "Live Server", clique com o botão direito no `index.html` e escolha "Open with Live Server".
- **Python:** dentro desta pasta, rode `python -m http.server 8080` e abra `http://localhost:8080`.
- **Node:** `npx serve .`

## Publicar no GitHub Pages (repositório `P-ginadevendasv3`)

Hoje o `index.html` desse repositório é, na verdade, o ZIP do Lovable renomeado. Ele não abre como site.

1. No GitHub, abra o repositório `P-ginadevendasv3` e apague o `index.html` atual.
2. Clique em **Add file → Upload files** e arraste o **conteúdo** desta pasta (`index.html` e as pastas `css`, `js`, `vendor` e `img`), não a pasta inteira. Clique em **Commit changes**. O `README.md` é opcional: se subir, ele também fica público.
3. Vá em **Settings → Pages**. Em **Source**, escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e clique em **Save**.
4. Em 1 ou 2 minutos o site fica em `https://hesantss-pixel.github.io/P-ginadevendasv3/`.

O repositório é público, então o site e o código ficam públicos. Nunca coloque senhas ou tokens nestes arquivos.

## WhatsApp, formulário e CNPJ

Tudo fica em `js/config.js`:

- `whatsappNumber`: `5511955914618` — (11) 95591-4618. Liga os botões "Falar no WhatsApp" e o link do rodapé. Para trocar, use só dígitos com DDI e DDD.
- `formEndpoint`: vazio por enquanto. Enquanto estiver vazio, o formulário pede só **nome, empresa e quantidade de veículos** e **abre o WhatsApp** com a mensagem pronta ("Olá! Sou …, da …. Temos … veículos. Quero ver o ROTAV3 com os nossos pedidos."). O próprio WhatsApp já identifica o número de quem escreve. Se o navegador bloquear a janela, aparece o link "Não abriu? Toque aqui."
- Quando `formEndpoint` for preenchido, o formulário passa a pedir também e-mail e WhatsApp e envia os dados para esse endereço (e deixa de abrir o WhatsApp).

O CNPJ (68.080.201/0001-80) está escrito no rodapé e na seção Transparência, no `index.html`, e nos dados estruturados (JSON-LD). O número do WhatsApp também está escrito em `privacidade.html`; se mudar, troque lá também.

No modo com endereço, o formulário envia um POST comum (`application/x-www-form-urlencoded`) com os campos `nome`, `empresa`, `frota`, `email`, `telefone`, `interesse` (vazio ou `rastreamento`), `origem` e `enviadoEm`. O destino precisa responder com status 2xx.

Exemplo com **n8n**: crie um nó _Webhook_ (método POST), copie a _Production URL_ para `formEndpoint`, ative o workflow e, nas opções do Webhook, libere o domínio do site em _Allowed Origins (CORS)_. Depois ligue o nó seguinte (planilha, e-mail, CRM). Também funciona com Formspree, Make ou Google Apps Script.

A política de privacidade fica em `privacidade.html` (link no rodapé, no formulário, na Transparência e no FAQ). Ela descreve o que o site faz hoje (sem cookies de publicidade, sem análise de visitantes, formulário que só abre o WhatsApp). Se o site passar a guardar dados (por exemplo, com `formEndpoint`) ou ganhar uma ferramenta de análise, atualize o texto. Vale uma revisão por um advogado.

## Endereço do site, imagem de compartilhamento e SEO

- `og:url`, `og:image` e os dados estruturados (JSON-LD `Organization` + `SoftwareApplication`) usam o endereço atual `https://hesantss-pixel.github.io/P-ginadevendasv3/`. Quando o domínio próprio (rotav3.com.br) estiver ligado, troque esse endereço no `<head>` do `index.html`.
- Não há avaliações (`aggregateRating`) nos dados estruturados, porque não existem avaliações reais.

## Onde alterar cada coisa

| O quê                                                        | Arquivo                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Textos das seções, menu, FAQ, preço, transparência, rodapé   | `index.html`                                                               |
| Política de privacidade                                      | `privacidade.html`                                                         |
| Calculadora "Quanto custa montar rotas à mão?"               | `index.html` (valores iniciais) + `js/main.js`                             |
| Telas do sistema nas funcionalidades (bento)                 | `img/ui-*.webp` (recortes de `img/painel-rotav3.webp`)                     |
| Cores, tamanhos, espaçamentos, celular                       | `css/style.css` (variáveis no começo do arquivo)                           |
| Pedidos, pesos e rotas do painel interativo (demonstrativos) | `js/data.js`                                                               |
| Imagem do painel no topo                                     | `img/painel-rotav3.webp`                                                   |
| Modelos de empresas (seção "Personalização")                 | `index.html` + `img/modelo-*.webp`                                         |
| Mapa do painel de planejamento (paradas numeradas)           | `js/planmap.js`                                                            |
| Mapas de ruas (pedidos, coletas e entregas)                  | `js/ordersmap.js` (pontos em `js/data.js`, mapa de ruas em `js/config.js`) |
| Mapa 3D da seção escura                                      | `js/city3d.js`                                                             |
| Formulário, menu, animações, inclinação 3D do painel do topo | `js/main.js`                                                               |
| WhatsApp e destino do formulário                             | `js/config.js`                                                             |
| Logo                                                         | `img/logo-rotav3.png` (original, fundo transparente)                       |

## Imagens do topo e dos modelos

- O topo mostra a imagem do painel (`img/painel-rotav3.webp`), enviada em 18/10/2026. O notebook e o celular em 3D foram retirados a pedido, e com eles saíram `js/hero3d.js`, `js/screens.js` e `img/hero-devices.webp` (continuam no histórico do Git).
- A seção "Modelos de empresas parceiras" usa duas capturas de tela enviadas em 19/10/2026:
  - `img/modelo-viaverde.webp`: painel com a identidade da Via Verde Transportes, editado para não repetir os dados do painel do topo: 87 pedidos, 6 rotas, 7h18, data 16/10/2026, regiões da Grande São Paulo (São Paulo, Santo André, São Bernardo, Osasco, Mauá, São Caetano, Diadema), 14 alertas; usuário trocado de "Henrique Santos" para "Equipe Operacional"; os textos "dados em tempo real (Firebase)" e "última roteirização (OR-Tools)" viraram "pendentes para hoje" e "planejadas para hoje".
  - `img/modelo-2sl-log.webp`: painel escuro da 2SL Log, editado: 42 pedidos, 3 rotas, 4h12, regiões do Alto Tietê (Guarulhos, Suzano, Mogi das Cruzes, Arujá, Poá, Santa Isabel, Salesópolis, Guararema), 12 alertas, "aguardando roteirização" e "geradas hoje às 07:40". O mapa original mostrava o aviso "API KEY REQUIRED" do Google Maps; no lugar entrou um trecho escurecido de outro mapa (região de Guarulhos), sem os marcadores antigos, com pontos e linhas redesenhados.
  - O painel do topo (`img/painel-rotav3.webp`): 65 pedidos, 5 rotas, 02/10/2026. Em 19/10/2026 foram tirados o "↑ 12%" e o texto "dados em tempo real (Firebase)" do indicador de pedidos (agora "pedidos do dia"), para não mostrar um número de crescimento sem fonte.
- Se houver capturas novas, é só substituir os arquivos com os mesmos nomes. Os cartões mostram a imagem na proporção 16 : 15, a partir do topo (o corte é feito pelo CSS, `object-fit: cover`).

## Versão 3 — o que mudou e por quê (19/10/2026)

Baseada na pesquisa "como levar a landing page de boa a 100%" (conversão B2B, design, 3D e SEO):

- **Topo:** título pelo que o sistema faz ("Rotas que respeitam o peso de cada pedido e a capacidade de cada veículo."), botão principal "Agendar demonstração" (abre o formulário → WhatsApp), botão "Testar o planejador" e uma linha de expectativa ("Pelo WhatsApp, direto com quem desenvolve o sistema. Sem compromisso."). O painel aparece em perspectiva 3D com brilho atrás; no computador ele acompanha levemente o mouse. No celular fica reto.
- **Ordem:** o planejador interativo subiu para logo depois de "Como funciona", para o visitante testar antes de falar com alguém.
- **Seção escura:** virou "dores → solução" (montar rotas de cabeça/planilha, veículo com espaço sobrando, listas separadas) com o mapa 3D e uma calculadora que multiplica só os números do visitante (horas por dia × dias × custo da hora). Não é promessa de economia. O cartão de alertas mostra só alertas de planejamento (região isolada, capacidade, horário marcado, rota gerada).
- **Funcionalidades:** grade "bento" com recortes reais do painel do sistema.
- **Personalização:** título "Modelos com a identidade de cada empresa" e a nota "Telas ilustrativas, com dados demonstrativos", para não sugerir que essas empresas já são clientes. Para voltar ao título anterior, troque o `<h2 id="models-title">` no `index.html`.
- **Transparência:** o que o sistema faz hoje, o que fica fora do plano padrão (rastreamento como módulo opcional, relatórios prontos) e quem está por trás (CNPJ, atendimento direto, política de privacidade).
- **Preço:** sob consulta, com o que define o valor (veículos, volume de pedidos, personalização). Confirme se esses critérios são os que você usa.
- **FAQ:** novas perguntas de objeção (trocar de sistema, rastreamento, coletas, dados).
- **Visual:** dourado metálico (#f3d27a → #d4a93c → #b8862b) com texto escuro nos botões, títulos em Sora e texto em Inter. Contraste conferido pela fórmula do WCAG: todos os textos ≥ 4,5 : 1.

## Imagens nítidas (19/10/2026)

- **Painel do topo:** feito a partir da imagem original (1536 × 1024), ampliada 2× com super-resolução (modelo EDSR, rodado aqui no ambiente, com OpenCV) e com um leve realce. O "↑ 12%" e o "dados em tempo real (Firebase)" continuam fora. Arquivos:
  - `img/painel-rotav3.webp` (1536 px), para telas comuns;
  - `img/painel-rotav3-2x.webp` (2560 px), para telas de alta densidade e para a imagem ampliada;
  - `img/painel-mapa.webp`, o recorte do "Mapa de distribuição" mostrado no celular, onde o painel inteiro ficaria pequeno demais para ler.
- **Inclinação 3D mais leve:** −6° em vez de −9°, e o painel fica reto quando o mouse está em cima, para ser lido com nitidez. O brilho atrás deixou de usar filtro de desfoque, que pesa no celular.
- **Ampliar ao tocar:** o painel do topo, as telas das funcionalidades e os dois modelos abrem em tela cheia ao clicar ou tocar. No celular a imagem abre maior que a tela, para arrastar e ler os detalhes. O código está em `js/main.js` (trecho "Imagens que ampliam ao toque").
- **Telas das funcionalidades** (`img/ui-*.webp`): recortadas de novo da versão ampliada, agora com o dobro da resolução de antes.
- **Modelo 2SL Log:** ampliado 2× (`img/modelo-2sl-log-2x.webp`). A foto do caminhão foi retirada na versão 4. É usada automaticamente em telas de alta densidade.
- **Mapas:**
  - o planejador ocupa agora a largura toda da página, com o mapa em 480 px de altura no computador;
  - os mapas de "Pedidos no mapa" passaram para 420 px;
  - o mapa de reserva (OpenStreetMap) pede blocos de alta resolução em telas de alta densidade;
  - o mapa 3D renderiza até 2× a densidade da tela.
- A super-resolução deixa as bordas e o texto mais limpos, mas não inventa detalhe que não existe na imagem original. Para ficar perfeito, o ideal é uma captura de tela nova do sistema, feita numa tela grande, com zoom de 150–200% no navegador.

## Rastreamento — módulo opcional, com orçamento separado (19/10/2026)

O sistema ainda não rastreia veículos. A página oferece o rastreamento como **módulo opcional, contratado à parte e com orçamento separado**, sem apresentá-lo como algo que já vem no plano padrão:

- **Planejador:** um veículo percorre a ordem das paradas no mapa, para em cada uma e volta ao centro de distribuição. Um cartão mostra "Fiorino · em rota", a próxima parada e a etiqueta "Simulação do módulo opcional". O botão "Rastreamento (opcional)" liga e desliga. A animação pausa fora da tela e, com "reduzir movimento", o veículo fica parado a caminho da 3ª parada. Nenhuma localização real é usada; o veículo anda em linha reta entre as paradas. O código fica em `js/planmap.js` (trecho "rastreamento (SIMULAÇÃO do módulo opcional)").
- **Preço:** bloco "Rastreamento no mapa — Módulo opcional · orçamento separado", com o botão "Pedir orçamento do rastreamento". Esse botão abre o formulário, e a mensagem do WhatsApp termina com "Também quero um orçamento do módulo de rastreamento." (campo `interesse` = `rastreamento`).
- **Transparência:** o cartão "Fora do plano padrão" lista o rastreamento como módulo opcional com orçamento separado, e os relatórios prontos como em construção.
- **FAQ:** "Dá para rastrear os veículos no mapa?" — sim, com o módulo opcional. A forma de enviar a localização (celular do motorista ou rastreador já instalado) é combinada no orçamento.

## Painel de planejamento

- O mapa do painel também é um mapa de ruas, no lugar do mapa ilustrativo desenhado em código.
- As paradas aparecem numeradas na ordem da rota, e a linha pontilhada liga as paradas nessa ordem (saindo e voltando ao centro de distribuição). Ela **não** é o trajeto pelas ruas — o site não tem serviço de rotas. Os pontos da outra aba aparecem pequenos e apagados, só para dar contexto.
- Clicar em um pedido da lista abre o balão no mapa; clicar no número no mapa marca o pedido na lista.
- Distância e tempo do resumo são demonstrativos: soma das distâncias em linha reta × 1,3 e 30 km/h de média + 8 min por parada.

## Visual dos mapas de ruas

- Os três mapas (painel e "Pedidos no mapa") usam o estilo claro "Liberty" do OpenFreeMap, desenhado com MapLibre GL dentro do Leaflet, com ajustes para lembrar os aplicativos de mapa: fundo cinza-claro, ruas brancas, rodovias azul-acinzentadas, água azul, sem ícones de comércio e sem prédios em 3D (`STYLE_TWEAKS` em `js/leafletmap.js`).
- O OpenFreeMap é gratuito, não usa chave, permite uso comercial e não tem limite de acessos; o crédito (OpenFreeMap, OpenMapTiles, OpenStreetMap) aparece no canto do mapa.
- Sem WebGL, ou se o estilo não carregar em 8 segundos, o mapa troca sozinho para o mapa comum do OpenStreetMap, com cores suavizadas.
- Não é o Google Maps nem o Waze: o Google exige chave de API com cobrança, e o Waze não libera o mapa para sites. Se um dia quiser o mapa do Google, dá para trocar com uma chave restrita ao domínio do site.
- Os pedidos de demonstração ficam concentrados em Guarulhos, perto do centro de distribuição, com alguns mais longe (Arujá, Itaquaquecetuba, Tatuapé e Penha).

## Mapas de ruas (seção "Pedidos no mapa")

- Dois mapas com ruas de verdade, feitos com Leaflet 1.9.4 e MapLibre GL 4.7.1 (arquivos em `vendor/`, carregados só quando a seção se aproxima da tela).
- Mapa 1, "Todos os pedidos": uma bolinha verde por pedido. Mapa 2, "Coletas e entregas": entrega em azul com seta para baixo, coleta em dourado com seta para cima, e os botões Todas / Entregas / Coletas. Os dois mostram o centro de distribuição (quadrado azul-marinho). Tocar em um ponto abre o pedido.
- Os pedidos são fictícios e ficam no centro aproximado do bairro citado (`lat`/`lng` em `js/data.js`). Não são endereços de clientes.
- As cores de entrega (azul) e coleta (dourado) são as mesmas do painel de planejamento.
- O mapa de ruas vem do OpenStreetMap (gratuito, sem chave). As regras deles pedem o crédito visível no mapa (já está) e não garantem disponibilidade; se o site tiver muito acesso, troque por um provedor pago em `mapTiles`, no `js/config.js`. Se o mapa de ruas não carregar, os pontos continuam e aparece um aviso.
- No celular, um dedo rola a página e dois dedos dão zoom (os botões + e − também funcionam). No computador, a roda do mouse só dá zoom depois de clicar no mapa.
- Não há linha de rota nesses mapas: desenhar o caminho pelas ruas exige um serviço de rotas, que o site não tem.

## Como o 3D funciona

- Prédios, rotas, veículos e marcadores do mapa da seção escura são modelados em código com three.js. Nenhum modelo 3D foi baixado de terceiros.
- O 3D só roda quando aparece na tela, pausa quando a aba fica oculta e respeita a opção do sistema "reduzir movimento" (fica parado).
- Sem WebGL, a página mostra a imagem estática `img/city-3d.webp`, gerada a partir da própria cena.

## O que foi testado (Chromium sem interface, WebGL por software)

- Painel: abas Entregas/Coletas, paradas numeradas 1–8 e 1–6 na mesma ordem da lista, lista → balão e marcador → lista, zoom e botão de centralizar, troca de aba pelo teclado.
- No celular, o cartão "Alertas do dia" fica abaixo do mapa 3D, sem cobrir a cena.
- Resumo da rota e capacidade usada recalculados a partir dos pedidos (455 kg = 70% e 312 kg = 48% de 650 kg).
- Formulário (versão 3): 3 campos, 3 avisos com tudo vazio, nada abre; preenchido, abre o WhatsApp com "Olá! Sou …, da …. Temos … veículos. Quero ver o ROTAV3 com os nossos pedidos." (conferido o texto), em 1440 e 390 px. Com `formEndpoint` simulado: e-mail e WhatsApp aparecem, 5 avisos com tudo vazio, POST conferido. A abertura no app do WhatsApp em um celular real não foi testada.
- Calculadora (aceita vírgula, campo vazio vira zero), inclinação 3D só no computador, ordem das seções, menu apontando para seções existentes, imagem do topo com prioridade alta e sem carregamento tardio, política de privacidade no celular, sem rolagem lateral em 360, 390, 768, 1024 e 1440 px, sem erros no console.
- Menu do celular, item ativo do menu, FAQ, tecla Esc no formulário.
- Sem rolagem lateral em 360, 390, 768, 1024, 1280 e 1920 px.
- Movimento reduzido e navegador sem WebGL (imagens estáticas aparecem), sem erros no console.

- Mapas de ruas: 14 bolinhas verdes, 8 entregas e 6 coletas, contadores, balão do pedido, filtros, marcadores com nome para leitor de tela e foco pelo teclado, cabeçalho por cima dos controles, aviso quando o mapa de ruas falha, em 1440 e 390 px. Nos testes o mapa de ruas foi trocado por uma imagem local (o ambiente não acessa o OpenStreetMap).

## O que não foi testado

- Celulares e placas de vídeo reais, Safari e Firefox. O desempenho do 3D em aparelhos fracos não foi medido.
- Envio para um destino real (só simulado).
- O visual final dos mapas com as ruas reais (OpenFreeMap e OpenStreetMap são bloqueados no ambiente de teste). Testado: o mapa vetorial carrega, os ajustes de cor são aplicados (com um estilo de teste) e a troca para o mapa de reserva funciona. Confira no site publicado.
- As fontes Inter e Sora carregando do Google Fonts (bloqueado no ambiente de teste; usadas cópias instaladas localmente).

## Diferenças em relação à imagem de referência

Os textos foram ajustados ao que o sistema já faz:

- "Mapas em tempo real" virou "Pedidos no mapa"; "EM TEMPO REAL" virou "Painel operacional". O sistema não rastreia veículos em tempo real.
- "Relatórios e histórico" virou "Pedidos a partir de notas fiscais". A página de relatórios do sistema ainda está em construção.
- "Cases" no menu virou "Para quem é". Não há estudos de caso publicados.
- "Menos custos. Mais resultados." virou "Menos retrabalho. Mais controle.", para não prometer resultado sem número que o comprove.
- "Ver todas as funcionalidades" abre o pedido de demonstração, porque não existe página separada de funcionalidades.
- "Termos de uso" segue fora do rodapé até existir o texto. A política de privacidade foi criada em 19/10/2026.
- Foi acrescentada a seção de Perguntas (o menu "Perguntas" precisava de destino) e o formulário de demonstração.

Na seção de personalização, os modelos levam os nomes Via Verde Transportes e 2SL Log. Desde a versão 3 o título não fala mais em "empresas parceiras" e há a nota "Telas ilustrativas". Se alguma delas for cliente de fato, dá para voltar a dizer isso.

Imagens:

- No topo, a imagem do painel é a enviada pelo Henrique (dados demonstrativos). A estrada ao fundo é desenhada em CSS.
- A foto do caminhão em "Para quem é" é ilustrativa (gerada para o projeto do Lovable) e recebeu um filtro de entardecer.
- A logo (`img/logo-rotav3.png`) e os ícones (`favicon.png`, `apple-touch-icon.png`) vêm da logo original enviada em 18/10/2026; o fundo azul foi retirado para a logo ficar transparente.

A página ficou mais alta que a imagem porque os textos foram mantidos em tamanho legível.

## Licenças

- MapLibre GL JS 4.7.1 — BSD 3-Clause (`vendor/maplibre/LICENSE.txt`); @maplibre/maplibre-gl-leaflet 0.1.4 — ISC (`vendor/maplibre-gl-leaflet/LICENSE.txt`), adaptado para carregar sem build. Mapa: OpenFreeMap, © OpenMapTiles, © colaboradores do OpenStreetMap.
- Leaflet 1.9.4 — BSD 2-Clause (`vendor/leaflet/LICENSE.txt`). Dados do mapa © colaboradores do OpenStreetMap (ODbL), com crédito no canto de cada mapa.
- three.js r169, incluindo `RoomEnvironment` e `RoundedBoxGeometry` dos exemplos — MIT (`vendor/LICENSE-three.txt`).
- Fontes Inter e Sora, via Google Fonts — SIL Open Font License 1.1.
- Ícones e modelos 3D — feitos para este projeto.


## Versão 4 (20/10/2026) — visual escuro premium
- Página inteira em preto-azulado, com cartões de vidro e dourado só nos botões e destaques (referências de design lidas com o Firecrawl: Linear e Onfleet).
- Telas do sistema, mapas e janelas continuam claros, como uma tela real em destaque.
- A foto do caminhão saiu. No lugar há uma ilustração em SVG de uma rota (centro de distribuição, entregas e coletas), feita no próprio código.
- Planejador: paradas em formato de alfinete numerado, linha da rota com contorno branco e brilho correndo no sentido da rota (desliga com "reduzir movimento"). Centro de distribuição em dourado.
- Ajustes de tema ficam no fim de `css/style.css` (bloco "VERSÃO 4").

## Versão 4.1 (20/10/2026) — cores vivas e animações
Inspirada em elevatelp.com.br (estrutura lida com o Firecrawl): brilhos coloridos que se movem devagar no topo, notificações do planejamento (dados demonstrativos) aparecendo sobre o painel, faixa que corre com o que o sistema faz, dourado do título brilhando, botão dourado com reflexo, luz que segue o mouse nos cartões e entradas com desfoque. Tudo desliga com "reduzir movimento". Bloco "VERSÃO 4.1" no fim de `css/style.css`.

## Versão 4.2 (21/10/2026) — telas e mapa desenhados em código
- As imagens recortadas da captura antiga (painel do topo, mapa, próximas paradas, veículos, pedidos por região) saíram. Eram borradas e tinham dados que não batiam com o resto da página.
- No lugar: telas em HTML e um mapa em SVG (`img/mapa-rotas.svg`), nítidos em qualquer tela, com os mesmos pedidos demonstrativos de `js/data.js`: entregas em azul (8 paradas, 455 kg, Fiorino 1) e coletas em laranja (6 paradas, 312 kg, Fiorino 2), saindo do centro de distribuição em Guarulhos.
- O mapa usa as coordenadas reais dos bairros e mostra Via Dutra (BR-116), Ayrton Senna (SP-070), Fernão Dias (BR-381), Rio Tietê, Aeroporto de Guarulhos e as cidades. É um mapa ilustrativo, com o aviso "dados demonstrativos".
- Os scripts que geram o mapa e as telas ficaram fora do site (gerados uma vez). Para mudar os pedidos, altere `js/data.js` e peça para regenerar.
- A cor das coletas passou para #e08a00 (laranja mais vivo) no site inteiro.

## Versão 4.3 (21/10/2026) — Dashboard recriado em alta resolução
- O topo mostra o Dashboard do ROTAV3 recriado no layout do sistema (barra lateral, indicadores, mapa de distribuição, pedidos por região, próximas paradas, assistente, agendados e alertas), exportado a 2× (`img/dashboard-rotav3.webp`, `-2x.webp`; no celular `img/dashboard-mapa.webp`).
- Ícones: Lucide (licença ISC). Emojis 3D: Microsoft Fluent Emoji (licença MIT). Fonte: Inter.
- Números coerentes com o planejador: 14 pedidos (8 entregas, 6 coletas), 2 rotas, 155 km, 7h05, 767 kg em 2 Fiorinos.
- Nomes de fornecedores que apareciam na tela (Gemini, Firebase, QR-Tools) foram trocados por termos genéricos ("Assistente IA").
