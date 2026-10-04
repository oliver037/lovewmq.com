"""把 photos/raw/ 里的原图压缩成网页用的尺寸，输出到 photos/。

用法：python tools/compress.py
- 最长边缩到 1600px，JPEG 质量 82，自动按 EXIF 旋转，并去掉 EXIF（含 GPS 定位）
- 输出文件名和原图同名（扩展名统一为 .jpg）
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "photos" / "raw"
DST = ROOT / "photos"
MAX_SIDE = 1600
QUALITY = 82
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def main() -> None:
    files = sorted(p for p in SRC.iterdir() if p.suffix.lower() in EXTS)
    if not files:
        print(f"{SRC} 里没有图片")
        return
    for src in files:
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            out = DST / (src.stem + ".jpg")
            # 不传 exif 参数，相当于丢弃所有元数据
            im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        print(f"{src.name:30s} -> {out.name}  {im.size[0]}x{im.size[1]}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
