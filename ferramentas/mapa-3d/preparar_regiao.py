# Prepara os dados do mapa 3D da Grande São Paulo (página de vendas v6).
# Limites dos municípios: IBGE (via tbrugz/geodata-br). Rodovias e rio: Natural Earth (domínio público).
# Pedidos: FICTÍCIOS, sorteados com semente fixa dentro dos municípios (sem endereço).
import json, math, random

MUN = '/home/claude/dados/geodata-br/geojson/geojs-35-mun.json'
ROADS = '/home/claude/dados/ne/nev/geojson/ne_10m_roads.geojson'
RIVERS = '/home/claude/dados/ne/nev/geojson/ne_10m_rivers_lake_centerlines.geojson'
OUT = '/tmp/claude-0/-home-claude/952578dd-34f4-5ff0-bd40-f7a402f57ffb/scratchpad/cena/regiao.json'

RMSP = {
    'São Paulo': 'São Paulo', 'Guarulhos': 'Guarulhos', 'Arujá': 'Arujá', 'Itaquaquecetuba': 'Itaquaquecetuba',
    'Mogi das Cruzes': 'Mogi das Cruzes', 'Suzano': 'Suzano', 'Poá': 'Poá', 'Ferraz de Vasconcelos': 'Ferraz de Vasconcelos',
    'Mairiporã': 'Mairiporã', 'Caieiras': 'Caieiras', 'Franco da Rocha': 'Franco da Rocha', 'Francisco Morato': 'Francisco Morato',
    'Cajamar': 'Cajamar', 'Santana de Parnaíba': 'Santana de Parnaíba', 'Barueri': 'Barueri', 'Carapicuíba': 'Carapicuíba',
    'Osasco': 'Osasco', 'Cotia': 'Cotia', 'Itapevi': 'Itapevi', 'Jandira': 'Jandira', 'Embu': 'Embu das Artes',
    'Taboão da Serra': 'Taboão da Serra', 'Itapecerica da Serra': 'Itapecerica da Serra', 'Embu-Guaçu': 'Embu-Guaçu',
    'São Lourenço da Serra': 'São Lourenço da Serra', 'Juquitiba': 'Juquitiba', 'Vargem Grande Paulista': 'Vargem Grande Paulista',
    'Pirapora do Bom Jesus': 'Pirapora do Bom Jesus', 'Santo André': 'Santo André', 'São Bernardo do Campo': 'São Bernardo do Campo',
    'São Caetano do Sul': 'São Caetano do Sul', 'Diadema': 'Diadema', 'Mauá': 'Mauá', 'Ribeirão Pires': 'Ribeirão Pires',
    'Rio Grande da Serra': 'Rio Grande da Serra', 'Santa Isabel': 'Santa Isabel', 'Guararema': 'Guararema',
    'Biritiba-Mirim': 'Biritiba-Mirim', 'Salesópolis': 'Salesópolis',
}

LAT0, LON0 = -23.58, -46.55
KX = math.cos(math.radians(LAT0)) * 111.32
KY = 110.57


def proj(lon, lat):
    return [round((lon - LON0) * KX, 3), round((lat - LAT0) * KY, 3)]


def inside(pt, ring):
    x, y = pt
    c = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            c = not c
        j = i
    return c


def simplify(ring, tol):
    # Douglas-Peucker simples
    if len(ring) < 4:
        return ring
    def rdp(pts):
        if len(pts) < 3:
            return pts
        (x1, y1), (x2, y2) = pts[0], pts[-1]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1e-9
        dmax, idx = 0, 0
        for i in range(1, len(pts) - 1):
            x0, y0 = pts[i]
            d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / L
            if d > dmax:
                dmax, idx = d, i
        if dmax > tol:
            a = rdp(pts[: idx + 1])
            b = rdp(pts[idx:])
            return a[:-1] + b
        return [pts[0], pts[-1]]
    out = rdp(ring)
    return out if len(out) >= 4 else ring


mun = json.load(open(MUN))
feats = [f for f in mun['features'] if f['properties']['name'] in RMSP]
assert len(feats) == 39, len(feats)

municipios = []
for f in feats:
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    rings = []
    for p in polys:
        outer = [proj(x, y) for x, y in p[0]]
        rings.append(simplify(outer, 0.06))
    # centróide aproximado (média ponderada pela área do maior anel)
    big = max(rings, key=lambda r: abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))))
    A = cx = cy = 0
    for i in range(len(big)):
        x0, y0 = big[i - 1]
        x1, y1 = big[i]
        cr = x0 * y1 - x1 * y0
        A += cr
        cx += (x0 + x1) * cr
        cy += (y0 + y1) * cr
    A *= 0.5
    municipios.append({'name': RMSP[f['properties']['name']], 'id': f['properties']['id'], 'rings': rings,
                       'c': [round(cx / (6 * A), 2), round(cy / (6 * A), 2)]})

all_rings = [r for m in municipios for r in m['rings']]


def in_region(pt):
    return any(inside(pt, r) for r in all_rings)


