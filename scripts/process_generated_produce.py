import os
import glob
from collections import deque
from PIL import Image

artifacts_dir = r"C:\Users\acgri\.gemini\antigravity\brain\e89afa89-b90d-48e9-8409-a0c540d0871c"
dest_dir = r"c:\Users\acgri\Documents\antigravity\fervent-brahmagupta\public\assets\crops"

mapping = {
    "produce_corn": "produce_corn.png",
    "produce_apple": "produce_apple.png",
    "produce_wheat": "produce_wheat.png",
    "produce_sunflower": "produce_sunflower.png",
    "produce_melon": "produce_melon.png",
    "produce_rice": "produce_rice.png",
}

def remove_background(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    pix = img.load()

    # Flood fill transparent background starting from all four borders
    visited = bytearray(w * h)
    queue = deque()

    # Seed with all border pixels
    for x in range(w):
        for y in (0, h - 1):
            idx = y * w + x
            r, g, b, _ = pix[x, y]
            if r > 230 and g > 230 and b > 230:
                visited[idx] = 1
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            idx = y * w + x
            if not visited[idx]:
                r, g, b, _ = pix[x, y]
                if r > 230 and g > 230 and b > 230:
                    visited[idx] = 1
                    queue.append((x, y))

    while queue:
        cx, cy = queue.popleft()
        # Make transparent
        pix[cx, cy] = (0, 0, 0, 0)

        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                nidx = ny * w + nx
                if not visited[nidx]:
                    r, g, b, a = pix[nx, ny]
                    # Expand into background light pixels
                    if r > 225 and g > 225 and b > 225:
                        visited[nidx] = 1
                        queue.append((nx, ny))

    # Also soften slight halo right adjacent to transparent boundary
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = pix[x, y]
            if a > 0 and r > 235 and g > 235 and b > 235:
                # Check if neighbors transparent
                if any(pix[nx, ny][3] == 0 for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1))):
                    pix[x, y] = (0, 0, 0, 0)

    # Trim bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Resize cleanly to a crisp 128x128 sprite
    img = img.resize((128, 128), Image.Resampling.LANCZOS)
    img.save(out_path, "PNG", optimize=True)
    print(f"Saved transparent sprite: {out_path} ({img.size})")

for prefix, target_name in mapping.items():
    matches = glob.glob(os.path.join(artifacts_dir, f"{prefix}_*.jpg"))
    if not matches:
        matches = glob.glob(os.path.join(artifacts_dir, f"{prefix}_*.png"))
    if matches:
        # Sort by creation time to get latest
        matches.sort(key=os.path.getmtime, reverse=True)
        latest = matches[0]
        out_file = os.path.join(dest_dir, target_name)
        remove_background(latest, out_file)
    else:
        print(f"Warning: No match found for {prefix}")
