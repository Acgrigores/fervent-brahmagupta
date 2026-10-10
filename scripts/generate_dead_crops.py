import os
import math
import random
from PIL import Image, ImageDraw

public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets\crops"
dead_corn_path = os.path.join(public_dir, "crop_dead.png")

corn_img = Image.open(dead_corn_path).convert("RGBA")
W, H = corn_img.size
pix = corn_img.load()

# Create clean base tile
clean_tile = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cpix = clean_tile.load()

is_stalk = [[False]*W for _ in range(H)]
is_valid_soil = [[False]*W for _ in range(H)]

for y in range(H):
    for x in range(W):
        r, g, b, a = pix[x, y]
        if a < 30:
            continue
        dx = abs(x - 512) / 454.0
        top_soil = 315 + dx * 250.0
        if y < top_soil:
            is_stalk[y][x] = True
        elif y > 820 or (y > 700 and (x < 220 or x > 800)):
            cpix[x, y] = (r, g, b, a)
        elif r - b > 28:
            is_stalk[y][x] = True
        else:
            is_valid_soil[y][x] = True
            cpix[x, y] = (r, g, b, a)

for y in range(H):
    for x in range(W):
        if is_stalk[y][x]:
            dx = abs(x - 512) / 454.0
            top_soil = 315 + dx * 250.0
            if y < top_soil:
                continue
            found = None
            for d in range(1, 100):
                if x - d >= 0 and is_valid_soil[y][x - d]:
                    found = cpix[x - d, y]
                    break
                if x + d < W and is_valid_soil[y][x + d]:
                    found = cpix[x + d, y]
                    break
            if found:
                cpix[x, y] = found

def is_soil_pixel(x, y):
    dx = abs(x - 512) / 454.0
    top_soil = 315 + dx * 250.0
    bot_soil = 855 - dx * 290.0
    return (y >= top_soil and y <= bot_soil)

# -------------------------------------------------------------
# 1. TUNDRA: GLACIAL WINTER WHEAT (crop_tundra_dead.png)
# -------------------------------------------------------------
wheat_img = clean_tile.copy()
w_pix = wheat_img.load()
for y in range(H):
    for x in range(W):
        if is_soil_pixel(x, y):
            r, g, b, a = w_pix[x, y]
            if a > 100:
                # Frost glaze
                w_pix[x, y] = (min(255, int(r * 0.85 + 28)),
                               min(255, int(g * 0.9 + 38)),
                               min(255, int(b * 0.98 + 55)), a)

draw_w = ImageDraw.Draw(wheat_img)
random.seed(42)

wheat_nodes = []
for r_i in range(5):
    for c_i in range(5):
        u = (c_i - 2) * 115 + random.randint(-15, 15)
        v = (r_i - 2) * 70 + random.randint(-10, 10)
        cx = 512 + int(u * 0.88 - v * 0.48)
        cy = 580 + int(u * 0.48 + v * 0.88)
        if 120 < cx < 900 and 380 < cy < 790:
            wheat_nodes.append((cx, cy))
wheat_nodes.sort(key=lambda p: p[1])

for cx, cy in wheat_nodes:
    num_stalks = random.randint(6, 10)
    for _ in range(num_stalks):
        sh = random.randint(180, 280)
        bend = random.uniform(-45, 45)
        bx = cx + random.randint(-16, 16)
        by = cy + random.randint(-6, 6)
        
        p0 = (bx, by)
        p1 = (bx + bend * 0.4, by - sh * 0.5)
        p2 = (bx + bend, by - sh)
        
        straw_col = random.choice([
            (175, 155, 118, 255),
            (158, 138, 98, 255),
            (188, 172, 135, 255),
            (195, 185, 160, 255),
        ])
        
        draw_w.line([p0, p1, p2], fill=(42, 35, 22, 255), width=5)
        draw_w.line([p0, p1, p2], fill=straw_col, width=3)
        draw_w.line([(p0[0]+1, p0[1]), (p1[0]+1, p1[1]), (p2[0]+1, p2[1])], fill=(235, 242, 250, 190), width=1)
        
        head_h = random.randint(45, 75)
        head_angle = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
        
        for k in range(7):
            t = k / 6.0
            kx = p2[0] + math.cos(head_angle) * head_h * t
            ky = p2[1] + math.sin(head_angle) * head_h * t
            kw = int(math.sin(t * math.pi) * 7) + 5
            
            draw_w.ellipse([kx - kw, ky - 4, kx + kw, ky + 4], fill=straw_col, outline=(38, 30, 18, 255), width=1)
            draw_w.arc([kx - kw, ky - 4, kx + kw, ky + 4], 180, 360, fill=(240, 248, 255, 220), width=1)
            
            if k % 2 == 0:
                ax = kx + random.uniform(-25, 25)
                ay = ky - random.randint(20, 45)
                draw_w.line([(kx, ky), (ax, ay)], fill=(215, 210, 190, 210), width=1)

