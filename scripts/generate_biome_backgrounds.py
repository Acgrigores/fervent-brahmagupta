"""
Generates pixel-art biome backgrounds (dead + flourishing) in the same style as
the central farm lawn (see generate_grass.py): a striped, speckled ground texture
with chunky pixel-art scenery layered on top. Scenery stays clear of the walkable
paths, the animal friend, and the signs placed by PhaserWorld.tsx.
"""
import os
import random
import math
from PIL import Image, ImageDraw, ImageFilter

public_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "biomes")
os.makedirs(public_dir, exist_ok=True)

W, H = 1400, 750
P = 3  # size of one "art pixel" for scenery

# Walkable path rectangles per biome (mirrors buildMaximalistBiomeRoom)
PATHS = {
    "lake": [(160, 340, 1300, 70), (660, 140, 80, 480)],
    "grasslands": [(-60, 340, 1300, 70), (660, 140, 80, 480)],
    "forest": [(660, 140, 80, 670), (240, 340, 920, 70)],
    "tundra": [(660, 140, 80, 670), (240, 340, 920, 70)],
    "desert": [(660, -60, 80, 710), (240, 340, 920, 70)],
    "reefs": [(660, -60, 80, 710), (240, 340, 920, 70)],
}

# Areas kept clear of scenery: animal, quest sign, exit signs
COMMON_KEEPOUT = [(600, 250, 200, 160), (530, 130, 340, 100)]
EXIT_KEEPOUT = {
    "lake": [(1220, 330, 180, 90)],
    "grasslands": [(0, 330, 170, 90)],
    "forest": [(570, 670, 260, 80)],
    "tundra": [(570, 670, 260, 80)],
    "desert": [(570, 0, 260, 80)],
    "reefs": [(570, 0, 260, 80)],
}


def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, int(v)))


def shade(c, d):
    return tuple(clamp(x + d) for x in c[:3]) + (c[3] if len(c) > 3 else 255,)


# ---------------------------------------------------------------
# Ground texture (same recipe as the farm lawn)
# ---------------------------------------------------------------
def make_ground(base, stripe, speck, speck_var, blade_range=(3, 7), count=22000, stripe_width=80):
    img = Image.new("RGBA", (W, H), base + (255,))
    draw = ImageDraw.Draw(img)

    for offset in range(-H, W + H, stripe_width * 2):
        draw.polygon(
            [(offset, 0), (offset + stripe_width, 0), (offset + stripe_width + H, H), (offset + H, H)],
            fill=stripe + (255,),
        )

    for _ in range(count):
        x = random.randint(0, W - 1)
        y = random.randint(0, H - 1)
        v = random.randint(-speck_var, speck_var)
        c = (clamp(speck[0] + v), clamp(speck[1] + v), clamp(speck[2] + v), random.randint(130, 230))
        blade_len = random.randint(*blade_range)
        lean = random.randint(-3, 3)
        draw.line((x, y, x + lean, y - blade_len), fill=c, width=1)
        draw.line((x + 1, y, x + lean + 2, y - blade_len + 1), fill=c, width=1)
    return img


def make_water_ground(base, stripe, light, dark, count=900):
    """Water floor: striped like the lawn, with short horizontal pixel ripples."""
    img = Image.new("RGBA", (W, H), base + (255,))
    draw = ImageDraw.Draw(img)
    stripe_width = 80
    for offset in range(-H, W + H, stripe_width * 2):
        draw.polygon(
            [(offset, 0), (offset + stripe_width, 0), (offset + stripe_width + H, H), (offset + H, H)],
            fill=stripe + (255,),
        )
    for _ in range(9000):
        x = random.randint(0, W - 1)
        y = random.randint(0, H - 1)
        draw.point((x, y), fill=shade(dark if random.random() < 0.5 else light, random.randint(-8, 8))[:3] + (150,))
    for _ in range(count):
        x = random.randint(0, W - 1)
        y = random.randint(0, H - 1)
        length = random.randint(4, 12)
        draw.line((x, y, x + length, y), fill=light + (200,), width=1)
        draw.line((x + 2, y + 1, x + length - 2, y + 1), fill=dark + (120,), width=1)
    return img


