import os
import random
from PIL import Image, ImageDraw, ImageFilter

public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets\paths"
os.makedirs(public_dir, exist_ok=True)

# 1. DIRT PATH (Farm): Warm earthy packed dirt with subtle pebbles & texture
def create_dirt_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (141, 98, 59, 255))
    draw = ImageDraw.Draw(img)
    random.seed(101)
    
    # Add subtle soil variations
    for _ in range(800):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        r = random.randint(115, 160)
        g = random.randint(80, 115)
        b = random.randint(45, 75)
        rad = random.randint(1, 3)
        draw.ellipse((x, y, x + rad, y + rad), fill=(r, g, b, 200))
    
    # Pebbles
    for _ in range(40):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        c = random.randint(85, 110)
        draw.ellipse((x, y, x + 2, y + 2), fill=(c, c - 10, c - 15, 230))
        
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(public_dir, "path_farm.png"), "PNG")
    print("Created path_farm.png")

# 2. DOCK PATH (Lake): Wooden plank boardwalk pier
def create_dock_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (180, 130, 85, 255))
    draw = ImageDraw.Draw(img)
    random.seed(202)
    
    # Draw horizontal wooden planks
    plank_height = 20
    for y in range(0, 128, plank_height):
        # Base plank color variation
        base_r = random.randint(160, 195)
        base_g = random.randint(115, 145)
        base_b = random.randint(75, 95)
        draw.rectangle((0, y, 127, y + plank_height - 2), fill=(base_r, base_g, base_b, 255))
        
        # Wood grain lines
        for _ in range(6):
            gy = y + random.randint(2, plank_height - 4)
            draw.line((0, gy, 127, gy), fill=(base_r - 25, base_g - 20, base_b - 15, 120), width=1)
            
        # Iron nails on sides
        draw.ellipse((8, y + 8, 12, y + 12), fill=(55, 45, 40, 255))
        draw.ellipse((116, y + 8, 120, y + 12), fill=(55, 45, 40, 255))
        
        # Dark gap between planks
        draw.line((0, y + plank_height - 1, 127, y + plank_height - 1), fill=(40, 25, 15, 255), width=2)
        
    img.save(os.path.join(public_dir, "path_lake.png"), "PNG")
    print("Created path_lake.png")

# 3. WOODLAND DIRT PATH (Forest): Deep rich forest soil with pine needles
def create_forest_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (105, 75, 45, 255))
    draw = ImageDraw.Draw(img)
    random.seed(303)
    
    for _ in range(700):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        r = random.randint(80, 125)
        g = random.randint(55, 90)
        b = random.randint(35, 55)
        draw.ellipse((x, y, x + 3, y + 2), fill=(r, g, b, 210))
        
    # Pine needles (fine angled lines)
    for _ in range(60):
        x = random.randint(4, 120)
        y = random.randint(4, 120)
        dx = random.randint(-6, 6)
        dy = random.randint(-4, 4)
        draw.line((x, y, x + dx, y + dy), fill=(130, 80, 40, 220), width=1)
        
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(public_dir, "path_forest.png"), "PNG")
    print("Created path_forest.png")

# 4. TUNDRA PATH: Packed frosted snow and ice trail
def create_tundra_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (225, 238, 248, 255))
    draw = ImageDraw.Draw(img)
    random.seed(404)
    
    for _ in range(600):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        c = random.randint(200, 255)
        b_tint = min(255, c + 15)
        draw.ellipse((x, y, x + 3, y + 3), fill=(c - 10, c, b_tint, 220))
        
    # Frost sparkle lines
    for _ in range(30):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        draw.line((x - 2, y, x + 2, y), fill=(255, 255, 255, 240), width=1)
        draw.line((x, y - 2, x, y + 2), fill=(255, 255, 255, 240), width=1)
        
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(public_dir, "path_tundra.png"), "PNG")
    print("Created path_tundra.png")

# 5. GRASSLANDS PATH: Prairie wildflower & dirt trail
def create_grasslands_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (160, 120, 75, 255))
    draw = ImageDraw.Draw(img)
    random.seed(505)
    
    for _ in range(700):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        r = random.randint(140, 180)
        g = random.randint(110, 140)
        b = random.randint(60, 90)
        draw.ellipse((x, y, x + 2, y + 2), fill=(r, g, b, 200))
        
    # Subtle grass fringes
    for _ in range(35):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        draw.line((x, y, x, y - 4), fill=(100, 150, 45, 180), width=1)
        
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(public_dir, "path_grasslands.png"), "PNG")
    print("Created path_grasslands.png")

# 6. DESERT PATH: Packed sandstone trail
def create_desert_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (215, 165, 105, 255))
    draw = ImageDraw.Draw(img)
    random.seed(606)
    
    for _ in range(700):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        r = random.randint(190, 235)
        g = random.randint(145, 185)
        b = random.randint(90, 125)
        draw.ellipse((x, y, x + 3, y + 2), fill=(r, g, b, 200))
        
    img = img.filter(ImageFilter.SMOOTH)
    img.save(os.path.join(public_dir, "path_desert.png"), "PNG")
    print("Created path_desert.png")

# 7. REEFS PATH: Marine boardwalk pier over ocean
def create_reefs_path():
    size = (128, 128)
    img = Image.new("RGBA", size, (195, 165, 130, 255))
    draw = ImageDraw.Draw(img)
    random.seed(707)
    
    plank_height = 20
    for y in range(0, 128, plank_height):
        # Weathered bleached coastal driftwood tone
        base_r = random.randint(180, 210)
        base_g = random.randint(160, 185)
        base_b = random.randint(135, 155)
        draw.rectangle((0, y, 127, y + plank_height - 2), fill=(base_r, base_g, base_b, 255))
        
        # Marine bolts
        draw.ellipse((8, y + 8, 12, y + 12), fill=(60, 70, 75, 255))
        draw.ellipse((116, y + 8, 120, y + 12), fill=(60, 70, 75, 255))
        
        # Gap showing dark turquoise water underneath
        draw.line((0, y + plank_height - 1, 127, y + plank_height - 1), fill=(10, 80, 95, 255), width=2)
        
    img.save(os.path.join(public_dir, "path_reefs.png"), "PNG")
    print("Created path_reefs.png")

create_dirt_path()
create_dock_path()
create_forest_path()
create_tundra_path()
create_grasslands_path()
create_desert_path()
create_reefs_path()
print("All biome path textures created successfully!")
