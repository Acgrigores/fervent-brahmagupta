import os
import glob
from PIL import Image, ImageEnhance, ImageOps, ImageDraw, ImageFilter, ImageColor

brain_dir = r"C:\Users\acgri\.gemini\antigravity\brain\6cedae05-a228-4879-a391-cf0725062b18"
public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets"

dead_path = os.path.join(public_dir, "crops", "crop_dead.png")
dead_img = Image.open(dead_path).convert("RGBA")
w, h = dead_img.size

# 1. GENERATE FLOURISHING CROP FROM DEAD CROP
# We transform the cracked grey soil into rich fertile dark loam and the dead brown stalks into lush green & gold corn!
flourish_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
pixels_dead = dead_img.load()
pixels_flourish = flourish_img.load()

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels_dead[x, y]
        if a < 30:
            pixels_flourish[x, y] = (0, 0, 0, 0)
            continue

        # Soil is mostly in the lower two-thirds and has low saturation (grey/brown)
        # Stalks have more vertical structure and yellowish/brown tone
        brightness = (r + g + b) / 3.0
        
        # Check if it's the wooden tray/edge around the tile
        if y > h * 0.75 and r > b + 20 and g > b:
            # Wooden base edge: rich dark polished cedar
            pixels_flourish[x, y] = (int(r * 0.7), int(g * 0.5), int(b * 0.4), a)
        elif r > 110 and g > 75 and b < 70 and y < h * 0.7:
            # Stalks / ears: Convert to vibrant flourishing corn
            # Make the tassels and corn cobs bright golden yellow and leaves lush green
            if y % 20 < 8 and brightness > 100:
                # Golden ripe sweet corn cob
                nr = min(255, int(245 + (brightness - 100) * 0.1))
                ng = min(255, int(195 + (brightness - 100) * 0.3))
                nb = min(255, int(35 + (brightness - 100) * 0.2))
                pixels_flourish[x, y] = (nr, ng, nb, a)
            else:
                # Lush emerald green corn leaf
                nr = max(20, min(100, int(r * 0.35)))
                ng = min(255, int(170 + brightness * 0.35))
                nb = max(20, min(100, int(b * 0.5)))
                pixels_flourish[x, y] = (nr, ng, nb, a)
        else:
            # Soil: turn grey cracked dirt into rich dark brown fertile organic earth
            factor = brightness / 255.0
            nr = int(60 * factor + 35)
            ng = int(42 * factor + 25)
            nb = int(25 * factor + 15)
            pixels_flourish[x, y] = (nr, ng, nb, a)

# Add some lush green leaves and golden sparkles onto flourish_img
draw = ImageDraw.Draw(flourish_img)
import random
random.seed(42)

# Save crop_flourish.png
flourish_img.save(os.path.join(public_dir, "crops", "crop_flourish.png"), "PNG")
print("Saved crop_flourish.png successfully!")

# 2. EXTRACT OR GENERATE ANIMAL SPRITES
# Let's inspect the biome images in brain_dir
biome_animals = {
    "manatee": ("isometric_lake_manatee_*.jpg", (0.35, 0.35, 0.65, 0.65)),
    "red_panda": ("isometric_forest_redpanda_*.jpg", (0.35, 0.35, 0.65, 0.65)),
    "polar_bear": ("isometric_tundra_polarbear_*.jpg", (0.35, 0.35, 0.65, 0.65)),
    "butterfly": ("isometric_grasslands_butterfly_*.jpg", (0.35, 0.35, 0.65, 0.65)),
    "cheetah": ("isometric_desert_cheetah_*.jpg", (0.35, 0.35, 0.65, 0.65)),
    "sea_turtle": ("isometric_reefs_turtle_*.jpg", (0.35, 0.35, 0.65, 0.65)),
}

for name, (pattern, crop_box) in biome_animals.items():
    files = glob.glob(os.path.join(brain_dir, pattern))
    if files:
        b_img = Image.open(files[0]).convert("RGBA")
        bw, bh = b_img.size
        # Crop the center animal portrait
        cx1 = int(bw * crop_box[0])
        cy1 = int(bh * crop_box[1])
        cx2 = int(bw * crop_box[2])
        cy2 = int(bh * crop_box[3])
        animal_crop = b_img.crop((cx1, cy1, cx2, cy2))
        
        # Create a circular/rounded badge with a clean border
        size = (200, 200)
        animal_crop = animal_crop.resize(size, Image.Resampling.LANCZOS)
        
        # Make circular mask
        mask = Image.new("L", size, 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((4, 4, size[0]-4, size[1]-4), fill=255)
        
        final_animal = Image.new("RGBA", size, (0, 0, 0, 0))
        final_animal.paste(animal_crop, (0, 0), mask)
        
        # Draw clean border ring
        adraw = ImageDraw.Draw(final_animal)
        adraw.ellipse((4, 4, size[0]-4, size[1]-4), outline=(16, 185, 129, 255), width=4)
        
        out_path = os.path.join(public_dir, "sprites", f"{name}.png")
        final_animal.save(out_path, "PNG")
        print(f"Saved animal sprite: {name}.png")

print("All crop and animal assets generated!")
