import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageColor

public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets\crops"
dead_corn_path = os.path.join(public_dir, "crop_dead.png")

# Load base image
corn_img = Image.open(dead_corn_path).convert("RGBA")
W, H = corn_img.size

# Extract pure base soil tile (inpainting / masking out corn stalks)
# We can create a clean base tile by cloning soil patches over stalk roots
soil_tile = corn_img.copy()
soil_pix = soil_tile.load()

# Mask out corn stalks:
# Stalk pixels generally satisfy: y < 750 and (r > 100 and g > 70 and b < 65) or (r > 140 and g > 90)
# Replace stalk pixels with soil texture from nearby soil pixels
print("Extracting base soil tile...")

# Build a soil palette sampler from known soil areas (e.g. x between 200 and 350, y between 600 and 750)
soil_samples = []
for y in range(550, 750):
    for x in range(250, 450):
        r, g, b, a = soil_pix[x, y]
        if a > 200 and not (r > 110 and g > 75 and b < 65):
            soil_samples.append((r, g, b, a))

if not soil_samples:
    soil_samples = [(120, 115, 110, 255), (105, 100, 95, 255), (90, 85, 80, 255)]

# Inpaint stalks above soil
base_tile = Image.new("RGBA", (W, H), (0, 0, 0, 0))
base_pix = base_tile.load()

for y in range(H):
    for x in range(W):
        r, g, b, a = soil_pix[x, y]
        if a < 30:
            continue
        
        # Check if wooden rim or bottom border
        if y > 750 or (y > 500 and (x < 200 or x > 820)):
            base_pix[x, y] = (r, g, b, a)
            continue
            
        # Is stalk? Stalks are above y=750 and have warm straw-yellow/brown color
        is_stalk = (y < 700 and r > 110 and g > 70 and b < 70 and abs(r - g) > 20)
        # Stalk tops above y=340 that are not part of soil
        if y < 320:
            is_stalk = True
            
        if is_stalk:
            # If in upper area where only stalks existed, leave transparent
            # Soil boundary is approximately diamond: top ~ y=300 at x=512, left ~ x=50, y=570, right ~ x=970, y=570, bottom ~ x=512, y=850
            # Distance inside diamond:
            dx = abs(x - 512) / 460.0
            dy = (y - 300) / 550.0
            # If outside soil diamond, it was stalk in the air -> transparent
            if y < 330 or dy < dx * 0.7:
                base_pix[x, y] = (0, 0, 0, 0)
            else:
                # Inside soil area: replace with random soil sample
                s = random.choice(soil_samples)
                # blend with slight variation
                base_pix[x, y] = s
        else:
            base_pix[x, y] = (r, g, b, a)

print("Base soil tile extracted.")

# -------------------------------------------------------------
# 1. TUNDRA: GLACIAL WINTER WHEAT (crop_tundra_dead.png)
# Dense clusters of withered, frost-covered pale straw wheat sheaves with feathery awns
# -------------------------------------------------------------
print("Generating crop_tundra_dead.png...")
wheat_img = base_tile.copy()
# Add frosty blue/white glaze to soil
w_pix = wheat_img.load()
for y in range(300, 850):
    for x in range(100, 924):
        r, g, b, a = w_pix[x, y]
        if a > 100:
            # Frost tint
            fr = int(r * 0.85 + 35)
            fg = int(g * 0.9 + 45)
            fb = int(b * 0.95 + 60)
            w_pix[x, y] = (min(255, fr), min(255, fg), min(255, fb), a)

draw_w = ImageDraw.Draw(wheat_img)
random.seed(101)

# Wheat stalks planting locations (isometric grid)
wheat_nodes = []
for row in range(5):
    for col in range(5):
        # Isometric transformation
        u = (col - 2) * 110 + random.randint(-15, 15)
        v = (row - 2) * 65 + random.randint(-10, 10)
        cx = 512 + int(u * math.cos(0.48) - v * math.sin(0.48))
        cy = 580 + int(u * math.sin(0.48) + v * math.cos(0.48))
        wheat_nodes.append((cx, cy))

# Draw wheat clusters (sort by Y for correct isometric depth)
wheat_nodes.sort(key=lambda p: p[1])

