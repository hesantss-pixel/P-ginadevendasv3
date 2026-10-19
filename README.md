# ROTAV3 Systems — landing page (site estático)

Página de vendas do ROTAV3 Systems no layout da referência de outubro/2026: imagem do painel no topo, modelos de empresas, painel interativo de planejamento, dois mapas de ruas com os pedidos (todos os pedidos / coletas e entregas), funcionalidades, mapa 3D com rotas animadas, "Para quem é", perguntas frequentes, chamada final e formulário de demonstração.

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

## Ligar o WhatsApp e o envio do formulário

Tudo fica em `js/config.js`:

- `whatsappNumber`: número com DDI e DDD, só dígitos (ex.: `"5511912345678"`). Enquanto estiver vazio, o botão "Falar no WhatsApp" não aparece.
- `formEndpoint`: endereço que recebe os pedidos de demonstração. Enquanto estiver vazio, o formulário só valida os campos e avisa que está em modo de demonstração (nada é enviado).

O formulário envia um POST comum (`application/x-www-form-urlencoded`) com os campos `nome`, `empresa`, `email`, `telefone`, `frota`, `operacao`, `mensagem`, `origem` e `enviadoEm`. O destino precisa responder com status 2xx.

Exemplo com **n8n**: crie um nó _Webhook_ (método POST), copie a _Production URL_ para `formEndpoint`, ative o workflow e, nas opções do Webhook, libere o domínio do site em _Allowed Origins (CORS)_. Depois ligue o nó seguinte (planilha, e-mail, CRM). Também funciona com Formspree, Make ou Google Apps Script.

Antes de ativar o envio real, publique uma política de privacidade (LGPD) e coloque o link no rodapé.

## Imagem de compartilhamento

Quando o endereço definitivo existir, acrescente no `<head>` do `index.html`:

```html
<meta property="og:image" content="https://SEU-ENDERECO/img/og-rotav3.jpg" />
```

A imagem precisa de endereço completo; por isso ela não está ligada ainda.

## Onde alterar cada coisa

| O quê                                                        | Arquivo                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Textos das seções, menu, FAQ, rodapé                         | `index.html`                                                               |
| Cores, tamanhos, espaçamentos, celular                       | `css/style.css` (variáveis no começo do arquivo)                           |
| Pedidos, pesos e rotas do painel interativo (demonstrativos) | `js/data.js`                                                               |
| Imagem do painel no topo                                     | `img/painel-rotav3.webp`                                                   |
| Modelos de empresas (seção "Personalização")                 | `index.html` + `img/modelo-*.webp`                                         |
| Mapa do painel de planejamento (paradas numeradas)           | `js/planmap.js`                                                            |
| Mapas de ruas (pedidos, coletas e entregas)                  | `js/ordersmap.js` (pontos em `js/data.js`, mapa de ruas em `js/config.js`) |
| Mapa 3D da seção escura                                      | `js/city3d.js`                                                             |
| Formulário, menu, animações                                  | `js/main.js`                                                               |
| WhatsApp e destino do formulário                             | `js/config.js`                                                             |
| Logo                                                         | `img/logo-rotav3.png` (original, fundo transparente)                       |

## Imagens do topo e dos modelos

- O topo mostra a imagem do painel (`img/painel-rotav3.webp`), enviada em 18/10/2026. O notebook e o celular em 3D foram retirados a pedido, e com eles saíram `js/hero3d.js`, `js/screens.js` e `img/hero-devices.webp` (continuam no histórico do Git).
- A seção "Modelos de empresas parceiras" usa duas capturas de tela enviadas em 19/10/2026:
  - `img/modelo-viaverde.webp`: painel com a identidade da Via Verde Transportes, sem edição.
  - `img/modelo-2sl-log.webp`: painel escuro da 2SL Log, editado para não repetir os números do outro modelo (42 pedidos, 3 rotas, 4h12, pedidos por região, 12 alertas). O mapa original mostrava o aviso "API KEY REQUIRED" do Google Maps; no lugar dele entrou uma versão escura do mapa da outra captura, com os pontos redesenhados.
