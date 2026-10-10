import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets"
crops_dir = os.path.join(public_dir, "crops")
sprites_dir = os.path.join(public_dir, "sprites")

os.makedirs(crops_dir, exist_ok=True)
os.makedirs(sprites_dir, exist_ok=True)

# ==============================================================
# 1. GLOW AURA (Radial golden glow texture for hover effects)
# ==============================================================
def generate_glow_aura():
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    center = size / 2.0
    radius = size * 0.46
    pix = img.load()

    for y in range(size):
        for x in range(size):
            dx = x - center
            dy = y - center
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < radius:
                factor = 1.0 - (dist / radius)
                # Smooth cubic falloff
                alpha = int(255 * (factor * factor * (3.0 - 2.0 * factor)))
                # Radiant golden warm amber tone
                pix[x, y] = (255, 235, 120, alpha)

    out_path = os.path.join(sprites_dir, "glow_aura.png")
    img.save(out_path, "PNG")
    print(f"Saved {out_path}")

# ==============================================================
# 2. BABY CROP / SPROUTS (Re-planted baby version that takes 20m)
# ==============================================================
def generate_baby_crop():
    # Load dead crop as isometric base tile template
    flourish_path = os.path.join(crops_dir, "crop_flourish.png")
    dead_path = os.path.join(crops_dir, "crop_dead.png")
    
    base_src = Image.open(flourish_path if os.path.exists(flourish_path) else dead_path).convert("RGBA")
    w, h = base_src.size
    pix = base_src.load()

    # Create baby crop tile: rich, freshly tilled, dark moist soil with baby green seedlings
    baby_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bpix = baby_img.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = pix[x, y]
            if a < 30:
                continue
            dx = abs(x - (w / 2.0)) / (w * 0.44)
            top_soil = int(h * 0.32 + dx * (h * 0.24))
            bot_soil = int(h * 0.85 - dx * (h * 0.28))

            # Outside soil planter: keep wooden box frame intact
            if y > h * 0.78 or y < top_soil or (y > bot_soil and (x < w * 0.22 or x > w * 0.78)):
                if y > top_soil - 40:
                    bpix[x, y] = (r, g, b, a)
            elif y >= top_soil and y <= bot_soil:
                # Freshly tilled fertile dark moist planting soil
                brightness = (r + g + b) / 3.0
                factor = brightness / 255.0
                nr = int(68 * factor + 42)
                ng = int(48 * factor + 30)
                nb = int(28 * factor + 18)
                bpix[x, y] = (nr, ng, nb, a)

    # Now draw cute baby sprouts popping out of soil
    draw = ImageDraw.Draw(baby_img)
    random.seed(1337)

    # Grid of isometric planting rows
    sprout_nodes = []
    for r_i in range(5):
        for c_i in range(5):
            u = (c_i - 2) * 110 + random.randint(-12, 12)
            v = (r_i - 2) * 65 + random.randint(-8, 8)
            cx = int(w * 0.5 + (u * 0.88 - v * 0.48))
            cy = int(h * 0.58 + (u * 0.48 + v * 0.88))
            dx = abs(cx - (w / 2.0)) / (w * 0.44)
            top_soil = int(h * 0.33 + dx * (h * 0.24))
            bot_soil = int(h * 0.82 - dx * (h * 0.28))
            if top_soil + 15 < cy < bot_soil - 15 and 140 < cx < w - 140:
                sprout_nodes.append((cx, cy))

    # Draw small baby sprouts at each node
    for cx, cy in sprout_nodes:
        # Small mound of dark soil
        draw.ellipse((cx - 16, cy - 6, cx + 16, cy + 6), fill=(45, 30, 16, 230))
        
        # Tiny delicate stem
        stem_h = random.randint(28, 46)
        draw.line([(cx, cy), (cx, cy - stem_h)], fill=(74, 222, 128, 255), width=4)
        draw.line([(cx + 1, cy), (cx + 1, cy - stem_h)], fill=(187, 247, 208, 255), width=2)
        
        # Pair of tiny baby cotyledon leaves unfolding
        lx1, ly1 = cx - 14, cy - stem_h - 4
        lx2, ly2 = cx + 14, cy - stem_h - 4
        draw.ellipse((lx1 - 6, ly1 - 6, lx1 + 8, ly1 + 6), fill=(34, 197, 94, 255), outline=(22, 101, 52, 255), width=2)
        draw.ellipse((lx2 - 8, ly2 - 6, lx2 + 6, ly2 + 6), fill=(74, 222, 128, 255), outline=(22, 101, 52, 255), width=2)
        
        # Dewdrop sparkle on leaf tip
        draw.ellipse((lx2 - 2, ly2 - 7, lx2 + 3, ly2 - 2), fill=(255, 255, 255, 230))

    # Add a cute little wooden garden plant stake with "🌱 BABY" marker
    sx, sy = int(w * 0.35), int(h * 0.48)
    draw.line([(sx, sy), (sx, sy + 55)], fill=(120, 75, 40, 255), width=5)
    draw.rectangle((sx - 28, sy - 24, sx + 28, sy), fill=(254, 240, 138, 255), outline=(113, 63, 18, 255), width=2)
    # Mini seedling icon on stake
    draw.ellipse((sx - 6, sy - 18, sx + 6, sy - 8), fill=(34, 197, 94, 255))
    draw.line([(sx, sy - 8), (sx, sy - 2)], fill=(22, 101, 52, 255), width=2)

    out_path = os.path.join(crops_dir, "crop_baby.png")
    baby_img.save(out_path, "PNG", optimize=True)
    print(f"Saved {out_path}")

