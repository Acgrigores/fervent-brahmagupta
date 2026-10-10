import os
import random
import math
from PIL import Image, ImageDraw, ImageFilter

public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets"
os.makedirs(public_dir, exist_ok=True)

def generate_detailed_grass(filename, is_flourish=True, w=1000, h=750):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    random.seed(12345 if is_flourish else 54321)

    # 1. Base lawn colors
    if is_flourish:
        base_color = (68, 160, 85)
        stripe_color = (55, 142, 72)
    else:
        base_color = (48, 48, 52)
        stripe_color = (38, 38, 42)

    # Fill base
    draw.rectangle((0, 0, w, h), fill=base_color)

    # 2. Diagonal manicured lawn striping bands
    stripe_width = 80
    for offset in range(-h, w + h, stripe_width * 2):
        points = [
            (offset, 0),
            (offset + stripe_width, 0),
            (offset + stripe_width + h, h),
            (offset + h, h)
        ]
        draw.polygon(points, fill=stripe_color)

    # 3. Dense turf texture & blade clusters
    num_clusters = 18000
    for _ in range(num_clusters):
        x = random.randint(0, w - 1)
        y = random.randint(0, h - 1)

        if is_flourish:
            # Variety of rich natural greens
            variation = random.randint(-22, 28)
            r = max(40, min(100, 68 + variation - 5))
            g = max(110, min(210, 160 + variation + 12))
            b = max(45, min(110, 80 + variation - 8))
            alpha = random.randint(140, 240)
        else:
            # Dreary dead ashen / dry thatch
            variation = random.randint(-15, 18)
            r = max(35, min(75, 52 + variation))
            g = max(35, min(75, 52 + variation))
            b = max(30, min(65, 45 + variation - 5))
            alpha = random.randint(120, 200)

        # Draw grass blade pair / tuft
        blade_len = random.randint(3, 7)
        lean = random.randint(-3, 3)
        draw.line((x, y, x + lean, y - blade_len), fill=(r, g, b, alpha), width=1)
        draw.line((x + 1, y, x + lean + 2, y - blade_len + 1), fill=(r, g, b, alpha), width=1)

    # 4. If flourishing, add delicate meadow clover blossoms & buttercups
    if is_flourish:
        # White & pink clover blossoms
        for _ in range(180):
            cx = random.randint(10, w - 10)
            cy = random.randint(10, h - 10)
            # 3 tiny clover petals
            for dx, dy in [(0, -2), (-2, 1), (2, 1)]:
                draw.ellipse((cx + dx - 1, cy + dy - 1, cx + dx + 1, cy + dy + 1), fill=(245, 250, 245, 230))
            draw.point((cx, cy), fill=(255, 230, 120, 255))

        # Tiny yellow buttercup specks
        for _ in range(120):
            bx = random.randint(10, w - 10)
            by = random.randint(10, h - 10)
            draw.ellipse((bx - 1, by - 1, bx + 1, by + 1), fill=(250, 204, 21, 240))
    else:
        # Dry dead thatch cracks and soot specks
        for _ in range(250):
            sx = random.randint(10, w - 10)
            sy = random.randint(10, h - 10)
            slen = random.randint(4, 12)
            draw.line((sx, sy, sx + random.randint(-6, 6), sy + random.randint(-3, 3)), fill=(25, 25, 28, 180), width=1)

    # Soft subtle blur to blend turf into organic ground
    img = img.filter(ImageFilter.SMOOTH_MORE)
    out_path = os.path.join(public_dir, filename)
    img.save(out_path, "PNG")
    print(f"Generated {filename} ({w}x{h})")

generate_detailed_grass("grass_flourish.png", is_flourish=True)
generate_detailed_grass("grass_dead.png", is_flourish=False)
