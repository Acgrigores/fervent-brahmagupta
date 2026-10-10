"""
Generates pixel-art sprites for the six animal friends, matching the chunky
pixel style of the biome backgrounds (see generate_biome_backgrounds.py).
Each animal is drawn on a small grid from shaded, outlined parts, then scaled
up with nearest-neighbour so every art pixel stays crisp.
"""
import os
import random
from PIL import Image, ImageDraw

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "sprites")
os.makedirs(out_dir, exist_ok=True)

N = 40  # art grid size
SCALE = 5  # 40 * 5 = 200px output, same size as the previous sprites
OUTLINE = (40, 28, 30, 255)


def shade(c, d):
    return tuple(max(0, min(255, v + d)) for v in c[:3]) + (255,)


class Sprite:
    def __init__(self):
        self.img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
        self.pix = self.img.load()

    def part(self, draw_fn, color, edge=-45, shading=True):
        """Draw a filled shape with an inner darker edge and soft top-left lighting."""
        mask = Image.new("L", (N, N), 0)
        draw_fn(ImageDraw.Draw(mask))
        m = mask.load()
        cells = [(x, y) for y in range(N) for x in range(N) if m[x, y]]
        if not cells:
            return
        xs = [c[0] for c in cells]
        ys = [c[1] for c in cells]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        w, h = max(1, x1 - x0), max(1, y1 - y0)
        for (x, y) in cells:
            inside = lambda a, b: 0 <= a < N and 0 <= b < N and m[a, b]
            col = color
            if shading:
                fx, fy = (x - x0) / w, (y - y0) / h
                if fx + fy > 1.25:
                    col = shade(color, -22)
                elif fx + fy < 0.55:
                    col = shade(color, 22)
            if edge is not None and not all(inside(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                col = shade(color, edge)
            self.pix[x, y] = col

    def ellipse(self, box, color, **kw):
        self.part(lambda d: d.ellipse(box, fill=255), color, **kw)

    def rect(self, box, color, **kw):
        self.part(lambda d: d.rectangle(box, fill=255), color, **kw)

    def poly(self, pts, color, **kw):
        self.part(lambda d: d.polygon(pts, fill=255), color, **kw)

    def px(self, x, y, color):
        self.pix[x, y] = color if len(color) == 4 else color + (255,)

    def line(self, pts, color):
        ImageDraw.Draw(self.img).line(pts, fill=color if len(color) == 4 else color + (255,), width=1)

    def eye(self, x, y):
        """2x2 glossy eye with a sparkle."""
        for dx in range(2):
            for dy in range(2):
                self.px(x + dx, y + dy, (24, 20, 26))
        self.px(x, y, (255, 255, 255))

    def blush(self, x, y):
        self.px(x, y, (240, 130, 140))
        self.px(x + 1, y, (240, 130, 140))

    def finish(self, name):
        # Outer silhouette outline
        src = self.img.copy()
        sp = src.load()
        for y in range(N):
            for x in range(N):
                if sp[x, y][3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        a, b = x + dx, y + dy
                        if 0 <= a < N and 0 <= b < N and sp[a, b][3] > 0:
                            self.pix[x, y] = OUTLINE
                            break
        # Ground shadow under the sprite
        shadow = Image.new("RGBA", (N, N), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).ellipse((9, 36, 31, 39), fill=(0, 0, 0, 70))
        shadow.alpha_composite(self.img)
        big = shadow.resize((N * SCALE, N * SCALE), Image.NEAREST)
        big.save(os.path.join(out_dir, f"{name}.png"), "PNG", optimize=True)
        print(f"Generated {name}.png ({N * SCALE}x{N * SCALE})")


# ---------------------------------------------------------------
def red_panda():
    s = Sprite()
    rust, dark, white = (200, 86, 40), (70, 34, 28), (250, 244, 232)
    # Ringed tail curling up on the right
    s.ellipse((25, 17, 37, 37), rust)
    for y in (21, 26, 31):
        s.line([(27, y), (35, y + 1)], shade(rust, -60))
    # Body, legs and arms
    s.ellipse((10, 18, 30, 37), rust)
    s.rect((12, 32, 17, 37), dark, edge=-20)
    s.rect((23, 32, 28, 37), dark, edge=-20)
    s.ellipse((9, 23, 14, 32), dark, edge=-20)
    s.ellipse((26, 23, 31, 32), dark, edge=-20)
    # Ears behind the head
    s.ellipse((7, 2, 15, 11), rust)
    s.ellipse((25, 2, 33, 11), rust)
    s.ellipse((9, 4, 13, 9), white, shading=False)
    s.ellipse((27, 4, 31, 9), white, shading=False)
    # Head and face markings
    s.ellipse((7, 5, 33, 24), rust)
    s.ellipse((9, 13, 17, 22), white, edge=-15)
    s.ellipse((23, 13, 31, 22), white, edge=-15)
    s.ellipse((16, 15, 24, 22), white, edge=-15)
    s.rect((12, 9, 14, 10), white, edge=None, shading=False)
    s.rect((26, 9, 28, 10), white, edge=None, shading=False)
    s.eye(13, 13)
    s.eye(25, 13)
    s.rect((19, 16, 21, 17), (30, 24, 26), edge=None, shading=False)
    s.px(19, 19, (120, 50, 50))
    s.px(21, 19, (120, 50, 50))
    s.px(20, 20, (120, 50, 50))
    s.blush(10, 17)
    s.blush(28, 17)
    s.finish("red_panda")


def manatee():
    s = Sprite()
    grey, light = (138, 156, 172), (196, 206, 214)
    # Paddle tail
    s.ellipse((29, 16, 39, 30), grey)
    # Body
    s.ellipse((6, 11, 34, 33), grey)
    s.ellipse((11, 23, 31, 33), light, edge=-25)
    # Flipper
    s.poly([(15, 25), (21, 25), (19, 34), (13, 33)], shade(grey, -15))
    # Head + muzzle
    s.ellipse((1, 9, 20, 28), grey)
    s.ellipse((0, 17, 11, 28), light, edge=-30)
    s.eye(8, 15)
    s.px(2, 19, (60, 60, 70))
    s.px(5, 19, (60, 60, 70))
    for (x, y) in [(2, 22), (4, 23), (7, 22), (3, 25), (6, 25)]:
        s.px(x, y, (110, 120, 130))
    s.line([(4, 26), (8, 26)], (90, 80, 90))
    s.blush(11, 20)
    s.finish("manatee")


def polar_bear():
    s = Sprite()
    fur, cream, pad = (240, 244, 250), (250, 246, 230), (60, 54, 64)
    s.ellipse((8, 17, 32, 37), fur)
    s.ellipse((13, 23, 27, 35), cream, edge=-18)
    s.ellipse((7, 22, 14, 33), fur)
    s.ellipse((26, 22, 33, 33), fur)
    # Feet with pads
    s.ellipse((10, 31, 18, 38), fur)
    s.ellipse((22, 31, 30, 38), fur)
    s.ellipse((12, 33, 16, 37), pad, edge=None, shading=False)
    s.ellipse((24, 33, 28, 37), pad, edge=None, shading=False)
    # Ears and head
    s.ellipse((9, 3, 16, 10), fur)
    s.ellipse((24, 3, 31, 10), fur)
    s.ellipse((11, 5, 14, 8), (200, 200, 214), edge=None, shading=False)
    s.ellipse((26, 5, 29, 8), (200, 200, 214), edge=None, shading=False)
    s.ellipse((8, 5, 32, 24), fur)
    s.ellipse((14, 13, 26, 22), cream, edge=-20)
    s.eye(13, 11)
    s.eye(25, 11)
    s.rect((18, 14, 22, 16), (30, 26, 34), edge=None, shading=False)
    s.px(18, 14, (90, 90, 110))
    s.line([(20, 17), (20, 18)], (60, 54, 64))
    s.px(19, 19, (60, 54, 64))
    s.px(21, 19, (60, 54, 64))
    s.blush(11, 16)
    s.blush(28, 16)
    s.finish("polar_bear")


def butterfly():
    s = Sprite()
    black, orange, gold = (36, 28, 30), (244, 138, 30), (252, 186, 60)
    # Wings: black frame with orange panels
    for box, inner in [
        ((2, 5, 20, 23), (5, 8, 18, 20)),
        ((20, 5, 38, 23), (22, 8, 35, 20)),
        ((6, 19, 20, 34), (8, 21, 18, 31)),
        ((20, 19, 34, 34), (22, 21, 32, 31)),
    ]:
        s.ellipse(box, black, edge=None, shading=False)
        s.ellipse(inner, orange, edge=20)
    # Veins
    for pts in [[(19, 14), (7, 10)], [(19, 15), (9, 18)], [(21, 14), (33, 10)], [(21, 15), (31, 18)],
                [(19, 23), (11, 28)], [(21, 23), (29, 28)]]:
        s.line(pts, black)
    # Golden highlights and white spots on the border
    for (x, y) in [(9, 12), (30, 12), (13, 26), (26, 26)]:
        s.px(x, y, gold)
        s.px(x + 1, y, gold)
    for (x, y) in [(4, 13), (5, 17), (35, 13), (34, 17), (8, 30), (31, 30), (11, 33), (28, 33), (8, 7), (31, 7)]:
        s.px(x, y, (255, 255, 255))
    # Body, head, antennae
    s.ellipse((18, 9, 22, 33), black, edge=None, shading=False)
    for y in range(12, 32, 3):
        s.px(20, y, (90, 80, 84))
    s.ellipse((16, 3, 24, 11), black, edge=None, shading=False)
    s.px(18, 6, (255, 255, 255))
    s.px(22, 6, (255, 255, 255))
    s.line([(18, 4), (14, 1)], black)
    s.line([(22, 4), (26, 1)], black)
    s.blush(16, 8)
    s.blush(23, 8)
    s.finish("butterfly")


def cheetah():
    s = Sprite()
    gold, cream, spot = (236, 182, 86), (252, 238, 206), (52, 38, 32)
    random.seed(7)
    # Tail curling up on the left
    s.poly([(12, 35), (5, 33), (2, 27), (3, 20), (6, 18), (7, 22), (6, 27), (8, 30), (12, 31)], gold)
    for (x, y) in [(3, 22), (3, 26), (5, 30), (9, 33)]:
        s.px(x, y, spot)
        s.px(x + 1, y, spot)
    # Body
    s.ellipse((9, 17, 31, 37), gold)
    s.ellipse((14, 23, 26, 36), cream, edge=-18)
    s.rect((12, 31, 17, 37), gold)
    s.rect((23, 31, 28, 37), gold)
    # Ears and head
    s.ellipse((9, 3, 16, 10), gold)
    s.ellipse((24, 3, 31, 10), gold)
    s.ellipse((11, 5, 14, 8), spot, edge=None, shading=False)
    s.ellipse((26, 5, 29, 8), spot, edge=None, shading=False)
    s.ellipse((8, 5, 32, 24), gold)
    s.ellipse((14, 14, 26, 23), cream, edge=-18)
    # Spots on body and head
    for (x, y) in [(11, 20), (13, 27), (28, 21), (27, 27), (10, 25), (29, 25), (13, 33), (26, 33),
                   (12, 9), (27, 9), (19, 7), (22, 9), (17, 9), (10, 14), (30, 14)]:
        s.px(x, y, spot)
    s.eye(13, 12)
    s.eye(25, 12)
    # Tear marks
    s.line([(13, 14), (14, 19)], spot)
    s.line([(26, 14), (25, 19)], spot)
    s.rect((19, 16, 21, 17), (40, 28, 30), edge=None, shading=False)
    s.px(19, 19, (120, 70, 60))
    s.px(21, 19, (120, 70, 60))
    s.px(20, 18, (120, 70, 60))
    s.finish("cheetah")


def sea_turtle():
    s = Sprite()
    skin, shell, scute = (108, 176, 132), (104, 80, 44), (190, 160, 96)
    # Flippers
    s.poly([(10, 14), (1, 8), (0, 12), (8, 20)], skin)
    s.poly([(30, 14), (39, 8), (39, 12), (32, 20)], skin)
    s.ellipse((7, 26, 15, 35), skin)
    s.ellipse((25, 26, 33, 35), skin)
    s.poly([(19, 32), (21, 32), (20, 37)], skin)
    # Head
    s.ellipse((13, 0, 27, 13), skin)
    s.eye(15, 5)
    s.eye(23, 5)
    s.line([(18, 10), (22, 10)], (50, 80, 60))
    s.blush(14, 8)
    s.blush(25, 8)
    # Shell with scute pattern
    s.ellipse((7, 9, 33, 34), shell)
    s.poly([(17, 13), (23, 13), (25, 18), (20, 21), (15, 18)], scute)
    s.poly([(15, 20), (20, 23), (25, 20), (26, 26), (20, 29), (14, 26)], scute)
    s.poly([(11, 16), (14, 18), (13, 25), (10, 23)], scute)
    s.poly([(29, 16), (26, 18), (27, 25), (30, 23)], scute)
    for (x, y) in [(11, 14), (28, 14), (12, 28), (27, 28), (20, 31)]:
        s.px(x, y, shade(scute, 10))
    # Spots on flippers
    for (x, y) in [(3, 10), (6, 13), (36, 10), (33, 13), (10, 30), (29, 30)]:
        s.px(x, y, (70, 130, 96))
    s.finish("sea_turtle")


for fn in (red_panda, manatee, polar_bear, butterfly, cheetah, sea_turtle):
    fn()