wheat_img.save(os.path.join(public_dir, "crop_tundra_dead.png"), "PNG")
print("Saved crop_tundra_dead.png!")

# -------------------------------------------------------------
# 2. GRASSLANDS: GIANT SUNFLOWERS (crop_grasslands_dead.png)
# -------------------------------------------------------------
sf_img = clean_tile.copy()
draw_sf = ImageDraw.Draw(sf_img)
random.seed(99)

sf_plants = [
    (380, 480, 310, -25),
    (520, 460, 330, 20),
    (660, 480, 300, 30),
    (290, 580, 280, -35),
    (460, 590, 320, -15),
    (610, 580, 310, 25),
    (740, 570, 270, 35),
    (380, 690, 260, -20),
    (540, 700, 280, 15),
    (680, 680, 250, 30),
]
sf_plants.sort(key=lambda p: p[1])

for cx, cy, h, bend in sf_plants:
    p0 = (cx, cy)
    p1 = (cx + bend * 0.35, cy - h * 0.45)
    p2 = (cx + bend * 0.85, cy - h * 0.8)
    p3 = (cx + bend * 1.25, cy - h)
    
    draw_sf.line([p0, p1, p2, p3], fill=(25, 20, 12, 255), width=12)
    draw_sf.line([p0, p1, p2, p3], fill=(62, 52, 32, 255), width=8)
    draw_sf.line([(p0[0]+1, p0[1]), (p1[0]+1, p1[1]), (p2[0]+1, p2[1])], fill=(95, 80, 48, 220), width=2)
    
    for frac in [0.3, 0.52]:
        lx = cx + bend * frac
        ly = cy - h * frac
        for sdir in [-1, 1]:
            lw = random.randint(38, 56)
            tip = (lx + sdir * lw, ly + random.randint(22, 38))
            poly = [
                (lx, ly),
                (lx + sdir * lw * 0.4, ly - 12),
                tip,
                (lx + sdir * lw * 0.5, ly + 14),
            ]
            draw_sf.polygon(poly, fill=(50, 42, 25, 255), outline=(22, 18, 10, 255))
            draw_sf.line([(lx, ly), tip], fill=(75, 62, 35, 200), width=1)
            
    hx, hy = p3
    hr = random.randint(40, 52)
    
    num_petals = 22
    for i in range(num_petals):
        ang = (i / num_petals) * 2 * math.pi
        pr = hr + random.randint(14, 26)
        px = hx + math.cos(ang) * pr
        py = hy + math.sin(ang) * (pr * 0.7) + 12
        p_col = random.choice([
            (155, 115, 30, 255),
            (130, 92, 22, 255),
            (110, 78, 18, 255),
            (85, 60, 16, 255),
        ])
        draw_sf.polygon([
            (hx + math.cos(ang - 0.12) * hr, hy + math.sin(ang - 0.12) * (hr * 0.7)),
            (px, py),
            (hx + math.cos(ang + 0.12) * hr, hy + math.sin(ang + 0.12) * (hr * 0.7)),
        ], fill=p_col, outline=(25, 18, 10, 255))
        
    rx = hr
    ry = int(hr * 0.72)
    draw_sf.ellipse([hx - rx, hy - ry, hx + rx, hy + ry], fill=(28, 20, 14, 255), outline=(15, 10, 6, 255), width=3)
    
    for _ in range(50):
        sr = random.uniform(4, hr - 6)
        sa = random.uniform(0, 2 * math.pi)
        sx = hx + math.cos(sa) * sr
        sy = hy + math.sin(sa) * (sr * 0.72)
        draw_sf.point((sx, sy), fill=(65, 50, 32, 255))

