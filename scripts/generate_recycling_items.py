"""
Generates pixel-art item sprites for Mo's recycling sorting game, in the same
outlined, shaded pixel style as the animal sprites (generate_animal_sprites.py).
"""
import os
from PIL import Image, ImageDraw

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "recycling")
os.makedirs(out_dir, exist_ok=True)

N = 24  # art grid size
SCALE = 4  # 96px output
OUTLINE = (40, 28, 30, 255)


def shade(c, d):
    return tuple(max(0, min(255, v + d)) for v in c[:3]) + (255,)


class Item:
    def __init__(self):
        self.img = Image.new("RGBA", (N, N), (0, 0, 0, 0))
        self.pix = self.img.load()

    def part(self, draw_fn, color, edge=-40, shading=True):
        mask = Image.new("L", (N, N), 0)
        draw_fn(ImageDraw.Draw(mask))
        m = mask.load()
        cells = [(x, y) for y in range(N) for x in range(N) if m[x, y]]
        if not cells:
            return
        x0, x1 = min(c[0] for c in cells), max(c[0] for c in cells)
        y0, y1 = min(c[1] for c in cells), max(c[1] for c in cells)
        w, h = max(1, x1 - x0), max(1, y1 - y0)
        for (x, y) in cells:
            col = color
            if shading:
                f = (x - x0) / w + (y - y0) / h
                if f > 1.3:
                    col = shade(color, -24)
                elif f < 0.5:
                    col = shade(color, 24)
            if edge is not None and not all(
                0 <= x + dx < N and 0 <= y + dy < N and m[x + dx, y + dy]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            ):
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

    def save(self, name):
        src = self.img.copy()
        sp = src.load()
        for y in range(N):
            for x in range(N):
                if sp[x, y][3] == 0 and any(
                    0 <= x + dx < N and 0 <= y + dy < N and sp[x + dx, y + dy][3] > 0
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                ):
                    self.pix[x, y] = OUTLINE
        self.img.resize((N * SCALE, N * SCALE), Image.NEAREST).save(
            os.path.join(out_dir, f"{name}.png"), "PNG", optimize=True
        )
        print(f"Generated {name}.png")


# ---------------- Recycling ----------------
def plastic_bottle():
    s = Item()
    s.rect((10, 1, 13, 3), (40, 110, 210))
    s.poly([(10, 4), (13, 4), (16, 8), (7, 8)], (170, 214, 240))
    s.rect((7, 8, 16, 21), (170, 214, 240))
    s.rect((7, 12, 16, 16), (60, 170, 110), edge=-30)
    s.line([(9, 9), (9, 11)], (235, 248, 255))
    s.line([(9, 17), (9, 19)], (235, 248, 255))
    s.save("plastic_bottle")


def aluminum_can():
    s = Item()
    s.rect((6, 3, 17, 21), (196, 200, 210))
    s.rect((6, 8, 17, 16), (214, 54, 54), edge=-30)
    s.line([(7, 3), (16, 3)], (150, 154, 166))
    s.rect((10, 4, 13, 5), (230, 232, 238), edge=None, shading=False)
    s.line([(8, 10), (8, 14)], (250, 160, 160))
    s.line([(9, 11), (14, 11)], (255, 255, 255))
    s.save("aluminum_can")


def glass_jar():
    s = Item()
    s.rect((7, 3, 16, 6), (210, 166, 64))
    s.rect((6, 7, 17, 21), (150, 206, 180))
    s.line([(8, 9), (8, 18)], (225, 250, 238))
    s.line([(9, 9), (9, 11)], (225, 250, 238))
    s.rect((9, 12, 14, 16), (245, 240, 220), edge=-20)
    s.save("glass_jar")


def newspaper():
    s = Item()
    s.poly([(3, 6), (19, 4), (21, 17), (5, 20)], (236, 232, 220))
    s.line([(6, 8), (17, 7)], (60, 56, 60))
    s.line([(6, 9), (17, 8)], (60, 56, 60))
    for y in (11, 13, 15):
        s.line([(6, y + 1), (11, y)], (150, 146, 150))
        s.line([(13, y), (18, y - 1)], (150, 146, 150))
    s.rect((13, 12, 17, 15), (140, 170, 200), edge=-30)
    s.save("newspaper")


def cardboard_box():
    s = Item()
    s.poly([(3, 9), (12, 6), (21, 9), (12, 12)], (214, 170, 110))
    s.poly([(3, 9), (12, 12), (12, 22), (3, 18)], (196, 148, 90))
    s.poly([(12, 12), (21, 9), (21, 18), (12, 22)], (170, 124, 72))
    s.line([(7, 8), (16, 11)], (236, 214, 160))
    s.line([(7, 11), (7, 19)], (150, 108, 64))
    s.save("cardboard_box")


# ---------------- Compost ----------------
def banana_peel():
    s = Item()
    s.poly([(11, 4), (13, 4), (14, 12), (10, 12)], (246, 210, 60))
    s.poly([(10, 11), (4, 18), (6, 20), (11, 14)], (240, 200, 50))
    s.poly([(14, 11), (20, 18), (18, 20), (13, 14)], (240, 200, 50))
    s.poly([(11, 12), (13, 12), (13, 21), (11, 21)], (246, 210, 60))
    s.rect((11, 2, 13, 4), (110, 80, 40), edge=None, shading=False)
    for (x, y) in [(5, 18), (19, 18), (12, 20), (12, 8)]:
        s.px(x, y, (130, 96, 40))
    s.save("banana_peel")