for cx, cy in wheat_nodes:
    # Cluster of 7-12 stalks
    num_stalks = random.randint(7, 12)
    for _ in range(num_stalks):
        stalk_h = random.randint(180, 290)
        lean = random.uniform(-35, 35)
        
        # Stalk base
        bx = cx + random.randint(-20, 20)
        by = cy + random.randint(-8, 8)
        
        # Curve points
        mid_x = bx + lean * 0.4 + random.randint(-8, 8)
        mid_y = by - stalk_h * 0.5
        top_x = bx + lean + random.randint(-12, 12)
        top_y = by - stalk_h
        
        # Colors: withered pale golden straw with frosty edges
        stalk_color = random.choice([
            (168, 148, 115, 255),
            (150, 130, 98, 255),
            (185, 168, 130, 255),
            (138, 120, 92, 255),
            (195, 185, 160, 255), # frost dusted
        ])
        
        # Draw stalk stem
        draw_w.line([(bx, by), (mid_x, mid_y), (top_x, top_y)], fill=stalk_color, width=random.randint(3, 5))
        # Highlight
        draw_w.line([(bx+1, by), (mid_x+1, mid_y), (top_x+1, top_y)], fill=(220, 225, 230, 180), width=1)
        
        # Wheat head (ear/spike) at top
        head_len = random.randint(45, 75)
        head_angle = math.atan2(top_y - mid_y, top_x - mid_x)
        
        # Draw segmented grain kernels
        for step in range(8):
            t = step / 7.0
            gx = top_x + math.cos(head_angle) * head_len * t
            gy = top_y + math.sin(head_angle) * head_len * t
            kernel_w = int(math.sin(t * math.pi) * 8) + 4
            
            # Kernel oval
            draw_w.ellipse([gx - kernel_w, gy - 4, gx + kernel_w, gy + 4], fill=stalk_color, outline=(90, 75, 55, 255))
            
            # Frost rim on top
            draw_w.arc([gx - kernel_w, gy - 4, gx + kernel_w, gy + 4], 180, 360, fill=(235, 245, 255, 230), width=1)
            
            # Bristly awns (long thin beards extending from wheat head)
            if step % 2 == 0:
                awn_len = random.randint(25, 50)
                awn_angle = head_angle + random.uniform(-0.8, 0.8)
                ax2 = gx + math.cos(awn_angle) * awn_len
                ay2 = gy + math.sin(awn_angle) * awn_len - 15
                draw_w.line([(gx, gy), (ax2, ay2)], fill=(210, 205, 185, 200), width=1)

# Save wheat image
wheat_img.save(os.path.join(public_dir, "crop_tundra_dead.png"), "PNG")
print("Saved crop_tundra_dead.png!")

# -------------------------------------------------------------
# 2. GRASSLANDS: GIANT SUNFLOWERS (crop_grasslands_dead.png)
# Sturdy tall withered stalks with massive drooping blackened sunflower heads
# -------------------------------------------------------------
print("Generating crop_grasslands_dead.png...")
sf_img = base_tile.copy()
draw_sf = ImageDraw.Draw(sf_img)
random.seed(202)

sf_nodes = [
    (340, 520, 320),
    (480, 470, 350),
    (640, 500, 340),
    (270, 620, 290),
    (440, 630, 330),
    (580, 610, 310),
    (740, 600, 280),
    (380, 720, 260),
    (540, 730, 280),
    (670, 710, 260),
]
sf_nodes.sort(key=lambda p: p[1])

