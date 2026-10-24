# Gera img/mapa-guarulhos.svg: fundo de mapa ilustrativo usado no filme do topo e no painel
# "ao vivo". Limites dos municípios: IBGE (tbrugz/geodata-br). Rodovias e rio: Natural Earth
# (domínio público). As quadras são só textura (não representam ruas reais).
import json, math, sys

MUN = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/dados/geodata-br/geojson/geojs-35-mun.json'
NE = sys.argv[2] if len(sys.argv) > 2 else '/home/claude/dados/ne/nev/geojson'
OUT = sys.argv[3] if len(sys.argv) > 3 else 'img/mapa-guarulhos.svg'

# Recorte e projeção (iguais aos de js/mapa-filme.js)
LON0, LON1, LAT0, LAT1 = -46.60, -46.37, -23.53, -23.39
W = 1520
KX = math.cos(math.radians((LAT0 + LAT1) / 2)) * 111.32
S = W / ((LON1 - LON0) * KX)
H = round((LAT1 - LAT0) * 110.57 * S)


def P(lon, lat):
    return ((lon - LON0) * KX * S, (LAT1 - lat) * 110.57 * S)


def path(pts, close=False):
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts)
    return d + (' Z' if close else '')


mun = json.load(open(MUN))
NOMES = {'Guarulhos': 'GUARULHOS', 'São Paulo': 'SÃO PAULO', 'Arujá': 'ARUJÁ', 'Itaquaquecetuba': 'ITAQUAQUECETUBA',
         'Mairiporã': 'MAIRIPORÃ', 'Poá': 'POÁ', 'Ferraz de Vasconcelos': 'FERRAZ'}
areas, bordas = [], []
for f in mun['features']:
    nome = f['properties']['name']
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    hit = False
    for p in polys:
        ring = p[0]
        if any(LON0 - 0.05 <= x <= LON1 + 0.05 and LAT0 - 0.05 <= y <= LAT1 + 0.05 for x, y in ring):
            hit = True
            pts = [P(x, y) for x, y in ring]
            areas.append((nome, path(pts, True)))
    if hit:
        bordas.append(nome)


def linhas(arq):
    d = json.load(open(f'{NE}/{arq}'))
    out = []
    for f in d['features']:
        g = f['geometry']
        if not g:
            continue
        ls = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for l in ls:
            if any(LON0 - 0.1 <= x <= LON1 + 0.1 and LAT0 - 0.1 <= y <= LAT1 + 0.1 for x, y in l):
                out.append(path([P(x, y) for x, y in l]))
    return out


rod = linhas('ne_10m_roads.geojson')
rio = linhas('ne_10m_rivers_lake_centerlines.geojson')

svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
       '<defs>',
       '<pattern id="q" width="52" height="38" patternUnits="userSpaceOnUse" patternTransform="rotate(-17)"><path d="M0 0H52M0 0V38" stroke="#f7f9fb" stroke-width="2.6"/></pattern>',
       '<pattern id="q2" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(23)"><path d="M0 0H44M0 0V44" stroke="#f7f9fb" stroke-width="2.4"/></pattern>',
       '<pattern id="q3" width="58" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(8)"><path d="M0 0H58M0 0V30" stroke="#f7f9fb" stroke-width="2.4"/></pattern>',
       '</defs>',
       f'<rect width="{W}" height="{H}" fill="#eceff3"/>']
PAD = {'Guarulhos': 'q', 'São Paulo': 'q2', 'Itaquaquecetuba': 'q3', 'Poá': 'q3', 'Ferraz de Vasconcelos': 'q2', 'Arujá': 'q2', 'Suzano': 'q', 'Mairiporã': 'q3'}
for nome, d in areas:
    svg.append(f'<path d="{d}" fill="url(#{PAD.get(nome, "q")})"/>')
for nome, d in areas:
    svg.append(f'<path d="{d}" fill="none" stroke="#b4bfcf" stroke-width="2.4" stroke-dasharray="12 8" stroke-linejoin="round"/>')
for d in rio:
    svg.append(f'<path d="{d}" fill="none" stroke="#b6d4f3" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>')
for d in rod:
    svg.append(f'<path d="{d}" fill="none" stroke="#d5dbe4" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>')
for d in rod:
    svg.append(f'<path d="{d}" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
ROT = [('GUARULHOS', -46.505, -23.405), ('SÃO PAULO', -46.585, -23.512), ('ITAQUAQUECETUBA', -46.395, -23.505), ('ARUJÁ', -46.38, -23.397)]
for t, lon, lat in ROT:
    x, y = P(lon, lat)
    svg.append(f'<text x="{x:.0f}" y="{y:.0f}" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="600" letter-spacing="6" fill="#9aa6b8" text-anchor="middle">{t}</text>')
svg.append('</svg>')
open(OUT, 'w').write('\n'.join(svg))
print(OUT, W, H, 'S=', S, 'municipios', bordas)
