#!/usr/bin/env python3
"""Build the multi-size Windows icon from the GTA World TR seal PNG."""

import os
from PIL import Image

def main():
    out_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build")
    png_path = os.path.join(out_dir, "icon.png")
    ico_path = os.path.join(out_dir, "icon.ico")
    if not os.path.isfile(png_path):
        raise FileNotFoundError("Missing seal source: " + png_path)

    sizes = [(16, 16), (20, 20), (24, 24), (32, 32), (40, 40),
             (48, 48), (64, 64), (128, 128), (256, 256)]

    ico_src = Image.open(png_path).convert("RGBA")
    ico_src.save(ico_path, format="ICO", sizes=sizes)

    print("wrote", ico_path, os.path.getsize(ico_path), "bytes")

if __name__ == "__main__":
    main()