sf_img.save(os.path.join(public_dir, "crop_grasslands_dead.png"), "PNG")
print("Saved crop_grasslands_dead.png!")

# -------------------------------------------------------------
# 3. DESERT: SUGAR MELONS (crop_desert_dead.png)
# -------------------------------------------------------------
melon_img = clean_tile.copy()
m_pix = melon_img.load()
for y in range(H):
    for x in range(W):
        if is_soil_pixel(x, y):
            r, g, b, a = m_pix[x, y]
            if a > 100:
                m_pix[x, y] = (min(255, int(r * 0.98 + 42)),
                               min(255, int(g * 0.9 + 25)),
                               min(255, int(b * 0.7 + 10)), a)

# Shadow layer for proper alpha blending
shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw_shadow = ImageDraw.Draw(shadow_layer)

melons = [
    (330, 550, 42),
    (530, 500, 48),
    (720, 520, 40),
    (400, 640, 52),
    (590, 620, 56),
    (790, 600, 44),
    (470, 730, 46),
    (690, 700, 48),
    (520, 440, 36),
]
melons.sort(key=lambda m: m[1])

for mx, my, mr in melons:
    ry = int(mr * 0.8)
    draw_shadow.ellipse([mx - mr - 4, my + ry * 0.25, mx + mr + 4, my + ry + 8], fill=(0, 0, 0, 110))

melon_img = Image.alpha_composite(melon_img, shadow_layer)
draw_m = ImageDraw.Draw(melon_img)
random.seed(77)

runners = [
    [(240, 560), (350, 530), (480, 520), (620, 530), (760, 520)],
    [(290, 650), (420, 630), (550, 620), (680, 640), (810, 610)],
    [(360, 740), (490, 710), (630, 720), (750, 690), (870, 670)],
    [(380, 480), (512, 460), (660, 470), (780, 450)],
    [(350, 530), (400, 610), (460, 680)],
    [(620, 530), (650, 600), (680, 670)],
    [(480, 520), (520, 600), (550, 670)],
]