# ==============================================================
# 3. WINDMILL TOWER & BLADES (High-res, transparent PNGs, NO polygons!)
# ==============================================================
def generate_windmill_assets():
    # A) Windmill Tower (400x520)
    tw, th = 400, 520
    tower_img = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(tower_img)

    # Soft ground drop shadow
    tdraw.ellipse((tw * 0.15, th * 0.88, tw * 0.85, th * 0.98), fill=(0, 0, 0, 80))

    # Tapered rustic stone & timber windmill tower body
    # Base: from y=200 down to y=480
    body_pts = [
        (tw * 0.32, th * 0.36),  # top left
        (tw * 0.68, th * 0.36),  # top right
        (tw * 0.78, th * 0.90),  # bot right
        (tw * 0.22, th * 0.90),  # bot left
    ]
    tdraw.polygon(body_pts, fill=(235, 230, 218, 255), outline=(62, 35, 18, 255), width=4)

    # Red brick / fieldstone base skirting
    skirt_pts = [
        (tw * 0.24, th * 0.76),
        (tw * 0.76, th * 0.76),
        (tw * 0.78, th * 0.90),
        (tw * 0.22, th * 0.90),
    ]
    tdraw.polygon(skirt_pts, fill=(168, 75, 45, 255), outline=(62, 35, 18, 255), width=3)
    # Brick mortar texture
    for by in range(int(th * 0.78), int(th * 0.89), 12):
        tdraw.line([(tw * 0.23, by), (tw * 0.77, by)], fill=(120, 50, 30, 255), width=2)
        offset = 12 if (by // 12) % 2 == 0 else 0
        for bx in range(int(tw * 0.26) + offset, int(tw * 0.74), 24):
            tdraw.line([(bx, by), (bx, by + 12)], fill=(120, 50, 30, 255), width=2)

    # Timber horizontal decorative belts
    for belt_y in [int(th * 0.48), int(th * 0.63)]:
        dx1 = tw * 0.32 + (belt_y - th * 0.36) / (th * 0.54) * (tw * 0.22 - tw * 0.32)
        dx2 = tw * 0.68 + (belt_y - th * 0.36) / (th * 0.54) * (tw * 0.78 - tw * 0.68)
        tdraw.rectangle((dx1 - 4, belt_y - 6, dx2 + 4, belt_y + 6), fill=(105, 60, 30, 255), outline=(48, 25, 12, 255), width=2)

    # Timber arched entrance door at base
    door_box = (tw * 0.43, th * 0.74, tw * 0.57, th * 0.90)
    tdraw.rectangle(door_box, fill=(90, 50, 25, 255), outline=(45, 22, 10, 255), width=3)
    tdraw.ellipse((tw * 0.43, th * 0.70, tw * 0.57, th * 0.78), fill=(90, 50, 25, 255), outline=(45, 22, 10, 255), width=3)
    # Brass door handle
    tdraw.ellipse((tw * 0.53, th * 0.82, tw * 0.55, th * 0.84), fill=(250, 204, 21, 255))

    # Cozy mullioned viewing window on 2nd floor
    win_box = (tw * 0.45, th * 0.52, tw * 0.55, th * 0.60)
    tdraw.rectangle(win_box, fill=(186, 230, 253, 255), outline=(45, 22, 10, 255), width=3)
    tdraw.line([(tw * 0.50, th * 0.52), (tw * 0.50, th * 0.60)], fill=(45, 22, 10, 255), width=2)
    tdraw.line([(tw * 0.45, th * 0.56), (tw * 0.55, th * 0.56)], fill=(45, 22, 10, 255), width=2)

    # Conical / Domed Dutch Timber Cap (Roof)
    roof_pts = [
        (tw * 0.28, th * 0.36),
        (tw * 0.50, th * 0.16),  # apex
        (tw * 0.72, th * 0.36),
    ]
    tdraw.polygon(roof_pts, fill=(140, 55, 35, 255), outline=(50, 20, 10, 255), width=4)
    # Shingle lines on cap
    for sy in range(int(th * 0.20), int(th * 0.36), 10):
        tdraw.line([(tw * 0.50 - (sy - th * 0.16) * 1.3, sy), (tw * 0.50 + (sy - th * 0.16) * 1.3, sy)], fill=(100, 35, 20, 255), width=2)

    # Rotor hub mount box at roof center
    tdraw.rectangle((tw * 0.45, th * 0.26, tw * 0.55, th * 0.34), fill=(75, 42, 20, 255), outline=(40, 20, 8, 255), width=3)
    tdraw.ellipse((tw * 0.46, th * 0.27, tw * 0.54, th * 0.33), fill=(160, 160, 160, 255), outline=(40, 40, 40, 255), width=2)

    tower_path = os.path.join(sprites_dir, "windmill_tower.png")
    tower_img.save(tower_path, "PNG", optimize=True)
    print(f"Saved {tower_path}")

    # B) Windmill Blades (450x450, Centered Rotor Hub for Smooth 360 Rotation!)
    bw, bh = 450, 450
    blades_img = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(blades_img)
    cx, cy = bw / 2.0, bh / 2.0

    # Draw 4 grand aerodynamic windmill sails / blades at 90 degree intervals
    blade_length = 190
    blade_width = 34

    for angle_deg in [0, 90, 180, 270]:
        rad = math.radians(angle_deg)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        perp_cos = -sin_a
        perp_sin = cos_a

        # Central spar beam
        start_x = cx + cos_a * 15
        start_y = cy + sin_a * 15
        end_x = cx + cos_a * blade_length
        end_y = cy + sin_a * blade_length

        # Sturdy main wooden spar
        bdraw.line([(start_x, start_y), (end_x, end_y)], fill=(85, 45, 18, 255), width=6)

        # Lattice sail canvas on the trailing side
        sail_start_dist = 40
        sail_end_dist = blade_length - 8
        num_bars = 9

        for step in range(num_bars):
            dist = sail_start_dist + (sail_end_dist - sail_start_dist) * (step / (num_bars - 1))
            bar_start_x = cx + cos_a * dist
            bar_start_y = cy + sin_a * dist
            bar_end_x = bar_start_x + perp_cos * blade_width
            bar_end_y = bar_start_y + perp_sin * blade_width

            # Crossbar
            bdraw.line([(bar_start_x, bar_start_y), (bar_end_x, bar_end_y)], fill=(120, 70, 30, 255), width=3)

        # Outer edge framing rail
        r1_x = cx + cos_a * sail_start_dist + perp_cos * blade_width
        r1_y = cy + sin_a * sail_start_dist + perp_sin * blade_width
        r2_x = cx + cos_a * sail_end_dist + perp_cos * blade_width
        r2_y = cy + sin_a * sail_end_dist + perp_sin * blade_width
        bdraw.line([(r1_x, r1_y), (r2_x, r2_y)], fill=(100, 55, 22, 255), width=3)

        # Semitransparent white canvas sail cloth panels
        sail_pts = [
            (cx + cos_a * sail_start_dist, cy + sin_a * sail_start_dist),
            (r1_x, r1_y),
            (r2_x, r2_y),
            (cx + cos_a * sail_end_dist, cy + sin_a * sail_end_dist),
        ]
        bdraw.polygon(sail_pts, fill=(255, 253, 240, 205), outline=(180, 160, 130, 255), width=2)

    # Heavy iron rotor hub at exact center (cx, cy)
    bdraw.ellipse((cx - 26, cy - 26, cx + 26, cy + 26), fill=(60, 60, 65, 255), outline=(20, 20, 25, 255), width=4)
    bdraw.ellipse((cx - 16, cy - 16, cx + 16, cy + 16), fill=(160, 165, 175, 255), outline=(40, 40, 45, 255), width=3)
    bdraw.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=(245, 190, 40, 255))

    blades_path = os.path.join(sprites_dir, "windmill_blades.png")
    blades_img.save(blades_path, "PNG", optimize=True)
    print(f"Saved {blades_path}")

