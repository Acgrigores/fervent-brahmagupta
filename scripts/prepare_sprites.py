import os
import glob
from PIL import Image, ImageEnhance, ImageOps, ImageDraw, ImageFilter

brain_dir = r"C:\Users\acgri\.gemini\antigravity\brain\6cedae05-a228-4879-a391-cf0725062b18"
public_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets"

os.makedirs(os.path.join(public_dir, "sprites"), exist_ok=True)
os.makedirs(os.path.join(public_dir, "crops"), exist_ok=True)

def make_transparent(img, threshold=245):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # Check if pixel is close to pure white
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def remove_white_bg_flood(img, tol=15):
    # Convert to RGBA
    img = img.convert("RGBA")
    w, h = img.size
    
    # Simple color keying around borders
    datas = list(img.getdata())
    new_data = []
    for item in datas:
        r, g, b, a = item
        if r > 240 and g > 240 and b > 240:
            new_data.append((255, 255, 255, 0))
        elif r > 230 and g > 230 and b > 230:
            # Soft edge
            alpha = int(255 * (1.0 - (min(r, g, b) - 230) / 15.0))
            new_data.append((r, g, b, max(0, alpha)))
        else:
            new_data.append((r, g, b, 255))
    img.putdata(new_data)
    return img

# Find files
farmer_files = glob.glob(os.path.join(brain_dir, "farmer_sprite_*.jpg"))
house_files = glob.glob(os.path.join(brain_dir, "farm_house_*.jpg"))
barn_files = glob.glob(os.path.join(brain_dir, "farm_barn_*.jpg"))
trees_files = glob.glob(os.path.join(brain_dir, "orchard_trees_*.jpg"))
crop_dead_files = glob.glob(os.path.join(brain_dir, "crop_corn_dead_*.jpg"))

print("Found farmer:", farmer_files)
print("Found house:", house_files)
print("Found barn:", barn_files)
print("Found trees:", trees_files)
print("Found crop dead:", crop_dead_files)

if farmer_files:
    img = Image.open(farmer_files[0])
    img = remove_white_bg_flood(img)
    img.save(os.path.join(public_dir, "sprites", "farmer.png"), "PNG")
    print("Saved farmer.png")

if house_files:
    img = Image.open(house_files[0])
    img = remove_white_bg_flood(img)
    img.save(os.path.join(public_dir, "sprites", "house.png"), "PNG")
    print("Saved house.png")

if barn_files:
    img = Image.open(barn_files[0])
    img = remove_white_bg_flood(img)
    img.save(os.path.join(public_dir, "sprites", "barn.png"), "PNG")
    print("Saved barn.png")

if trees_files:
    img = Image.open(trees_files[0])
    img = remove_white_bg_flood(img)
    img.save(os.path.join(public_dir, "sprites", "trees.png"), "PNG")
    print("Saved trees.png")

if crop_dead_files:
    dead_img = Image.open(crop_dead_files[0])
    dead_png = remove_white_bg_flood(dead_img)
    dead_png.save(os.path.join(public_dir, "crops", "crop_dead.png"), "PNG")
    print("Saved crop_dead.png")

print("Processing finished.")