def clip_lines(geojson_path):
    d = json.load(open(geojson_path))
    bb = (-47.3, -24.1, -45.6, -23.1)
    out = []
    for f in d['features']:
        g = f['geometry']
        if not g:
            continue
        lines = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for l in lines:
            if not any(bb[0] <= x <= bb[2] and bb[1] <= y <= bb[3] for x, y in l):
                continue
            pts = [proj(x, y) for x, y in l]
            # densifica para cortar no limite com precisão
            dense = []
            for i in range(len(pts) - 1):
                a, b = pts[i], pts[i + 1]
                n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 0.4))
                for k in range(n):
                    t = k / n
                    dense.append([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
            dense.append(pts[-1])
            cur = []
            for p in dense:
                if in_region(p):
                    cur.append([round(p[0], 2), round(p[1], 2)])
                else:
                    if len(cur) > 1:
                        out.append(cur)
                    cur = []
            if len(cur) > 1:
                out.append(cur)
    # simplifica
    return [simplify(l, 0.05) if len(l) > 3 else l for l in out]


roads = clip_lines(ROADS)
rivers = clip_lines(RIVERS)

# ---------- pedidos fictícios ----------
rng = random.Random(20261024)
CENTROS = {
    # cidade: (lat, lng, raio km, entregas, coletas)
    'Guarulhos': (-23.455, -46.50, 5.5, 18, 6),
    'São Paulo': (-23.545, -46.60, 8.5, 15, 4),
    'Arujá': (-23.3965, -46.321, 2.2, 3, 1),
    'Itaquaquecetuba': (-23.486, -46.348, 2.2, 4, 1),
    'Mogi das Cruzes': (-23.522, -46.188, 3.0, 3, 2),
    'Suzano': (-23.542, -46.311, 2.5, 3, 1),
    'Poá': (-23.528, -46.345, 1.0, 1, 0),
    'Ferraz de Vasconcelos': (-23.541, -46.371, 1.2, 2, 0),
    'Santo André': (-23.663, -46.538, 2.6, 3, 1),
    'São Bernardo do Campo': (-23.694, -46.565, 3.0, 2, 1),
    'São Caetano do Sul': (-23.622, -46.551, 1.0, 1, 0),
    'Diadema': (-23.686, -46.62, 1.3, 1, 1),
    'Mauá': (-23.668, -46.461, 1.8, 2, 0),
    'Osasco': (-23.532, -46.792, 2.2, 2, 1),
    'Barueri': (-23.511, -46.876, 2.0, 1, 1),
    'Mairiporã': (-23.319, -46.587, 2.0, 1, 0),
    'Santa Isabel': (-23.315, -46.223, 1.6, 1, 0),
    'Cotia': (-23.604, -46.919, 2.5, 1, 0),
    'Taboão da Serra': (-23.626, -46.791, 1.2, 1, 0),
    'Caieiras': (-23.364, -46.74, 1.6, 1, 0),
}
mun_by = {m['name']: m for m in municipios}
# área do aeroporto de Guarulhos (evita pinos sobre a pista)
GRU = (-23.447, -46.508, -23.415, -46.440)


def sortear(cidade):
    lat0, lng0, r, *_ = CENTROS[cidade]
    m = mun_by[cidade]
    for _ in range(4000):
        dk = rng.gauss(0, r / 1.6)
        ang = rng.random() * math.tau
        lat = lat0 + (dk * math.sin(ang)) / 110.57
        lng = lng0 + (dk * math.cos(ang)) / (math.cos(math.radians(lat0)) * 111.32)
        if GRU[0] <= lat <= GRU[2] and GRU[1] <= lng <= GRU[3]:
            continue
        p = proj(lng, lat)
        if any(inside(p, rr) for rr in m['rings']):
            return round(lat, 5), round(lng, 5), p
    raise RuntimeError(cidade)


pedidos = []
nf_e, nf_c = 30410, 88003
for cidade, (_, _, _, ne, nc) in CENTROS.items():
    for k in range(ne + nc):
        tipo = 'coleta' if k >= ne else 'entrega'
        lat, lng, p = sortear(cidade)
        if tipo == 'entrega':
            nf_e += rng.randint(3, 17)
            nf = str(nf_e)
            peso = 40 + rng.randint(0, 420)
        else:
            nf_c += rng.randint(2, 9)
            nf = str(nf_c)
            peso = 80 + rng.randint(0, 620)
        pedidos.append({'nf': nf, 'tipo': tipo, 'cidade': cidade, 'lat': lat, 'lng': lng, 'x': p[0], 'y': p[1], 'peso': peso})

# alguns agendados (janela de horário) e urgentes, fixos pela semente
for p in rng.sample(pedidos, 7):
    ini = rng.choice([8, 9, 10, 13, 14])
    p['janela'] = [ini * 60, (ini + 2) * 60]
for p in rng.sample([q for q in pedidos if q['tipo'] == 'entrega'], 4):
    p['urgente'] = True

CD = {'lat': -23.456, 'lng': -46.488}
CD.update(dict(zip(('x', 'y'), proj(CD['lng'], CD['lat']))))

com_pedidos = {p['cidade'] for p in pedidos}
for m in municipios:
    m['pedidos'] = sum(1 for p in pedidos if p['cidade'] == m['name'])

json.dump({'lat0': LAT0, 'lon0': LON0, 'kx': KX, 'ky': KY, 'municipios': municipios, 'roads': roads, 'rivers': rivers,
           'pedidos': pedidos, 'cd': CD}, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print('municipios', len(municipios), 'vertices', sum(len(r) for m in municipios for r in m['rings']))
print('rodovias', len(roads), 'rios', len(rivers))
print('pedidos', len(pedidos), 'entregas', sum(p['tipo'] == 'entrega' for p in pedidos), 'coletas', sum(p['tipo'] == 'coleta' for p in pedidos))
print('peso total', sum(p['peso'] for p in pedidos))