for runner in runners:
    for i in range(len(runner) - 1):
        p_a = runner[i]
        p_b = runner[i + 1]
        mid = ((p_a[0] + p_b[0]) // 2 + random.randint(-10, 10),
               (p_a[1] + p_b[1]) // 2 + random.randint(-6, 6))
        draw_m.line([p_a, mid, p_b], fill=(28, 20, 12, 255), width=8)
        draw_m.line([p_a, mid, p_b], fill=(72, 55, 30, 255), width=5)
        draw_m.line([p_a, mid, p_b], fill=(110, 85, 45, 200), width=2)
        
        tx = mid[0] + random.randint(-8, 8)
        ty = mid[1] - random.randint(8, 16)
        draw_m.arc([tx - 10, ty - 10, tx + 10, ty + 10], 0, 270, fill=(90, 70, 35, 255), width=2)
        
        for _ in range(random.randint(1, 2)):
            lx = mid[0] + random.randint(-22, 22)
            ly = mid[1] + random.randint(-10, 10)
            lw = random.randint(20, 32)
            draw_m.ellipse([lx - lw, ly - int(lw * 0.6), lx + lw, ly + int(lw * 0.6)],
                           fill=(68, 56, 32, 255), outline=(25, 20, 10, 255), width=2)

for mx, my, mr in melons:
    ry = int(mr * 0.8)
    draw_m.ellipse([mx - mr, my - ry, mx + mr, my + ry], fill=(125, 88, 42, 255), outline=(32, 22, 10, 255), width=3)
    for si in range(-3, 4):
        sx = mx + si * (mr // 4)
        draw_m.arc([sx - (mr // 3), my - ry + 2, sx + (mr // 3), my + ry - 2], 260, 100, fill=(65, 45, 20, 220), width=2)
    draw_m.line([(mx - 10, my - 5), (mx + 3, my + 3), (mx + 12, my - 3)], fill=(25, 15, 6, 255), width=3)
    draw_m.line([(mx + 3, my + 3), (mx + 7, my + 11)], fill=(25, 15, 6, 255), width=2)
    draw_m.line([(mx, my - ry), (mx + random.randint(-8, 8), my - ry - 12)], fill=(45, 32, 15, 255), width=4)

melon_img.save(os.path.join(public_dir, "crop_desert_dead.png"), "PNG")
print("Saved crop_desert_dead.png!")

# -------------------------------------------------------------
# 4. REEFS: TIDAL RICE & KELP (crop_reefs_dead.png)
# -------------------------------------------------------------
rice_img = clean_tile.copy()
r_pix = rice_img.load()
for y in range(H):
    for x in range(W):
        if is_soil_pixel(x, y):
            r, g, b, a = r_pix[x, y]
            if a > 100:
                r_pix[x, y] = (min(255, int(r * 0.48 + 18)),
                               min(255, int(g * 0.62 + 38)),
                               min(255, int(b * 0.68 + 62)), a)

# Flooded water sheen layer with proper alpha compositing
water_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw_water = ImageDraw.Draw(water_layer)
random.seed(88)

for _ in range(16):
    ox = random.randint(220, 800)
    oy = random.randint(460, 750)
    ow = random.randint(55, 130)
    oh = int(ow * 0.42)
    slick_color = random.choice([
        (120, 80, 140, 85),
        (60, 150, 140, 85),
        (130, 130, 60, 85),
    ])
    draw_water.ellipse([ox - ow, oy - oh, ox + ow, oy + oh], fill=slick_color, outline=(140, 190, 210, 110), width=1)

rice_img = Image.alpha_composite(rice_img, water_layer)
draw_r = ImageDraw.Draw(rice_img)

rice_nodes = []
for r_i in range(5):
    for c_i in range(5):
        u = (c_i - 2) * 115 + random.randint(-15, 15)
        v = (r_i - 2) * 70 + random.randint(-10, 10)
        cx = 512 + int(u * 0.88 - v * 0.48)
        cy = 580 + int(u * 0.48 + v * 0.88)
        if 100 < cx < 920 and 400 < cy < 790:
            rice_nodes.append((cx, cy))
rice_nodes.sort(key=lambda p: p[1])

for cx, cy in rice_nodes:
    draw_r.ellipse([cx - 24, cy - 7, cx + 24, cy + 7], outline=(100, 145, 165, 160), width=2)
    for _ in range(random.randint(9, 15)):
        rh = random.randint(120, 210)
        lean = random.uniform(-28, 28)
        bx = cx + random.randint(-12, 12)
        by = cy + random.randint(-5, 5)
        tx = bx + lean
        ty = by - rh
        b_col = random.choice([
            (68, 75, 42, 255),
            (88, 85, 40, 255),
            (105, 95, 48, 255),
            (42, 48, 28, 255),
            (118, 102, 52, 255),
        ])
        draw_r.line([(bx, by), (bx + lean * 0.4, by - rh * 0.55), (tx, ty)], fill=(22, 25, 14, 255), width=5)
        draw_r.line([(bx, by), (bx + lean * 0.4, by - rh * 0.55), (tx, ty)], fill=b_col, width=3)
        draw_r.line([(tx, ty), (tx + lean * 0.35, ty + 18)], fill=b_col, width=2)

for _ in range(14):
    kx = random.randint(260, 760)
    ky = random.randint(480, 740)
    pts = []
    curr_x, curr_y = kx, ky
    for s in range(5):
        curr_x += random.randint(-22, 22)
        curr_y += int(random.uniform(6, 18))
        pts.append((curr_x, curr_y))
    k_col = random.choice([
        (42, 48, 24, 240),
        (35, 40, 20, 255),
        (58, 52, 26, 230),
    ])
    draw_r.line(pts, fill=(18, 22, 10, 255), width=12)
    draw_r.line(pts, fill=k_col, width=8)
    draw_r.line(pts, fill=(85, 105, 70, 180), width=2)

rice_img.save(os.path.join(public_dir, "crop_reefs_dead.png"), "PNG")
print("Saved crop_reefs_dead.png!")

corn_img.save(os.path.join(public_dir, "crop_lake_dead.png"), "PNG")
print("Saved crop_lake_dead.png!")
