# Mapa 3D e fundo de mapa da página de vendas

Ferramentas usadas para gerar as imagens do mapa (não fazem parte do site em funcionamento).

- `preparar_regiao.py` — junta os limites dos 39 municípios da Grande São Paulo (IBGE, via
  [tbrugz/geodata-br](https://github.com/tbrugz/geodata-br)), rodovias e rios do
  [Natural Earth](https://www.naturalearthdata.com/) (domínio público) e sorteia os 86 pedidos
  **fictícios** com semente fixa. Gera `regiao.json` (ajuste os caminhos no topo do arquivo).
- `cena.html` — monta a maquete em three.js r169 e devolve, em `window.__labels`, a posição na tela
  de cada pedido, do CD e das cidades. Parâmetros: `?view=desk|mob&w=2400&h=1400&extra=4.2`.
  A imagem foi capturada com o Playwright (Chromium com SwiftShader), recortada e salva como
  `img/mapa-3d-*.webp`; as posições foram gravadas em `js/dados-regiao.js`.
- `gerar_mapa_guarulhos.py` — gera `img/mapa-guarulhos.svg`, o fundo ilustrativo usado no filme do
  topo, no "dia de operação" e no painel "ao vivo".