# ==============================================================
# 4. CUSTOMER / BUYER SPRITE (Sprightly merchant visitor sprite)
# ==============================================================
def generate_buyer_sprite():
    # Size 320x420
    bw, bh = 320, 420
    img = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = bw / 2.0

    # Soft oval shadow at feet
    draw.ellipse((cx - 50, bh - 35, cx + 50, bh - 10), fill=(0, 0, 0, 75))

    # Boots (sturdy brown travelling boots)
    draw.rectangle((cx - 36, bh - 55, cx - 12, bh - 24), fill=(65, 38, 18, 255), outline=(32, 16, 8, 255), width=3)
    draw.ellipse((cx - 42, bh - 32, cx - 10, bh - 20), fill=(65, 38, 18, 255), outline=(32, 16, 8, 255), width=2)
    draw.rectangle((cx + 12, bh - 55, cx + 36, bh - 24), fill=(65, 38, 18, 255), outline=(32, 16, 8, 255), width=3)
    draw.ellipse((cx + 10, bh - 32, cx + 42, bh - 20), fill=(65, 38, 18, 255), outline=(32, 16, 8, 255), width=2)

    # Trousers (slate blue traveller's denim pants)
    draw.rectangle((cx - 38, bh - 140, cx - 10, bh - 50), fill=(43, 76, 126, 255), outline=(20, 35, 60, 255), width=3)
    draw.rectangle((cx + 10, bh - 140, cx + 38, bh - 50), fill=(43, 76, 126, 255), outline=(20, 35, 60, 255), width=3)

    # Merchant Vest / Tunic (emerald green linen vest with brass buttons)
    draw.rectangle((cx - 48, bh - 240, cx + 48, bh - 135), fill=(21, 128, 61, 255), outline=(10, 55, 25, 255), width=4)
    # White undershirt / collar
    draw.polygon([(cx - 24, bh - 240), (cx, bh - 205), (cx + 24, bh - 240)], fill=(255, 253, 245, 255), outline=(100, 90, 80, 255), width=2)
    # Golden brass buttons down vest
    for btn_y in [bh - 195, bh - 170, bh - 148]:
        draw.ellipse((cx - 5, btn_y - 5, cx + 5, btn_y + 5), fill=(250, 204, 21, 255), outline=(161, 98, 7, 255), width=2)

    # Leather Messenger Satchel with Coin Buckle (for carrying coins & buying crops!)
    draw.rectangle((cx + 28, bh - 170, cx + 78, bh - 110), fill=(146, 64, 14, 255), outline=(69, 26, 3, 255), width=3)
    draw.polygon([(cx + 28, bh - 170), (cx + 53, bh - 145), (cx + 78, bh - 170)], fill=(180, 83, 9, 255), outline=(69, 26, 3, 255), width=2)
    draw.ellipse((cx + 48, bh - 148, cx + 58, bh - 138), fill=(250, 204, 21, 255))  # brass buckle
    # Shoulder strap across torso
    draw.line([(cx - 48, bh - 235), (cx + 38, bh - 165)], fill=(120, 53, 15, 255), width=6)

    # Left hand holding a small coin pouch
    draw.ellipse((cx - 62, bh - 165, cx - 42, bh - 145), fill=(245, 185, 135, 255), outline=(140, 75, 45, 255), width=2)
    draw.ellipse((cx - 68, bh - 150, cx - 45, bh - 120), fill=(217, 119, 6, 255), outline=(120, 53, 15, 255), width=2)

    # Friendly head & cheerful merchant face
    head_box = (cx - 42, bh - 325, cx + 42, bh - 245)
    draw.ellipse(head_box, fill=(253, 205, 160, 255), outline=(130, 70, 40, 255), width=3)
    # Rosy cheeks
    draw.ellipse((cx - 32, bh - 275, cx - 18, bh - 263), fill=(254, 155, 155, 180))
    draw.ellipse((cx + 18, bh - 275, cx + 32, bh - 263), fill=(254, 155, 155, 180))
    # Big sparkling happy eyes
    draw.ellipse((cx - 24, bh - 292, cx - 12, bh - 275), fill=(25, 25, 30, 255))
    draw.ellipse((cx - 20, bh - 290, cx - 14, bh - 282), fill=(255, 255, 255, 255))
    draw.ellipse((cx + 12, bh - 292, cx + 24, bh - 275), fill=(25, 25, 30, 255))
    draw.ellipse((cx + 16, bh - 290, cx + 22, bh - 282), fill=(255, 255, 255, 255))
    # Cheerful wide smile
    draw.arc((cx - 16, bh - 272, cx + 16, bh - 250), start=10, end=170, fill=(120, 45, 25, 255), width=3)

    # Stylish Merchant Beret / Cap with bright peacock feather
    cap_box = (cx - 54, bh - 355, cx + 54, bh - 315)
    draw.ellipse(cap_box, fill=(180, 83, 9, 255), outline=(69, 26, 3, 255), width=3)
    draw.ellipse((cx - 44, bh - 365, cx + 44, bh - 325), fill=(217, 119, 6, 255), outline=(69, 26, 3, 255), width=3)
    # Golden brim band
    draw.arc(cap_box, start=0, end=180, fill=(250, 204, 21, 255), width=4)
    # Bright feather quill in cap
    draw.line([(cx + 25, bh - 340), (cx + 52, bh - 385)], fill=(14, 165, 233, 255), width=5)
    draw.line([(cx + 25, bh - 340), (cx + 52, bh - 385)], fill=(56, 189, 248, 255), width=3)

    buyer_path = os.path.join(sprites_dir, "buyer.png")
    img.save(buyer_path, "PNG", optimize=True)
    print(f"Saved {buyer_path}")