# ---------------------------------------------------------------
# Pixel-art scenery helpers (coordinates in screen pixels, snapped to the P grid)
# ---------------------------------------------------------------
class Canvas:
    def __init__(self, biome):
        self.shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.sd = ImageDraw.Draw(self.shadow)
        self.d = ImageDraw.Draw(self.layer)
        self.blocked = []
        for (x, y, w, h) in PATHS[biome] + COMMON_KEEPOUT + EXIT_KEEPOUT[biome]:
            self.blocked.append((x - 18, y - 18, x + w + 18, y + h + 18))
        self.placed = []

    def px(self, gx, gy, color):
        x, y = gx * P, gy * P
        self.d.rectangle((x, y, x + P - 1, y + P - 1), fill=color)

    def spx(self, gx, gy, alpha=70):
        x, y = gx * P, gy * P
        self.sd.rectangle((x, y, x + P - 1, y + P - 1), fill=(0, 0, 0, alpha))

    def is_free(self, x, y, r, spacing=True):
        if x - r < 0 or x + r > W or y - r < 0 or y + r > H:
            return False
        for (x0, y0, x1, y1) in self.blocked:
            if x + r > x0 and x - r < x1 and y + r > y0 and y - r < y1:
                return False
        if spacing:
            for (px_, py_, pr) in self.placed:
                if math.hypot(px_ - x, py_ - y) < r + pr:
                    return False
        return True

    def scatter(self, n, r, fn, tries=4000, spacing=True):
        spots = []
        for _ in range(tries):
            if len(spots) >= n:
                break
            x = random.randint(0, W)
            y = random.randint(0, H)
            if self.is_free(x, y, r, spacing):
                self.placed.append((x, y, r))
                spots.append((x, y))
        # Draw back-to-front so lower objects overlap upper ones
        for (x, y) in sorted(spots, key=lambda s: s[1]):
            fn(x // P, y // P)

    # --- Area masks ---
    def blob_cells(self, cx, cy, rx, ry, lumps=6):
        """Organic blob in grid cells around screen point (cx, cy)."""
        gcx, gcy = cx // P, cy // P
        grx, gry = rx // P, ry // P
        circles = [(gcx, gcy, int(grx * 0.8), int(gry * 0.8))]
        for _ in range(lumps):
            a = random.uniform(0, math.tau)
            circles.append((
                gcx + int(math.cos(a) * grx * 0.45),
                gcy + int(math.sin(a) * gry * 0.45),
                int(grx * random.uniform(0.4, 0.6)),
                int(gry * random.uniform(0.4, 0.6)),
            ))
        cells = set()
        for (ox, oy, ax, ay) in circles:
            for gy in range(oy - ay, oy + ay + 1):
                for gx in range(ox - ax, ox + ax + 1):
                    if ((gx - ox) / max(ax, 1)) ** 2 + ((gy - oy) / max(ay, 1)) ** 2 <= 1.0:
                        cells.add((gx, gy))
        # Clip out walkable areas
        return {c for c in cells if self.is_free(c[0] * P + 1, c[1] * P + 1, 1, spacing=False)}

    def fill_area(self, cells, fill, edge, rim=None, rim_width=2, fill_var=None):
        def neighbors(c):
            return [(c[0] + 1, c[1]), (c[0] - 1, c[1]), (c[0], c[1] + 1), (c[0], c[1] - 1)]

        if rim:
            ring = set(cells)
            for _ in range(rim_width):
                ring |= {n for c in ring for n in neighbors(c)}
            for c in ring - cells:
                if self.is_free(c[0] * P + 1, c[1] * P + 1, 1, spacing=False):
                    self.px(c[0], c[1], shade(rim, random.choice([0, 0, -10, 8])))
        for c in cells:
            is_edge = any(n not in cells for n in neighbors(c))
            if is_edge:
                self.px(c[0], c[1], edge)
            else:
                col = fill
                if fill_var and random.random() < 0.08:
                    col = fill_var
                self.px(c[0], c[1], col)

    # --- Sprites (gx, gy = grid coords of base/center) ---
    def disk(self, gx, gy, r, color, outline=None, highlight=None, shadow=True):
        if shadow:
            for dy in range(-r + 1, r + 2):
                for dx in range(-r, r + 3):
                    if (dx - 1) ** 2 + (dy - 1) ** 2 <= r * r:
                        self.spx(gx + dx, gy + dy + 1)
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                dist = dx * dx + dy * dy
                if dist <= r * r + r * 0.6:
                    col = color
                    if outline and dist > (r - 1) * (r - 1) + (r - 1) * 0.6:
                        col = outline
                    elif highlight and dx < 0 and dy < 0 and (dx + r * 0.4) ** 2 + (dy + r * 0.4) ** 2 <= (r * 0.45) ** 2:
                        col = highlight
                    self.px(gx + dx, gy + dy, col)

    def round_tree(self, gx, gy, r, leaf, dark, light, trunk=(92, 60, 34)):
        for dy in range(0, 3):
            self.px(gx, gy + r + dy, trunk)
            self.px(gx + 1, gy + r + dy, shade(trunk, -20))
        self.disk(gx, gy, r, leaf, outline=dark, highlight=light)
        # Leaf clumps
        for _ in range(r):
            ox = random.randint(-r + 2, r - 2)
            oy = random.randint(-r + 2, r - 2)
            if ox * ox + oy * oy < (r - 2) ** 2:
                self.px(gx + ox, gy + oy, dark)

    def pine(self, gx, gy, size, leaf, dark, snow=None, trunk=(84, 56, 34)):
        for dy in range(2):
            self.px(gx, gy + dy + 1, trunk)
        for row in range(size * 2):
            half = (row // 2) % (size // 2 + 1) + row // 4
            y = gy - size * 2 + row
            for dx in range(-half, half + 1):
                col = dark if dx == -half or dx == half or row % 4 == 3 else leaf
                if snow and row % 4 == 0 and abs(dx) < half:
                    col = snow
                self.px(gx + dx, y, col)
                if dx == half:
                    self.spx(gx + dx + 1, y + 1)
        self.px(gx, gy - size * 2 - 1, snow if snow else dark)

    def rock(self, gx, gy, size, color):
        dark = shade(color, -40)
        light = shade(color, 30)
        for dy in range(-size, 1):
            w = size + 1 if dy > -size else size - 1
            for dx in range(-w, w + 1):
                c = color
                if dy == 0 or abs(dx) == w:
                    c = dark
                elif dy == -size or (dx < 0 and dy == -size + 1):
                    c = light
                self.px(gx + dx, gy + dy, c)
        for dx in range(-size, size + 2):
            self.spx(gx + dx, gy + 1)

    def bush(self, gx, gy, color, dark, berry=None):
        self.disk(gx - 2, gy, 2, color, outline=dark, shadow=True)
        self.disk(gx + 2, gy, 2, color, outline=dark, shadow=False)
        self.disk(gx, gy - 1, 3, color, outline=dark, highlight=shade(color, 30), shadow=False)
        if berry:
            for _ in range(3):
                self.px(gx + random.randint(-3, 3), gy + random.randint(-2, 1), berry)

    def flower(self, gx, gy, petal, center=(250, 214, 60)):
        self.px(gx, gy + 1, (60, 130, 60))
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            self.px(gx + dx, gy + dy, petal)
        self.px(gx, gy, center)

    def tuft(self, gx, gy, color, dark):
        for dx, h in [(-1, 2), (0, 3), (1, 2)]:
            for dy in range(h):
                self.px(gx + dx, gy - dy, dark if dy == 0 else color)

    def stump(self, gx, gy, color=(70, 50, 36), top=(110, 84, 60)):
        for dx in range(-2, 3):
            self.spx(gx + dx + 1, gy + 1)
        for dy in range(-1, 1):
            for dx in range(-2, 3):
                self.px(gx + dx, gy + dy, color)
        for dx in range(-1, 2):
            self.px(gx + dx, gy - 2, top)
        self.px(gx, gy - 2, shade(top, -30))

    def cactus(self, gx, gy, color, dark, flower_col=None):
        for dy in range(0, 9):
            self.px(gx, gy - dy, color)
            self.px(gx + 1, gy - dy, dark)
            self.spx(gx + 2, gy - dy + 1)
        for dy in range(3, 6):
            self.px(gx - 2, gy - dy, color)
        self.px(gx - 1, gy - 3, color)
        for dy in range(4, 8):
            self.px(gx + 3, gy - dy, dark)
        self.px(gx + 2, gy - 4, dark)
        if flower_col:
            self.px(gx, gy - 9, flower_col)
            self.px(gx + 3, gy - 8, flower_col)

    def coral(self, gx, gy, color, dark):
        branches = [(-3, 5), (-1, 7), (1, 6), (3, 4)]
        for bx, h in branches:
            for dy in range(h):
                x = gx + bx + (1 if dy > h // 2 and bx > 0 else 0) - (1 if dy > h // 2 and bx < 0 else 0)
                self.px(x, gy - dy, color if dy % 3 else dark)
            self.px(gx + bx, gy - h, shade(color, 40))
        for dx in range(-3, 4):
            self.px(gx + dx, gy, dark)
            self.spx(gx + dx + 1, gy + 1)

    def brain_coral(self, gx, gy, color, dark):
        self.disk(gx, gy, 3, color, outline=dark, shadow=True)
        for dx in range(-2, 3, 2):
            self.px(gx + dx, gy - 1, dark)
            self.px(gx + dx + 1, gy + 1, dark)

    def seaweed(self, gx, gy, color, dark):
        for dy in range(10):
            sway = int(math.sin(dy * 0.8) * 1.2)
            self.px(gx + sway, gy - dy, color if dy % 2 else dark)
        for dy in range(7):
            sway = int(math.sin(dy * 0.8 + 1.5) * 1.2)
            self.px(gx + 3 + sway, gy - dy, color if dy % 2 else dark)

    def fish(self, gx, gy, color):
        dark = shade(color, -50)
        for dx in range(-2, 2):
            self.px(gx + dx, gy, color)
        self.px(gx - 1, gy - 1, color)
        self.px(gx - 1, gy + 1, color)
        self.px(gx + 2, gy - 1, dark)
        self.px(gx + 2, gy + 1, dark)
        self.px(gx - 2, gy, (20, 20, 30))

    def lily(self, gx, gy, pad, bloom=None):
        dark = shade(pad, -35)
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx * dx + dy * dy <= 5 and not (dx == 1 and dy == -1) and not (dx == 2 and dy == -2):
                    self.px(gx + dx, gy + dy, dark if dx * dx + dy * dy >= 4 else pad)
        if bloom:
            self.px(gx, gy, bloom)
            self.px(gx - 1, gy, shade(bloom, -20))
            self.px(gx, gy - 1, (255, 240, 160))

    def cattail(self, gx, gy, stem=(70, 120, 50), head=(110, 70, 40)):
        for dy in range(7):
            self.px(gx, gy - dy, stem)
        self.px(gx, gy - 7, head)
        self.px(gx, gy - 8, head)
        self.px(gx + 2, gy - 1, stem)
        self.px(gx + 2, gy - 2, stem)
        self.px(gx + 2, gy - 3, stem)

    def trash(self, gx, gy):
        kind = random.choice(["bottle", "can", "bag"])
        if kind == "bottle":
            for dx in range(3):
                self.px(gx + dx, gy, (150, 200, 210))
            self.px(gx + 3, gy, (230, 230, 230))
        elif kind == "can":
            self.px(gx, gy, (200, 50, 50))
            self.px(gx + 1, gy, (200, 200, 200))
            self.px(gx, gy + 1, (170, 40, 40))
        else:
            for dx, dy in [(0, 0), (1, 0), (0, 1), (1, 1), (2, 1)]:
                self.px(gx + dx, gy + dy, (225, 225, 220))

    def snow_drift(self, gx, gy, w):
        for dx in range(-w, w + 1):
            h = int((1 - (dx / (w + 1)) ** 2) * 3) + 1
            for dy in range(h):
                self.px(gx + dx, gy - dy, (250, 252, 255) if dy == h - 1 else (226, 236, 246))
            self.spx(gx + dx + 1, gy + 1, 40)

    def bones(self, gx, gy):
        bone = (236, 228, 210)
        for dx in range(-2, 3):
            self.px(gx + dx, gy, bone)
        for dx, dy in [(-3, -1), (-3, 1), (3, -1), (3, 1)]:
            self.px(gx + dx, gy + dy, bone)

    def cracks(self, n, color, length=(4, 9)):
        for _ in range(n):
            x = random.randint(0, W // P)
            y = random.randint(0, H // P)
            for _ in range(random.randint(*length)):
                if self.is_free(x * P, y * P, 1, spacing=False):
                    self.px(x, y, color)
                x += random.choice([-1, 0, 1])
                y += random.choice([0, 1])

    def finish(self, ground):
        ground = ground.filter(ImageFilter.SMOOTH_MORE)
        ground.alpha_composite(self.shadow)
        ground.alpha_composite(self.layer)
        return ground.convert("RGB")


# ---------------------------------------------------------------
# Biomes
# ---------------------------------------------------------------
def build_lake(alive):
    c = Canvas("lake")
    if alive:
        g = make_ground((68, 160, 85), (55, 142, 72), (75, 170, 80), 24)
        water, edge, shore, var = (64, 164, 214), (44, 128, 190), (214, 190, 140), (120, 200, 235)
    else:
        g = make_ground((88, 84, 62), (76, 72, 54), (98, 92, 66), 16)
        water, edge, shore, var = (88, 96, 70), (64, 70, 50), (110, 98, 72), (120, 110, 70)

    ponds = [(260, 160, 170, 105), (320, 590, 220, 115), (1080, 590, 220, 115), (1150, 165, 170, 105)]
    for (x, y, rx, ry) in ponds:
        cells = c.blob_cells(x, y, rx, ry)
        c.fill_area(cells, water, edge, rim=shore, rim_width=2, fill_var=var)
        c.placed.append((x, y, min(rx, ry)))
        inner = [cell for cell in cells if all(n in cells for n in [(cell[0] + 3, cell[1]), (cell[0] - 3, cell[1]), (cell[0], cell[1] + 3), (cell[0], cell[1] - 3)])]
        for (gx, gy) in random.sample(inner, min(len(inner), 9)):
            if alive:
                c.lily(gx, gy, (80, 170, 80), random.choice([None, (250, 170, 200), (255, 255, 255)]))
            else:
                c.trash(gx, gy)
        for (gx, gy) in random.sample(inner, min(len(inner), 14)):
            for dx in range(random.randint(2, 4)):
                c.px(gx + dx, gy, (200, 235, 250) if alive else (130, 128, 92))
        if not alive:
            # Oily scum patches
            for (gx, gy) in random.sample(inner, min(len(inner), 5)):
                for dx in range(-2, 3):
                    c.px(gx + dx, gy, (120, 90, 130))
                    c.px(gx + dx, gy + 1, (90, 120, 110))

    for (x, y, rx, ry) in ponds:
        for _ in range(8):
            a = random.uniform(0, math.tau)
            cx = int(x + math.cos(a) * (rx + 14))
            cy = int(y + math.sin(a) * (ry + 14))
            if c.is_free(cx, cy, 6, spacing=False):
                if alive:
                    c.cattail(cx // P, cy // P)
                else:
                    c.cattail(cx // P, cy // P, stem=(96, 90, 60), head=(70, 60, 50))

    if alive:
        c.scatter(10, 30, lambda gx, gy: c.round_tree(gx, gy, 7, (60, 150, 70), (36, 104, 52), (110, 196, 104)))
        c.scatter(14, 14, lambda gx, gy: c.bush(gx, gy, (72, 160, 76), (40, 110, 54), random.choice([None, (230, 80, 90)])))
        c.scatter(60, 5, lambda gx, gy: c.flower(gx, gy, random.choice([(250, 250, 250), (250, 160, 200), (180, 160, 250)])))
    else:
        c.scatter(8, 20, lambda gx, gy: c.stump(gx, gy))
        c.scatter(26, 6, lambda gx, gy: c.trash(gx, gy))
        c.scatter(10, 10, lambda gx, gy: c.bush(gx, gy, (104, 96, 60), (70, 64, 42)))
    return c.finish(g)


def build_forest(alive):
    c = Canvas("forest")
    if alive:
        g = make_ground((48, 112, 60), (40, 100, 52), (60, 130, 64), 22)
    else:
        g = make_ground((58, 52, 48), (48, 44, 40), (72, 64, 58), 14)

    if alive:
        def tree(gx, gy):
            if random.random() < 0.35:
                c.pine(gx, gy, random.randint(5, 7), (40, 120, 64), (24, 82, 44))
            else:
                c.round_tree(gx, gy, random.randint(7, 10), random.choice([(54, 140, 62), (70, 150, 60), (46, 128, 70)]), (28, 88, 44), (110, 190, 100))
        c.scatter(46, 28, tree)
        c.scatter(18, 10, lambda gx, gy: c.bush(gx, gy, (60, 140, 64), (34, 96, 48), random.choice([None, (220, 60, 70)])))

        def mushroom(gx, gy):
            c.px(gx, gy, (240, 230, 210))
            for dx in range(-1, 2):
                c.px(gx + dx, gy - 1, (210, 50, 50))
            c.px(gx, gy - 1, (250, 250, 250))
        c.scatter(30, 5, mushroom)
        c.scatter(30, 5, lambda gx, gy: c.tuft(gx, gy, (90, 170, 80), (50, 120, 56)))
    else:
        def dead_tree(gx, gy):
            if random.random() < 0.35:
                c.stump(gx, gy, (34, 28, 26), (120, 100, 84))
                c.px(gx, gy - 2, (230, 110, 40))
            else:
                trunk, edge = (30, 26, 24), (96, 86, 80)
                height = random.randint(12, 16)
                for dy in range(height):
                    c.px(gx - 1, gy - dy, edge)
                    c.px(gx, gy - dy, trunk)
                    c.px(gx + 1, gy - dy, trunk)
                    c.spx(gx + 2, gy - dy + 1, 60)
                for i in range(5):
                    c.px(gx - 1 - i, gy - height + 6 - i, trunk)
                    c.px(gx + 2 + i, gy - height + 8 - i, trunk)
                    c.px(gx - 2 - i, gy - height + 6 - i, edge)
                for dx in range(-3, 4):
                    c.px(gx + dx, gy + 1, (24, 22, 22))
        c.scatter(40, 22, dead_tree)

        def ember(gx, gy):
            c.px(gx, gy, (250, 120, 40))
            c.px(gx + 1, gy, (200, 60, 30))
            c.px(gx, gy - 1, (255, 200, 80))
        c.scatter(30, 4, ember)
        for _ in range(500):
            x, y = random.randint(0, W // P), random.randint(0, H // P)
            if c.is_free(x * P, y * P, 1, spacing=False):
                c.px(x, y, random.choice([(30, 28, 28), (110, 104, 100), (140, 134, 128)]))
    return c.finish(g)


def build_tundra(alive):
    c = Canvas("tundra")
    if alive:
        g = make_ground((190, 210, 230), (176, 198, 222), (214, 228, 244), 12, blade_range=(1, 3))
        ice, ice_edge, ice_var = (160, 210, 240), (120, 180, 220), (210, 240, 255)
    else:
        g = make_ground((150, 148, 146), (136, 134, 132), (168, 166, 162), 12, blade_range=(1, 3))
        ice, ice_edge, ice_var = (96, 110, 120), (70, 80, 88), (120, 130, 136)

    for (x, y, rx, ry) in [(300, 560, 170, 90), (1130, 190, 150, 80), (1110, 590, 140, 80)]:
        cells = c.blob_cells(x, y, rx, ry)
        c.fill_area(cells, ice, ice_edge, fill_var=ice_var)
        c.placed.append((x, y, min(rx, ry)))
        for (gx, gy) in random.sample(sorted(cells), min(len(cells), 10)):
            for d in range(random.randint(2, 4)):
                c.px(gx + d, gy - d, (240, 250, 255) if alive else (60, 66, 72))

    if alive:
        c.scatter(22, 24, lambda gx, gy: c.pine(gx, gy, random.randint(5, 7), (40, 104, 80), (24, 70, 56), snow=(245, 250, 255)))
        c.scatter(16, 18, lambda gx, gy: c.snow_drift(gx, gy, random.randint(4, 7)))
        c.scatter(12, 10, lambda gx, gy: c.rock(gx, gy, 2, (130, 140, 156)))
    else:
        c.scatter(14, 24, lambda gx, gy: c.pine(gx, gy, random.randint(4, 6), (70, 80, 66), (44, 50, 42)))
        c.scatter(14, 10, lambda gx, gy: c.rock(gx, gy, 2, (90, 90, 94)))

        def soot_puddle(gx, gy):
            for dx in range(-3, 4):
                c.px(gx + dx, gy, (60, 62, 66))
            for dx in range(-2, 3):
                c.px(gx + dx, gy - 1, (76, 78, 82))
                c.px(gx + dx, gy + 1, (76, 78, 82))
        c.scatter(20, 12, soot_puddle)
        for _ in range(700):
            x, y = random.randint(0, W // P), random.randint(0, H // P)
            if c.is_free(x * P, y * P, 1, spacing=False):
                c.px(x, y, (40, 40, 44))
    return c.finish(g)


def build_grasslands(alive):
    c = Canvas("grasslands")
    if alive:
        g = make_ground((132, 176, 76), (118, 162, 66), (150, 190, 80), 24, blade_range=(4, 9))
    else:
        g = make_ground((176, 150, 96), (162, 136, 84), (190, 160, 100), 16, blade_range=(2, 5))

    if alive:
        c.scatter(8, 34, lambda gx, gy: c.round_tree(gx, gy, 8, (88, 150, 60), (54, 108, 40), (150, 200, 96)))
        c.scatter(14, 14, lambda gx, gy: c.bush(gx, gy, (100, 160, 64), (64, 120, 44), random.choice([None, (240, 200, 60)])))
        c.scatter(160, 6, lambda gx, gy: c.tuft(gx, gy, (170, 200, 90), (100, 140, 50)))
        c.scatter(110, 4, lambda gx, gy: c.flower(gx, gy, random.choice([(250, 210, 50), (240, 110, 70), (200, 150, 240), (250, 250, 250)])))
        c.scatter(10, 9, lambda gx, gy: c.rock(gx, gy, 2, (150, 146, 136)))
    else:
        c.cracks(140, (130, 104, 66))
        c.scatter(8, 24, lambda gx, gy: c.stump(gx, gy, (100, 76, 50), (140, 112, 80)))
        c.scatter(140, 6, lambda gx, gy: c.tuft(gx, gy, (196, 170, 110), (150, 120, 76)))
        c.scatter(12, 9, lambda gx, gy: c.rock(gx, gy, 2, (150, 136, 116)))
    return c.finish(g)


def build_desert(alive):
    c = Canvas("desert")
    if alive:
        g = make_ground((242, 214, 154), (232, 202, 140), (250, 226, 170), 14, blade_range=(1, 3))
    else:
        g = make_ground((238, 210, 162), (228, 198, 150), (246, 222, 178), 14, blade_range=(1, 3))

    # Dune ripple lines
    for _ in range(160):
        x, y = random.randint(0, W // P), random.randint(0, H // P)
        for i in range(random.randint(6, 14)):
            gx, gy = x + i, y + int(math.sin(i * 0.5) * 1.5)
            if c.is_free(gx * P, gy * P, 1, spacing=False):
                c.px(gx, gy, (206, 166, 104) if alive else (206, 170, 120))

    # Oasis: lush pool vs. dried-up bed
    cells = c.blob_cells(300, 560, 160, 100)
    if alive:
        c.fill_area(cells, (70, 170, 210), (50, 136, 186), rim=(120, 170, 80), rim_width=3, fill_var=(140, 210, 235))
    else:
        c.fill_area(cells, (176, 132, 86), (150, 110, 72))
        c.cracks(40, (130, 92, 60))
    c.placed.append((300, 560, 100))

    if alive:
        def palm(gx, gy):
            for dy in range(8):
                c.px(gx + (dy // 4), gy - dy, (140, 96, 56))
            top_x, top_y = gx + 2, gy - 9
            for ang in range(0, 360, 45):
                for r in range(1, 5):
                    c.px(top_x + int(math.cos(math.radians(ang)) * r), top_y + int(math.sin(math.radians(ang)) * r * 0.7), (60, 150, 64) if r < 4 else (36, 110, 50))
            c.px(top_x, top_y, (120, 80, 40))
        for (x, y) in [(190, 470), (430, 480), (220, 680), (460, 660)]:
            if c.is_free(x, y, 4, spacing=False):
                palm(x // P, y // P)
                c.placed.append((x, y, 26))
        c.scatter(16, 18, lambda gx, gy: c.cactus(gx, gy, (90, 160, 80), (60, 120, 60), random.choice([None, (250, 120, 160)])))
        c.scatter(12, 10, lambda gx, gy: c.bush(gx, gy, (130, 160, 80), (90, 120, 56)))
        c.scatter(10, 9, lambda gx, gy: c.rock(gx, gy, 2, (190, 150, 110)))
    else:
        c.scatter(14, 18, lambda gx, gy: c.cactus(gx, gy, (150, 140, 90), (116, 104, 66)))
        c.scatter(10, 10, lambda gx, gy: c.bones(gx, gy))
        c.scatter(14, 9, lambda gx, gy: c.rock(gx, gy, 2, (170, 126, 90)))
        c.cracks(60, (190, 150, 104))
    return c.finish(g)


def build_reefs(alive):
    c = Canvas("reefs")
    if alive:
        g = make_water_ground((40, 160, 190), (34, 148, 180), (110, 214, 230), (26, 120, 156))
        sand, sand_edge = (230, 210, 160), (200, 180, 130)
    else:
        g = make_water_ground((84, 112, 122), (76, 102, 112), (130, 150, 156), (60, 80, 88))
        sand, sand_edge = (170, 162, 140), (140, 132, 112)

    for (x, y, rx, ry) in [(280, 175, 150, 100), (1130, 580, 210, 120), (300, 590, 180, 100), (1150, 170, 160, 100)]:
        cells = c.blob_cells(x, y, rx, ry)
        c.fill_area(cells, sand, sand_edge, fill_var=shade(sand, 14))

    if alive:
        palette = [((250, 110, 130), (200, 70, 100)), ((250, 160, 70), (210, 110, 40)), ((180, 110, 230), (130, 70, 180)), ((250, 220, 90), (210, 170, 50))]

        def reef(gx, gy):
            col, dark = random.choice(palette)
            if random.random() < 0.6:
                c.coral(gx, gy, col, dark)
            else:
                c.brain_coral(gx, gy, col, dark)
        c.scatter(46, 16, reef)
        c.scatter(26, 12, lambda gx, gy: c.seaweed(gx, gy, (60, 170, 90), (40, 130, 70)))
        c.scatter(22, 6, lambda gx, gy: c.fish(gx, gy, random.choice([(250, 200, 60), (250, 130, 60), (90, 200, 250), (250, 250, 250)])), spacing=False)
        c.scatter(10, 8, lambda gx, gy: c.rock(gx, gy, 2, (110, 130, 140)))
    else:
        def bleached(gx, gy):
            if random.random() < 0.6:
                c.coral(gx, gy, (232, 228, 220), (180, 176, 168))
            else:
                c.brain_coral(gx, gy, (220, 216, 206), (170, 166, 156))
        c.scatter(40, 16, bleached)
        c.scatter(14, 12, lambda gx, gy: c.seaweed(gx, gy, (110, 110, 80), (80, 80, 60)))

        def oil(gx, gy):
            for dy in range(-2, 3):
                for dx in range(-5 + abs(dy), 6 - abs(dy)):
                    c.px(gx + dx, gy + dy, random.choice([(30, 30, 36), (40, 36, 50), (34, 44, 46)]))
            c.px(gx - 1, gy - 1, (110, 80, 140))
            c.px(gx + 1, gy, (70, 120, 110))
        c.scatter(12, 18, oil)
        c.scatter(20, 6, lambda gx, gy: c.trash(gx, gy))
    return c.finish(g)


BUILDERS = {
    "lake": build_lake,
    "forest": build_forest,
    "tundra": build_tundra,
    "grasslands": build_grasslands,
    "desert": build_desert,
    "reefs": build_reefs,
}

for i, (biome, builder) in enumerate(BUILDERS.items()):
    for alive in (False, True):
        random.seed(1000 + i * 10 + int(alive))
        img = builder(alive)
        name = f"{biome}_{'flourish' if alive else 'dead'}.png"
        # Pixel art has a small palette; quantizing keeps the PNGs small
        img = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        img.save(os.path.join(public_dir, name), "PNG", optimize=True)
        print(f"Generated {name} ({W}x{H})")
