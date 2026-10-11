import os
import random
from PIL import Image, ImageDraw

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "sprites")
os.makedirs(out_dir, exist_ok=True)

N = 40  # art grid size
SCALE = 5  # 40 * 5 = 200px output
OUTLINE = (40, 28, 30, 255)

def shade(c, d):
    return tuple(max(0, min(255, v + d)) for v in c[:3]) + (255,)

class Sprite:
    def __init__(self, size=N):
        self.size = size
        self.img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        self.pix = self.img.load()

    def part(self, draw_fn, color, edge=-45, shading=True):
        mask = Image.new("L", (self.size, self.size), 0)
        draw_fn(ImageDraw.Draw(mask))
        m = mask.load()
        cells = [(x, y) for y in range(self.size) for x in range(self.size) if m[x, y]]
        if not cells:
            return
        xs = [c[0] for c in cells]
        ys = [c[1] for c in cells]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        w, h = max(1, x1 - x0), max(1, y1 - y0)
        for (x, y) in cells:
            col = color
            if shading:
                fx, fy = (x - x0) / w, (y - y0) / h
                if fx + fy > 1.25:
                    col = shade(color, -22)
                elif fx + fy < 0.55:
                    col = shade(color, 22)
            inside = lambda a, b: 0 <= a < self.size and 0 <= b < self.size and m[a, b]
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
        if 0 <= x < self.size and 0 <= y < self.size:
            self.pix[x, y] = color if len(color) == 4 else color + (255,)

    def line(self, pts, color, width=1):
        ImageDraw.Draw(self.img).line(pts, fill=color if len(color) == 4 else color + (255,), width=width)

    def eye(self, x, y):
        for dx in range(2):
            for dy in range(2):
                self.px(x + dx, y + dy, (24, 20, 26))
        self.px(x, y, (255, 255, 255))

    def finish(self, name, add_shadow=True, shadow_box=(9, 36, 31, 39)):
        src = self.img.copy()
        sp = src.load()
        for y in range(self.size):
            for x in range(self.size):
                if sp[x, y][3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        a, b = x + dx, y + dy
                        if 0 <= a < self.size and 0 <= b < self.size and sp[a, b][3] > 0:
                            self.pix[x, y] = OUTLINE
                            break
        out_img = Image.new("RGBA", (self.size, self.size), (0, 0, 0, 0))
        if add_shadow:
            ImageDraw.Draw(out_img).ellipse(shadow_box, fill=(0, 0, 0, 70))
        out_img.alpha_composite(self.img)
        big = out_img.resize((self.size * SCALE, self.size * SCALE), Image.NEAREST)
        path = os.path.join(out_dir, f"{name}.png")
        big.save(path, "PNG", optimize=True)
        print(f"Generated {name}.png ({self.size * SCALE}x{self.size * SCALE})")

# 1. 🍄 MUSHROOM
def generate_mushroom():
    s = Sprite()
    cream = (245, 235, 215)
    red = (230, 42, 42)
    white = (255, 255, 255)
    # Stalk
    s.ellipse((14, 20, 26, 37), cream, edge=-30)
    # Gills under cap
    s.ellipse((10, 21, 30, 27), shade(cream, -35), edge=-20)
    # Red Cap
    s.ellipse((6, 7, 34, 24), red, edge=-40)
    # White Polka Dots
    s.ellipse((17, 10, 23, 15), white, shading=False)
    s.ellipse((9, 14, 14, 18), white, shading=False)
    s.ellipse((26, 13, 31, 17), white, shading=False)
    s.ellipse((13, 17, 17, 20), white, shading=False)
    s.ellipse((22, 17, 26, 20), white, shading=False)
    # Cute little shy face on stem
    s.px(17, 27, (40, 28, 30))
    s.px(23, 27, (40, 28, 30))
    s.line([(19, 29), (21, 29)], (40, 28, 30))
    s.px(15, 28, (245, 140, 150))
    s.px(25, 28, (245, 140, 150))
    s.finish("mushroom", shadow_box=(11, 34, 29, 38))

# 2. 🐠 NEMO (Clownfish)
def generate_nemo():
    s = Sprite()
    orange = (255, 115, 20)
    white = (252, 252, 252)
    black = (30, 25, 28)
    # Caudal Tail fin
    s.poly([(29, 18), (38, 12), (36, 20), (38, 28), (29, 22)], orange, edge=-35)
    s.line([(36, 13), (34, 20), (36, 27)], black, width=1)
    s.poly([(35, 15), (37, 13), (35, 20), (37, 27), (35, 25)], white, edge=None, shading=False)
    # Dorsal fin
    s.poly([(14, 9), (20, 6), (26, 8), (28, 14), (16, 13)], orange, edge=-30)
    s.line([(16, 8), (26, 7)], black, width=1)
    s.line([(18, 9), (24, 8)], white, width=1)
    # Anal fin
    s.poly([(20, 25), (25, 30), (28, 26), (22, 24)], orange, edge=-30)
    s.line([(22, 28), (26, 27)], black, width=1)
    # Main Body
    s.ellipse((5, 11, 31, 28), orange, edge=-35)
    # Stripe 1: Head stripe
    s.ellipse((10, 11, 15, 28), white, edge=None, shading=False)
    s.line([(10, 12), (10, 27)], black, width=1)
    s.line([(15, 12), (15, 27)], black, width=1)
    # Stripe 2: Mid-body stripe (with classic Nemo forward peak)
    s.poly([(19, 11), (23, 11), (25, 19), (23, 28), (19, 28), (21, 19)], white, edge=None, shading=False)
    s.line([(19, 11), (21, 19), (19, 28)], black, width=1)
    s.line([(23, 11), (25, 19), (23, 28)], black, width=1)
    # Stripe 3: Tail band
    s.rect((28, 17, 30, 23), white, edge=None, shading=False)
    s.line([(28, 17), (28, 23)], black, width=1)
    s.line([(30, 17), (30, 23)], black, width=1)
    # Pectoral Fin (Nemo's "lucky fin"!)
    s.poly([(12, 21), (17, 25), (14, 28), (11, 24)], orange, edge=-30)
    s.line([(15, 26), (13, 28)], black, width=1)
    s.line([(14, 25), (12, 27)], white, width=1)
    # Eye & Smile
    s.eye(7, 16)
    s.line([(4, 22), (6, 23)], black)
    s.px(8, 20, (255, 150, 130))
    s.finish("nemo", add_shadow=False)

# 2b. 🐠 MARLIN (Adult Clownfish, Nemo's Father)
def generate_marlin():
    s = Sprite()
    # Adult clownfish has a richer, deeper orange hue
    deep_orange = (240, 95, 12)
    white = (252, 252, 252)
    black = (26, 20, 24)
    # Caudal Tail fin - broader, stronger adult fin
    s.poly([(30, 16), (39, 10), (37, 20), (39, 30), (30, 24)], deep_orange, edge=-35)
    s.line([(37, 11), (35, 20), (37, 29)], black, width=1)
    s.poly([(36, 13), (38, 11), (36, 20), (38, 29), (36, 27)], white, edge=None, shading=False)
    # Majestic Dorsal fin
    s.poly([(13, 7), (21, 4), (28, 6), (30, 13), (15, 12)], deep_orange, edge=-30)
    s.line([(15, 6), (28, 5)], black, width=1)
    s.line([(17, 7), (26, 6)], white, width=1)
    # Anal fin
    s.poly([(19, 25), (26, 31), (29, 27), (22, 24)], deep_orange, edge=-30)
    s.line([(22, 29), (27, 28)], black, width=1)
    # Main Body - slightly larger and sleeker adult profile
    s.ellipse((4, 10, 32, 28), deep_orange, edge=-35)
    # Stripe 1: Head stripe
    s.ellipse((9, 10, 14, 28), white, edge=None, shading=False)
    s.line([(9, 11), (9, 27)], black, width=1)
    s.line([(14, 11), (14, 27)], black, width=1)
    # Stripe 2: Mid-body stripe with distinctive clownfish curve
    s.poly([(18, 10), (22, 10), (24, 18), (22, 28), (18, 28), (20, 18)], white, edge=None, shading=False)
    s.line([(18, 10), (20, 18), (18, 28)], black, width=1)
    s.line([(22, 10), (24, 18), (22, 28)], black, width=1)
    # Stripe 3: Tail band
    s.rect((28, 16, 30, 24), white, edge=None, shading=False)
    s.line([(28, 16), (28, 24)], black, width=1)
    s.line([(30, 16), (30, 24)], black, width=1)
    # Full Adult Pectoral Fin (prominent, normal-sized)
    s.poly([(11, 20), (18, 26), (15, 29), (10, 24)], deep_orange, edge=-30)
    s.line([(16, 27), (14, 29)], black, width=1)
    s.line([(15, 26), (13, 28)], white, width=1)
    # Expressive adult clownfish eye (caring fatherly brow)
    s.eye(6, 15)
    s.line([(5, 13), (8, 13)], black, width=1)
    s.line([(4, 22), (7, 22)], black)
    s.px(7, 19, (235, 130, 110))
    s.finish("marlin", add_shadow=False)

# 3. 🌵 WAVING CACTUS (Trunk + stationary left arm, and waving right arm)
def generate_cactus():
    # Full cactus with two arms
    s = Sprite()
    green = (56, 142, 60)
    light_green = (102, 187, 106)
    flower = (255, 214, 0)
    # Left Arm (Stationary)
    s.poly([(16, 22), (7, 22), (7, 13), (12, 13), (12, 18), (16, 18)], green, edge=-35)
    s.ellipse((7, 11, 12, 15), green, edge=-25)
    # Right Arm (Second Arm)
    s.poly([(24, 24), (33, 24), (33, 15), (28, 15), (28, 20), (24, 20)], green, edge=-35)
    s.ellipse((28, 13, 33, 17), green, edge=-25)
    # Central Trunk
    s.rect((15, 9, 25, 36), green, edge=-35)
    s.ellipse((15, 5, 25, 14), green, edge=-25)
    # Vertical Ribs / Highlights
    s.line([(18, 8), (18, 35)], light_green)
    s.line([(22, 8), (22, 35)], light_green)
    s.line([(9, 14), (9, 20)], light_green)
    s.line([(31, 16), (31, 22)], light_green)
    # Spines
    for (x, y) in [(15, 12), (25, 15), (15, 22), (25, 26), (15, 30), (25, 33)]:
        s.px(x, y, (240, 240, 220))
    # Desert flower on head
    s.ellipse((18, 3, 22, 7), flower, edge=-15)
    s.px(20, 5, (230, 81, 0))
    s.finish("cactus", shadow_box=(12, 34, 28, 38))

    # Cactus Trunk without right arm (for interactive pivoting arm animation)
    s_trunk = Sprite()
    s_trunk.poly([(16, 22), (7, 22), (7, 13), (12, 13), (12, 18), (16, 18)], green, edge=-35)
    s_trunk.ellipse((7, 11, 12, 15), green, edge=-25)
    s_trunk.rect((15, 9, 25, 36), green, edge=-35)
    s_trunk.ellipse((15, 5, 25, 14), green, edge=-25)
    s_trunk.line([(18, 8), (18, 35)], light_green)
    s_trunk.line([(22, 8), (22, 35)], light_green)
    s_trunk.line([(9, 14), (9, 20)], light_green)
    for (x, y) in [(15, 12), (25, 15), (15, 22), (25, 26), (15, 30), (25, 33)]:
        s_trunk.px(x, y, (240, 240, 220))
    s_trunk.ellipse((18, 3, 22, 7), flower, edge=-15)
    s_trunk.px(20, 5, (230, 81, 0))
    s_trunk.finish("cactus_trunk", shadow_box=(12, 34, 28, 38))

    # Waving Arm alone (centered around pivot at bottom-left)
    s_arm = Sprite()
    # Arm starts at (4, 30), goes right to (15, 30), up to (15, 10), capped at top
    s_arm.poly([(4, 24), (16, 24), (16, 8), (10, 8), (10, 18), (4, 18)], green, edge=-30)
    s_arm.ellipse((10, 6, 16, 11), green, edge=-20)
    s_arm.line([(13, 9), (13, 22)], light_green)
    s_arm.px(16, 12, (240, 240, 220))
    s_arm.px(16, 16, (240, 240, 220))
    s_arm.finish("cactus_arm", add_shadow=False)

# 4. 🌾 TALL GRASS PATCH (Grasslands)
def generate_tall_grass():
    s = Sprite()
    dark_green = (34, 120, 48)
    mid_green = (46, 175, 60)
    bright_green = (110, 215, 75)
    # Base soil mound
    s.ellipse((6, 28, 34, 37), (90, 65, 35), edge=-20)
    # Tuft of tall waving grass blades
    blades = [
        [(8, 32), (10, 18), (7, 12), (12, 22), (12, 32)],
        [(13, 33), (15, 14), (17, 8), (18, 16), (17, 33)],
        [(18, 33), (21, 12), (23, 6), (24, 15), (23, 33)],
        [(24, 33), (26, 16), (30, 9), (28, 22), (28, 33)],
        [(28, 33), (32, 20), (35, 14), (32, 25), (32, 33)],
    ]
    for pts in blades:
        s.poly(pts, mid_green, edge=-25)
    # Highlights on tips
    s.line([(7, 12), (10, 18)], bright_green)
    s.line([(17, 8), (15, 14)], bright_green)
    s.line([(23, 6), (21, 12)], bright_green)
    s.line([(30, 9), (26, 16)], bright_green)
    s.line([(35, 14), (32, 20)], bright_green)
    # Small wildflowers in grass
    s.ellipse((11, 15, 15, 19), (245, 158, 11), edge=-10)  # orange poppy
    s.ellipse((27, 13, 31, 17), (168, 85, 247), edge=-10)  # purple clover
    s.ellipse((19, 21, 23, 25), (236, 72, 153), edge=-10)  # pink blossom
    s.finish("tall_grass", shadow_box=(5, 31, 35, 38))

# 5. ❄️ ICE PATCH (Tundra Glacial Pack Ice)
def generate_ice_patch():
    s = Sprite()
    deep_ice = (85, 165, 210)
    mid_ice = (145, 215, 242)
    frost_white = (225, 245, 255)
    pure_white = (255, 255, 255)
    
    # Natural angular glacial ice floe geometry
    ice_poly = [(5, 15), (10, 8), (23, 6), (32, 9), (36, 17), (35, 26), (26, 32), (13, 31), (4, 23)]
    s.poly(ice_poly, deep_ice, edge=-35)
    
    inner_poly = [(7, 16), (11, 10), (22, 8), (30, 11), (34, 18), (33, 25), (25, 30), (14, 29), (6, 22)]
    s.poly(inner_poly, mid_ice, edge=-15)
    
    # Frost facets & glassy reflections
    s.poly([(10, 11), (22, 9), (28, 13), (16, 16)], frost_white, shading=False)
    
    # Specular glacial glints across surface
    s.ellipse((14, 11, 24, 15), pure_white, shading=False)
    s.line([(26, 14), (32, 18)], frost_white, width=1)
    s.line([(7, 21), (12, 26)], frost_white, width=1)
    
    # Realistic crystalline stress fractures
    s.line([(12, 19), (18, 22), (23, 20), (29, 23)], pure_white, width=1)
    s.line([(18, 22), (20, 27)], pure_white, width=1)
    s.line([(23, 20), (25, 15)], pure_white, width=1)
    s.line([(14, 15), (16, 19)], pure_white, width=1)
    s.finish("ice_patch", add_shadow=False)

if __name__ == "__main__":
    generate_mushroom()
    generate_nemo()
    generate_marlin()
    generate_cactus()
    generate_tall_grass()
    generate_ice_patch()