# ==============================================================
# 5. GROWN CROP PRODUCE ITEM ICONS (Produced upon harvesting!)
# ==============================================================
def generate_produce_icons():
    crops = {
        "corn": {"bg": (254, 240, 138), "theme": "Golden Corn", "accent": (234, 179, 8)},
        "apple": {"bg": (254, 202, 202), "theme": "Crisp Apple", "accent": (239, 68, 68)},
        "wheat": {"bg": (254, 243, 199), "theme": "Winter Wheat", "accent": (217, 119, 6)},
        "sunflower": {"bg": (254, 249, 195), "theme": "Sunflower Seeds", "accent": (245, 158, 11)},
        "melon": {"bg": (187, 247, 208), "theme": "Sugar Melon", "accent": (34, 197, 94)},
        "rice": {"bg": (224, 242, 254), "theme": "Tidal Rice", "accent": (14, 165, 233)},
    }

    size = 256
    for crop_key, meta in crops.items():
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx, cy = size / 2.0, size / 2.0

        # Golden circular collectible token frame
        draw.ellipse((10, 10, size - 10, size - 10), fill=meta["bg"] + (245,), outline=(113, 63, 18, 255), width=6)
        draw.ellipse((18, 18, size - 18, size - 18), fill=None, outline=meta["accent"] + (255,), width=3)

        # Draw specific detailed produce item
        if crop_key == "corn":
            # Golden ripe sweet corn cob
            draw.ellipse((cx - 30, cy - 65, cx + 30, cy + 55), fill=(245, 195, 35, 255), outline=(130, 80, 15, 255), width=3)
            # Kernels grid
            for ky in range(int(cy - 50), int(cy + 45), 14):
                draw.line([(cx - 24, ky), (cx + 24, ky)], fill=(215, 160, 20, 255), width=2)
            # Husk leaves
            draw.polygon([(cx - 45, cy + 60), (cx - 25, cy + 10), (cx, cy + 50)], fill=(34, 197, 94, 255), outline=(20, 90, 40, 255), width=2)
            draw.polygon([(cx + 45, cy + 60), (cx + 25, cy + 10), (cx, cy + 50)], fill=(74, 222, 128, 255), outline=(20, 90, 40, 255), width=2)

        elif crop_key == "apple":
            # Shiny red apple
            draw.ellipse((cx - 55, cy - 45, cx + 10, cy + 45), fill=(239, 68, 68, 255), outline=(120, 20, 20, 255), width=3)
            draw.ellipse((cx - 10, cy - 45, cx + 55, cy + 45), fill=(220, 38, 38, 255), outline=(120, 20, 20, 255), width=3)
            # Specular highlight
            draw.ellipse((cx - 36, cy - 30, cx - 18, cy - 10), fill=(254, 202, 202, 255))
            # Stem and leaf
            draw.line([(cx, cy - 45), (cx + 6, cy - 70)], fill=(100, 50, 20, 255), width=5)
            draw.ellipse((cx + 6, cy - 74, cx + 38, cy - 58), fill=(34, 197, 94, 255), outline=(20, 90, 40, 255), width=2)

        elif crop_key == "wheat":
            # Sheaf of golden wheat
            draw.line([(cx, cy + 65), (cx, cy - 30)], fill=(180, 110, 25, 255), width=5)
            # Grains
            for gy in range(int(cy - 55), int(cy + 15), 16):
                draw.ellipse((cx - 24, gy - 8, cx - 4, gy + 8), fill=(245, 195, 60, 255), outline=(140, 80, 20, 255), width=2)
                draw.ellipse((cx + 4, gy - 8, cx + 24, gy + 8), fill=(250, 204, 21, 255), outline=(140, 80, 20, 255), width=2)
                draw.line([(cx - 24, gy), (cx - 38, gy - 16)], fill=(217, 119, 6, 255), width=2)
                draw.line([(cx + 24, gy), (cx + 38, gy - 16)], fill=(217, 119, 6, 255), width=2)

        elif crop_key == "sunflower":
            # Sunflower head with golden petals
            for i in range(12):
                ang = i * (math.pi / 6.0)
                px = cx + math.cos(ang) * 48
                py = cy + math.sin(ang) * 48
                draw.ellipse((px - 14, py - 14, px + 14, py + 14), fill=(250, 204, 21, 255), outline=(180, 83, 9, 255), width=2)
            # Center seed disc
            draw.ellipse((cx - 30, cy - 30, cx + 30, cy + 30), fill=(113, 63, 18, 255), outline=(69, 26, 3, 255), width=3)
            for r in range(10, 28, 8):
                draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(146, 64, 14, 255), width=2)

        elif crop_key == "melon":
            # Striped green sweet melon
            draw.ellipse((cx - 55, cy - 45, cx + 55, cy + 45), fill=(34, 197, 94, 255), outline=(20, 83, 45, 255), width=3)
            # Dark green stripes
            for ang in [-35, -15, 15, 35]:
                draw.arc((cx - 45 + ang, cy - 42, cx + 45 + ang, cy + 42), start=45, end=135, fill=(20, 83, 45, 255), width=6)
            # Slice in front showing juicy pink interior
            draw.pieslice((cx - 40, cy - 10, cx + 40, cy + 60), start=0, end=180, fill=(244, 63, 94, 255), outline=(22, 101, 52, 255), width=3)
            # Melon seeds
            for sx in [-16, 0, 16]:
                draw.ellipse((cx + sx - 2, cy + 24, cx + sx + 2, cy + 29), fill=(25, 25, 25, 255))

        elif crop_key == "rice":
            # Sheaves of tidal rice & kelp ribbon
            draw.line([(cx - 15, cy + 60), (cx - 5, cy - 40)], fill=(120, 150, 80, 255), width=4)
            draw.line([(cx + 15, cy + 60), (cx + 5, cy - 40)], fill=(120, 150, 80, 255), width=4)
            for ry in range(int(cy - 50), int(cy + 20), 14):
                draw.ellipse((cx - 20, ry - 6, cx - 2, ry + 6), fill=(240, 245, 215, 255), outline=(90, 120, 50, 255), width=2)
                draw.ellipse((cx + 2, ry - 6, cx + 20, ry + 6), fill=(250, 250, 235, 255), outline=(90, 120, 50, 255), width=2)
            # Emerald kelp ribbon tied around
            draw.ellipse((cx - 25, cy + 18, cx + 25, cy + 34), fill=(13, 148, 136, 255), outline=(15, 76, 70, 255), width=2)

        out_path = os.path.join(crops_dir, f"produce_{crop_key}.png")
        img.save(out_path, "PNG", optimize=True)
        print(f"Saved {out_path}")

if __name__ == "__main__":
    generate_glow_aura()
    generate_baby_crop()
    generate_windmill_assets()
    generate_buyer_sprite()
    generate_produce_icons()
    print("ALL ASSETS GENERATED SUCCESSFULLY!")
