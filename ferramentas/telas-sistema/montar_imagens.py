# Converte as capturas de ./saida em WebP para a página (img/telas/) e monta os quadros do topo.
# Rodar depois do capturar.js:  python3 montar_imagens.py
import os
from PIL import Image, ImageDraw, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(AQUI, 'saida')
D = os.path.join(AQUI, '..', '..', 'img', 'telas')
os.makedirs(D, exist_ok=True)


def abre(n):
    return Image.open(os.path.join(S, n + '.png')).convert('RGB')


def salva(im, nome, q=80):
    p = os.path.join(D, nome + '.webp')
    im.save(p, 'WEBP', quality=q, method=6)
    print(f'{nome}.webp  {im.size[0]}x{im.size[1]}  {os.path.getsize(p)//1024} KB')


def celulares(nomes, W, H, alt_cel, fundo=(234, 239, 246)):
    """Celulares lado a lado, com cantos arredondados e sombra, sobre um fundo claro."""
    base = Image.new('RGB', (W, H), fundo)
    cels = []
    for n in nomes:
        im = abre(n)
        w = round(im.width * alt_cel / im.height)
        cels.append(im.resize((w, alt_cel), Image.LANCZOS))
    gap = round(alt_cel * 0.07)
    total = sum(c.width for c in cels) + gap * (len(cels) - 1)
    x = (W - total) // 2
    y = (H - alt_cel) // 2
    for c in cels:
        r = round(c.width * 0.09)
        mask = Image.new('L', c.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, c.width - 1, c.height - 1), r, fill=255)
        sombra = Image.new('L', (c.width + 80, c.height + 80), 0)
        ImageDraw.Draw(sombra).rounded_rectangle((40, 52, c.width + 40, c.height + 52), r, fill=70)
        sombra = sombra.filter(ImageFilter.GaussianBlur(22))
        base.paste((13, 27, 46), (x - 40, y - 40), sombra)
        borda = Image.new('RGB', (c.width + 12, c.height + 12), (13, 27, 46))
        mb = Image.new('L', borda.size, 0)
        ImageDraw.Draw(mb).rounded_rectangle((0, 0, borda.width - 1, borda.height - 1), r + 6, fill=255)
        base.paste(borda, (x - 6, y - 6), mb)
        base.paste(c, (x, y), mask)
        x += c.width + gap
    return base


# ---------- telas do escritório (1600 x 1000) ----------
for n in ['painel', 'pedidos', 'mapa', 'roteirizacao', 'rota', 'frota']:
    salva(abre(n), n)

# ---------- celular (660 x 1428) ----------
for n, dest in [('motorista-lista', 'motorista-lista'), ('motorista-baixa', 'motorista-baixa'),
                ('motorista-topo', 'motorista-localizacao'), ('painel-celular', 'painel-celular'),
                ('mapa-celular', 'mapa-celular')]:
    salva(abre(n), dest)

# ---------- rastreamento: rota no painel com o veículo no mapa ----------
rota = abre('rota')
salva(rota.crop((288, 232, 1568, 800)), 'rota-localizacao')        # 1280 x 568
salva(rota.crop((300, 240, 1100, 800)), 'rota-localizacao-cel')    # 800 x 560

# ---------- sua marca ----------
salva(abre('painel'), 'marca-padrao')
salva(abre('marca-exemplo'), 'marca-exemplo')

# ---------- topo: cinco quadros (computador 1600x1000, celular 1000x750) ----------
cel_quadro = celulares(['motorista-topo', 'motorista-lista'], 1600, 1000, 900)
cel_quadro_mob = celulares(['motorista-topo', 'motorista-lista'], 1000, 750, 690)
quadros = [
    ('filme-1', abre('pedidos'), (270, 90, 1270, 840)),
    ('filme-2', abre('mapa'), (430, 225, 1430, 975)),
    ('filme-3', abre('roteirizacao'), (330, 240, 1330, 990)),
    ('filme-4', cel_quadro, None),
    ('filme-5', rota, (288, 230, 1288, 980)),
]
for nome, im, caixa in quadros:
    salva(im, nome, 78)
    salva(cel_quadro_mob if caixa is None else im.crop(caixa), nome + '-mob', 78)