- Se houver capturas novas, é só substituir os arquivos com os mesmos nomes. Os cartões mostram a imagem na proporção 16 : 15, a partir do topo (o corte é feito pelo CSS, `object-fit: cover`).

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
- Formulário: 4 erros com campos vazios, máscara do WhatsApp, modo de demonstração e envio real para um destino **simulado** (conferido o conteúdo recebido).
- WhatsApp escondido sem número e com link correto quando configurado.
- Menu do celular, item ativo do menu, FAQ, tecla Esc no formulário.
- Sem rolagem lateral em 360, 390, 768, 1024, 1280 e 1920 px.
- Movimento reduzido e navegador sem WebGL (imagens estáticas aparecem), sem erros no console.

- Mapas de ruas: 14 bolinhas verdes, 8 entregas e 6 coletas, contadores, balão do pedido, filtros, marcadores com nome para leitor de tela e foco pelo teclado, cabeçalho por cima dos controles, aviso quando o mapa de ruas falha, em 1440 e 390 px. Nos testes o mapa de ruas foi trocado por uma imagem local (o ambiente não acessa o OpenStreetMap).

## O que não foi testado

- Celulares e placas de vídeo reais, Safari e Firefox. O desempenho do 3D em aparelhos fracos não foi medido.
- Envio para um destino real (só simulado).
- O visual final dos mapas com as ruas reais (OpenFreeMap e OpenStreetMap são bloqueados no ambiente de teste). Testado: o mapa vetorial carrega, os ajustes de cor são aplicados (com um estilo de teste) e a troca para o mapa de reserva funciona. Confira no site publicado.
- A fonte Inter carregando do Google Fonts (bloqueado no ambiente de teste; usada a Inter instalada localmente).

## Diferenças em relação à imagem de referência

Os textos foram ajustados ao que o sistema já faz:

- "Mapas em tempo real" virou "Pedidos no mapa"; "EM TEMPO REAL" virou "Painel operacional". O sistema não rastreia veículos em tempo real.
- "Relatórios e histórico" virou "Pedidos a partir de notas fiscais". A página de relatórios do sistema ainda está em construção.
- "Cases" no menu virou "Para quem é". Não há estudos de caso publicados.
- "Menos custos. Mais resultados." virou "Menos retrabalho. Mais controle.", para não prometer resultado sem número que o comprove.
- "Ver todas as funcionalidades" abre o pedido de demonstração, porque não existe página separada de funcionalidades.
- "Termos de uso" e "Política de privacidade" ficaram fora do rodapé até existirem os textos.
- Foi acrescentada a seção de Perguntas (o menu "Perguntas" precisava de destino) e o formulário de demonstração.

Ponto em aberto na seção "Modelos de empresas parceiras": o título fala em empresas parceiras e um dos modelos leva o nome ViaVerde. Confirme essa palavra e esse nome antes de divulgar a página, porque a imagem é um modelo com o nome aplicado, não um sistema que a ViaVerde já usa. "Exemplos de personalização" é uma alternativa que não afirma parceria.

Imagens:

- No topo, a imagem do painel é a enviada pelo Henrique (dados demonstrativos). A estrada ao fundo é desenhada em CSS.
- A foto do caminhão em "Para quem é" é ilustrativa (gerada para o projeto do Lovable) e recebeu um filtro de entardecer.
- A logo (`img/logo-rotav3.png`) e os ícones (`favicon.png`, `apple-touch-icon.png`) vêm da logo original enviada em 18/10/2026; o fundo azul foi retirado para a logo ficar transparente.

A página ficou mais alta que a imagem porque os textos foram mantidos em tamanho legível.

## Licenças

- MapLibre GL JS 4.7.1 — BSD 3-Clause (`vendor/maplibre/LICENSE.txt`); @maplibre/maplibre-gl-leaflet 0.1.4 — ISC (`vendor/maplibre-gl-leaflet/LICENSE.txt`), adaptado para carregar sem build. Mapa: OpenFreeMap, © OpenMapTiles, © colaboradores do OpenStreetMap.
- Leaflet 1.9.4 — BSD 2-Clause (`vendor/leaflet/LICENSE.txt`). Dados do mapa © colaboradores do OpenStreetMap (ODbL), com crédito no canto de cada mapa.
- three.js r169, incluindo `RoomEnvironment` e `RoundedBoxGeometry` dos exemplos — MIT (`vendor/LICENSE-three.txt`).
- Fonte Inter, via Google Fonts — SIL Open Font License 1.1.
- Ícones e modelos 3D — feitos para este projeto.
