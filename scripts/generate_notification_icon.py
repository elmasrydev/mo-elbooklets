"""
Generate Android notification icon (white silhouette on transparent background)
from the app's icon.png. Creates all required density sizes.
"""
from PIL import Image
import os

# Android notification icon sizes per density
SIZES = {
    'drawable-mdpi': 24,
    'drawable-hdpi': 36,
    'drawable-xhdpi': 48,
    'drawable-xxhdpi': 72,
    'drawable-xxxhdpi': 96,
}

INPUT = 'assets/icon.png'
OUTPUT_BASE = 'android/app/src/main/res'

img = Image.open(INPUT).convert('RGBA')

for density, size in SIZES.items():
    # Resize to target size
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Convert to white silhouette: any non-transparent pixel becomes white
    pixels = resized.load()
    for y in range(size):
        for x in range(size):
            r, g, b, a = pixels[x, y]
            if a > 30:  # Non-transparent pixel
                pixels[x, y] = (255, 255, 255, a)  # White, keep original alpha
            else:
                pixels[x, y] = (0, 0, 0, 0)  # Fully transparent
    
    out_dir = os.path.join(OUTPUT_BASE, density)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'ic_notification.png')
    resized.save(out_path, 'PNG')
    print(f'Created {out_path} ({size}x{size})')

print('\nDone! All notification icons created.')