for cx, cy, h in sf_nodes:
    # Sturdy thick stem (dark olive/brown withered)
    stem_color = (65, 55, 35, 255)
    stem_w = random.randint(9, 13)
    
    # Bottom to top with gentle heavy bend towards top
    bend = random.choice([-30, 30, -20, 25])
    p0 = (cx, cy)
    p1 = (cx + bend * 0.3, cy - h * 0.4)
    p2 = (cx + bend * 0.8, cy - h * 0.75)
    p3 = (cx + bend * 1.3, cy - h)
    
    # Shadow under sunflower base
    draw_sf.ellipse([cx - 24, cy - 8, cx + 24, cy + 8], fill=(0, 0, 0, 80))
    
    # Stem segments
    draw_sf.line([p0, p1, p2, p3], fill=stem_color, width=stem_w)
    draw_sf.line([(p0[0]+2, p0[1]), (p1[0]+2, p1[1]), (p2[0]+2, p2[1]), (p3[0]+2, p3[1])], fill=(95, 80, 50, 200), width=2)
    
    # Wilted drooping broad leaves along stem
    for ly in [0.35, 0.55]:
        lx = cx + bend * ly
        leaf_y = cy - h * ly
        for ldir in [-1, 1]:
            lw = random.randint(35, 55)
            # Drooping curve
            l_tip = (lx + ldir * lw, leaf_y + random.randint(20, 40))
            draw_sf.polygon([
                (lx, leaf_y),
                (lx + ldir * (lw * 0.5), leaf_y - 10),
                l_tip,
                (lx + ldir * (lw * 0.4), leaf_y + 15),
            ], fill=(55, 48, 30, 240), outline=(35, 30, 20, 255))
    
    # MASSIVE DROOPING SUNFLOWER HEAD AT TOP
    head_cx, head_cy = p3
    head_r = random.randint(38, 52)
    
    # Withered dried petal rays (curling, broken, brownish-yellow)
    num_petals = 24
    for i in range(num_petals):
        angle = (i / num_petals) * 2 * math.pi
        pr = head_r + random.randint(14, 28)
        px = head_cx + math.cos(angle) * pr
        py = head_cy + math.sin(angle) * (pr * 0.7) + random.randint(5, 15) # drooping downward
        petal_color = random.choice([
            (160, 120, 35, 230),
            (135, 95, 25, 230),
            (115, 80, 20, 230),
            (85, 60, 20, 230),
        ])
        draw_sf.polygon([
            (head_cx + math.cos(angle - 0.1) * head_r, head_cy + math.sin(angle - 0.1) * (head_r * 0.7)),
            (px, py),
            (head_cx + math.cos(angle + 0.1) * head_r, head_cy + math.sin(angle + 0.1) * (head_r * 0.7)),
        ], fill=petal_color, outline=(45, 35, 15, 255))
        
    # Large central seed disc (blackened, dried, textured)
    disc_rx = head_r
    disc_ry = int(head_r * 0.72)
    draw_sf.ellipse([head_cx - disc_rx, head_cy - disc_ry, head_cx + disc_rx, head_cy + disc_ry], 
                   fill=(32, 24, 18, 255), outline=(20, 14, 10, 255), width=3)
                   
    # Inner dried seed spiral texture
    for _ in range(45):
        s_rad = random.uniform(3, head_r - 6)
        s_ang = random.uniform(0, 2 * math.pi)
        sx = head_cx + math.cos(s_ang) * s_rad
        sy = head_cy + math.sin(s_ang) * (s_rad * 0.72)
        draw_sf.point((sx, sy), fill=(70, 55, 35, 255))
        draw_sf.point((sx+1, sy), fill=(50, 38, 25, 255))

sf_img.save(os.path.join(public_dir, "crop_grasslands_dead.png"), "PNG")
print("Saved crop_grasslands_dead.png!")

# -------------------------------------------------------------
# 3. DESERT: SUGAR MELONS (crop_desert_dead.png)
# Tangled creeping ground vines across parched soil with shriveled, cracked melons lying on the dirt
# -------------------------------------------------------------
print("Generating crop_desert_dead.png...")
melon_img = base_tile.copy()
# Tint soil more dusty desert amber/sand
m_pix = melon_img.load()
for y in range(300, 850):
    for x in range(100, 924):
        r, g, b, a = m_pix[x, y]
        if a > 100:
            # Desert sand tint
            mr = int(r * 0.95 + 40)
            mg = int(g * 0.9 + 25)
            mb = int(b * 0.7 + 10)
            m_pix[x, y] = (min(255, mr), min(255, mg), min(255, mb), a)

draw_m = ImageDraw.Draw(melon_img)
random.seed(303)