def apple_core():
    s = Item()
    s.ellipse((6, 3, 17, 9), (210, 50, 50))
    s.ellipse((6, 15, 17, 21), (210, 50, 50))
    s.rect((9, 7, 14, 17), (250, 236, 200), edge=-25)
    s.px(11, 10, (70, 40, 30))
    s.px(12, 12, (70, 40, 30))
    s.line([(12, 0), (12, 3)], (110, 70, 40))
    s.poly([(13, 1), (16, 0), (15, 2)], (80, 160, 70))
    s.save("apple_core")


def eggshells():
    s = Item()
    s.part(lambda d: d.chord((1, 0, 14, 20), 0, 180, fill=255), (244, 232, 206))
    s.part(lambda d: d.chord((9, 5, 23, 23), 0, 180, fill=255), (236, 222, 194))
    for x in range(2, 14, 2):
        s.px(x, 10, (0, 0, 0, 0))
    for x in range(10, 23, 2):
        s.px(x, 14, (0, 0, 0, 0))
    s.px(5, 15, (210, 196, 170))
    s.px(16, 19, (210, 196, 170))
    s.save("eggshells")


def coffee_grounds():
    s = Item()
    s.poly([(4, 8), (20, 8), (16, 21), (8, 21)], (245, 245, 240))
    s.ellipse((5, 4, 19, 11), (92, 60, 40))
    for (x, y) in [(8, 6), (12, 5), (15, 7), (10, 8), (14, 9)]:
        s.px(x, y, (60, 38, 28))
    for y in range(12, 20, 2):
        s.line([(8, y), (16, y)], (225, 222, 214))
    s.save("coffee_grounds")


# ---------------- Hazardous ----------------
def battery():
    s = Item()
    s.rect((10, 2, 13, 4), (170, 170, 180))
    s.rect((7, 4, 16, 21), (50, 52, 62))
    s.rect((7, 4, 16, 9), (220, 150, 50), edge=-30)
    s.line([(11, 13), (12, 13)], (250, 250, 250))
    s.line([(11, 17), (12, 17)], (250, 250, 250))
    s.line([(11, 16), (12, 16)], (250, 250, 250))
    s.px(11, 12, (250, 250, 250))
    s.px(12, 14, (250, 250, 250))
    s.save("battery")


def paint_can():
    s = Item()
    s.line([(6, 7), (8, 2), (15, 2), (17, 7)], (90, 90, 100))
    s.rect((5, 7, 18, 21), (190, 194, 204))
    s.rect((5, 7, 18, 9), (70, 120, 220), edge=-30)
    for (x, h) in [(7, 4), (11, 6), (15, 3)]:
        for dy in range(h):
            s.px(x, 10 + dy, (70, 120, 220))
    s.rect((8, 15, 15, 19), (250, 220, 70), edge=-40)
    s.px(11, 17, (40, 28, 30))
    s.save("paint_can")


def old_phone():
    s = Item()
    s.rect((6, 2, 17, 21), (40, 42, 50))
    s.rect((8, 4, 15, 17), (80, 110, 140), edge=-20)
    s.line([(9, 6), (12, 10), (11, 13), (14, 16)], (220, 230, 240))
    s.px(11, 19, (120, 120, 130))
    s.px(12, 19, (120, 120, 130))
    s.save("old_phone")


def fluorescent_bulb():
    s = Item()
    for i, y in enumerate(range(2, 14, 3)):
        s.ellipse((7, y, 16, y + 3), (245, 248, 236))
    s.rect((8, 14, 15, 17), (240, 240, 240))
    s.rect((9, 18, 14, 21), (176, 176, 186))
    s.line([(9, 19), (14, 19)], (120, 120, 130))
    s.save("fluorescent_bulb")


# ---------------- Landfill ----------------
def chip_bag():
    s = Item()
    s.poly([(5, 3), (18, 3), (20, 12), (18, 21), (5, 21), (3, 12)], (220, 60, 60))
    for x in range(5, 19, 2):
        s.px(x, 3, (250, 200, 200))
        s.px(x, 21, (250, 200, 200))
    s.ellipse((8, 8, 15, 15), (250, 210, 60))
    s.line([(6, 6), (6, 17)], (255, 150, 150))
    s.save("chip_bag")


def foam_cup():
    s = Item()
    s.poly([(4, 4), (19, 4), (16, 21), (7, 21)], (246, 246, 244))
    s.rect((4, 3, 19, 5), (230, 230, 228))
    for (x, y) in [(8, 9), (12, 12), (14, 8), (10, 16), (13, 18), (7, 13)]:
        s.px(x, y, (214, 214, 210))
    s.save("foam_cup")


def plastic_straw():
    s = Item()
    for i in range(18):
        x, y = 4 + i, 21 - i
        col = (230, 60, 80) if (i // 2) % 2 == 0 else (250, 250, 250)
        s.px(x, y, col)
        s.px(x - 1, y, col)
        s.px(x, y - 1, col)
    s.save("plastic_straw")


def candy_wrapper():
    s = Item()
    s.rect((7, 8, 16, 15), (150, 80, 200))
    s.poly([(7, 9), (2, 5), (3, 11), (2, 18), (7, 14)], (190, 130, 230))
    s.poly([(16, 9), (21, 5), (20, 11), (21, 18), (16, 14)], (190, 130, 230))
    s.line([(9, 10), (14, 10)], (240, 220, 255))
    s.save("candy_wrapper")


for fn in (plastic_bottle, aluminum_can, glass_jar, newspaper, cardboard_box,
           banana_peel, apple_core, eggshells, coffee_grounds,
           battery, paint_can, old_phone, fluorescent_bulb,
           chip_bag, foam_cup, plastic_straw, candy_wrapper):
    fn()