# Draw ground melon vines crawling horizontally across the isometric plane
vine_paths = [
    # Main vine runners spreading across the plot
    [(220, 580), (320, 550), (450, 530), (600, 540), (750, 520)],
    [(280, 680), (410, 640), (530, 620), (680, 650), (820, 600)],
    [(350, 760), (480, 720), (620, 730), (740, 700), (860, 680)],
    [(380, 480), (512, 450), (650, 460), (780, 440)],
    # Cross branch runners
    [(320, 550), (360, 620), (420, 680)],
    [(600, 540), (630, 610), (660, 700)],
    [(450, 530), (490, 610), (520, 690)],
]

for path in vine_paths:
    for i in range(len(path) - 1):
        p_start = path[i]
        p_end = path[i + 1]
        # Tangled jittery ground runner
        mid = ((p_start[0] + p_end[0]) // 2 + random.randint(-12, 12),
               (p_start[1] + p_end[1]) // 2 + random.randint(-8, 8))
        draw_m.line([p_start, mid, p_end], fill=(68, 52, 28, 255), width=random.randint(6, 9))
        draw_m.line([p_start, mid, p_end], fill=(105, 82, 42, 200), width=2)
        
        # Curling dried tendrils
        tx = mid[0] + random.randint(-10, 10)
        ty = mid[1] + random.randint(-15, -5)
        draw_m.arc([tx - 12, ty - 12, tx + 12, ty + 12], 0, 270, fill=(90, 70, 35, 230), width=2)
        
        # Withered broad melon leaves on ground
        for _ in range(random.randint(1, 3)):
            lx = mid[0] + random.randint(-25, 25)
            ly = mid[1] + random.randint(-15, 15)
            lw = random.randint(22, 34)
            draw_m.ellipse([lx - lw, ly - int(lw * 0.6), lx + lw, ly + int(lw * 0.6)],
                           fill=(75, 62, 35, 240), outline=(45, 36, 20, 255), width=2)

# SHRIEVELED DRY CRACKED MELONS on the soil!
melons = [
    (310, 560, 42),
    (520, 510, 48),
    (710, 530, 40),
    (390, 650, 52),
    (580, 630, 55),
    (780, 620, 44),
    (460, 740, 46),
    (680, 720, 48),
    (510, 440, 38),
]
melons.sort(key=lambda m: m[1])

for mx, my, mr in melons:
    # Ground shadow
    draw_m.ellipse([mx - mr - 6, my + mr * 0.3 - 4, mx + mr + 6, my + mr * 0.5 + 8], fill=(0, 0, 0, 120))
    
    # Shriveled melon body (irregular withered oval)
    ry = int(mr * 0.8)
    melon_base_col = random.choice([
        (135, 95, 45, 255),
        (120, 85, 38, 255),
        (145, 105, 50, 255),
    ])
    draw_m.ellipse([mx - mr, my - ry, mx + mr, my + ry], fill=melon_base_col, outline=(55, 38, 18, 255), width=3)
    
    # Dried cracked rind stripes
    for stripe_i in range(-3, 4):
        sx = mx + stripe_i * (mr // 4)
        draw_m.arc([sx - (mr // 3), my - ry + 2, sx + (mr // 3), my + ry - 2], 260, 100, fill=(75, 52, 25, 220), width=2)
        
    # Cracks in the withered melon (parched drought burst)
    draw_m.line([(mx - 8, my - 6), (mx + 4, my + 2), (mx + 12, my - 4)], fill=(40, 25, 12, 255), width=3)
    draw_m.line([(mx + 2, my + 3), (mx + 6, my + 10)], fill=(40, 25, 12, 255), width=2)
    
    # Withered brown melon stem on top
    draw_m.line([(mx, my - ry), (mx + random.randint(-10, 10), my - ry - 14)], fill=(60, 45, 22, 255), width=4)

melon_img.save(os.path.join(public_dir, "crop_desert_dead.png"), "PNG")
print("Saved crop_desert_dead.png!")

# -------------------------------------------------------------
# 4. REEFS: TIDAL RICE & KELP (crop_reefs_dead.png)
# Flooded waterlogged mud with murky polluted dark tidal water, dead flooded rice grasses & tangled brown kelp ribbons
# -------------------------------------------------------------
print("Generating crop_reefs_dead.png...")
rice_img = base_tile.copy()
# Flooded murky polluted water glaze over soil
r_pix = rice_img.load()
for y in range(300, 850):
    for x in range(100, 924):
        r, g, b, a = r_pix[x, y]
        if a > 100:
            # Polluted murky water & oil slick tint
            pr = int(r * 0.5 + 20)
            pg = int(g * 0.65 + 40)
            pb = int(b * 0.6 + 55)
            r_pix[x, y] = (min(255, pr), min(255, pg), min(255, pb), a)

draw_r = ImageDraw.Draw(rice_img)
random.seed(404)

# Draw murky flooded water patches with toxic rainbow oil sheen
oil_colors = [
    (110, 90, 130, 140), # purple slick
    (70, 140, 130, 140), # cyan slick
    (130, 130, 70, 140), # yellow oil
]
for _ in range(12):
    ox = random.randint(250, 780)
    oy = random.randint(480, 750)
    ow = random.randint(60, 140)
    oh = int(ow * 0.45)
    draw_r.ellipse([ox - ow, oy - oh, ox + ow, oy + oh], fill=random.choice(oil_colors))

# Clumps of flooded dying tidal rice stalks (submerged in mud, blackened tips)
rice_clumps = []
for row in range(5):
    for col in range(5):
        u = (col - 2) * 115 + random.randint(-15, 15)
        v = (row - 2) * 65 + random.randint(-10, 10)
        cx = 512 + int(u * math.cos(0.48) - v * math.sin(0.48))
        cy = 580 + int(u * math.sin(0.48) + v * math.cos(0.48))
        rice_clumps.append((cx, cy))
rice_clumps.sort(key=lambda p: p[1])

for cx, cy in rice_clumps:
    # Water ripple ring around base of rice clump
    draw_r.ellipse([cx - 28, cy - 8, cx + 28, cy + 8], outline=(120, 160, 175, 180), width=2)
    
    # 8-15 thin rice grass stalks emerging from water
    for _ in range(random.randint(8, 14)):
        rh = random.randint(120, 200)
        lean = random.uniform(-30, 30)
        bx = cx + random.randint(-14, 14)
        by = cy + random.randint(-5, 5)
        tx = bx + lean
        ty = by - rh
        
        # Discolored brown/yellow/blackened flooded rice blade
        blade_col = random.choice([
            (70, 75, 45, 255),
            (90, 85, 40, 255),
            (110, 95, 50, 255),
            (45, 50, 30, 255),
            (125, 105, 55, 255),
        ])
        draw_r.line([(bx, by), (bx + lean * 0.4, by - rh * 0.6), (tx, ty)], fill=blade_col, width=random.randint(2, 4))
        
        # Drooping grains at top
        draw_r.line([(tx, ty), (tx + lean * 0.3, ty + 15)], fill=(120, 100, 50, 240), width=2)

# Tangled ribbons of slimy dying kelp fronds draped across the flooded water
for _ in range(16):
    kx = random.randint(280, 750)
    ky = random.randint(460, 740)
    k_len = random.randint(60, 120)
    
    # Ribbon curve
    pts = []
    curr_x, curr_y = kx, ky
    for step in range(5):
        curr_x += random.randint(-25, 25)
        curr_y += int(random.uniform(5, 20))
        pts.append((curr_x, curr_y))
        
    kelp_col = random.choice([
        (48, 52, 28, 230),
        (38, 42, 22, 240),
        (65, 58, 30, 220),
    ])
    draw_r.line(pts, fill=kelp_col, width=random.randint(7, 12))
    # Shiny slimy reflection highlight
    draw_r.line(pts, fill=(90, 110, 80, 160), width=2)

rice_img.save(os.path.join(public_dir, "crop_reefs_dead.png"), "PNG")
print("Saved crop_reefs_dead.png!")

# Also ensure crop_lake_dead.png is saved
corn_img.save(os.path.join(public_dir, "crop_lake_dead.png"), "PNG")
print("Saved crop_lake_dead.png!")
print("ALL 6 DEAD CROPS GENERATED SUCCESSFULLY!")
