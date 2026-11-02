"""Crop poster sheets out of phone photos and write review WebPs.

Originals stay in raw/photos. This script writes one full-size and one thumb
WebP per photo under raw/crops, named from the source file. Matching to
Pretalx codes happens afterwards.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw" / "photos"
OUT = ROOT / "raw" / "crops"
PREVIEW = ROOT / "raw" / "ocr"


def load_bgr(path: Path) -> np.ndarray:
    image = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    return cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR)


def order_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    summed = pts.sum(axis=1)
    rect[0] = pts[np.argmin(summed)]
    rect[2] = pts[np.argmax(summed)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def quad_from_contour(contour: np.ndarray) -> np.ndarray:
    peri = cv2.arcLength(contour, True)
    for eps in np.linspace(0.008, 0.08, 20):
        approx = cv2.approxPolyDP(contour, eps * peri, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            return approx.reshape(4, 2).astype("float32")
    rect = cv2.minAreaRect(contour)
    return cv2.boxPoints(rect).astype("float32")


def vision_quad(path: Path, width: int, height: int) -> np.ndarray | None:
    """Use the macOS document detector when it sees the whole sheet."""
    binary = ROOT / "scripts" / "detect-rect"
    if not binary.exists():
        return None
    try:
        output = subprocess.check_output([str(binary), str(path)], text=True, stderr=subprocess.DEVNULL)
    except (subprocess.CalledProcessError, OSError):
        return None
    best: tuple[float, np.ndarray] | None = None
    for line in output.splitlines():
        nums = [float(value) for value in line.split()]
        if len(nums) < 8:
            continue
        corners = [(nums[i], nums[i + 1]) for i in range(0, 8, 2)]
        top = max(corner[1] for corner in corners[:2])
        bottom = min(corner[1] for corner in corners[2:])
        left = min(corner[0] for corner in corners)
        right = max(corner[0] for corner in corners)
        # Vision's origin is the bottom-left. A full poster reaches near both ends.
        if top < 0.74 or bottom > 0.22 or left > 0.22 or right < 0.78:
            continue
        quad = np.array([[nx * width, (1 - ny) * height] for nx, ny in corners], dtype="float32")
        area = float(cv2.contourArea(quad))
        if area < 0.4 * width * height:
            continue
        if best is None or area > best[0]:
            best = (area, quad)
    return None if best is None else best[1]


def find_quad(image: np.ndarray) -> np.ndarray | None:
    """Separate the poster from the wall with GrabCut, then grow the box.

    A later trim drops carpet and wall that the growth pulled in. Growth is
    what keeps white margins and dark header bands, which GrabCut often
    treats as background.
    """
    height, width = image.shape[:2]
    scale = 700 / max(height, width)
    small = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    small_h, small_w = small.shape[:2]
    mask = np.zeros((small_h, small_w), np.uint8)
    rect = (int(small_w * 0.04), int(small_h * 0.03), int(small_w * 0.92), int(small_h * 0.92))
    background = np.zeros((1, 65), np.float64)
    foreground = np.zeros((1, 65), np.float64)
    cv2.grabCut(small, mask, rect, background, foreground, 4, cv2.GC_INIT_WITH_RECT)
    poster = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype("uint8")
    poster = cv2.morphologyEx(poster, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    contours, _ = cv2.findContours(poster, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    contour = max(contours, key=cv2.contourArea)
    if cv2.contourArea(contour) < 0.2 * small_h * small_w:
        return None
    box = cv2.boxPoints(cv2.minAreaRect(contour)).astype("float32")
    centre = box.mean(axis=0)
    box = centre + (box - centre) * 1.2
    box /= scale
    box[:, 0] = np.clip(box[:, 0], 0, width - 1)
    box[:, 1] = np.clip(box[:, 1], 0, height - 1)
    return box.astype("float32")


def longest_content_run(keep: np.ndarray) -> tuple[int, int]:
    best = (0, -1)
    start: int | None = None
    flags = list(keep) + [False]
    for index, flag in enumerate(flags):
        if flag and start is None:
            start = index
        elif not flag and start is not None:
            if index - 1 - start > best[1] - best[0]:
                best = (start, index - 1)
            start = None
    return best


def trim_wall(image: np.ndarray) -> np.ndarray:
    """Drop leading carpet and wall, keeping the longest non-gray sheet."""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]
    # Phone photos of the Perth venue wall are warm gray, not pure gray.
    wall = (saturation < 48) & (value > 70) & (value < 185)
    row_wall = wall.mean(axis=1) > 0.55
    col_wall = wall.mean(axis=0) > 0.55
    top, bottom = longest_content_run(~row_wall)
    left, right = longest_content_run(~col_wall)
    if bottom - top < image.shape[0] * 0.45 or right - left < image.shape[1] * 0.45:
        return image
    return image[top : bottom + 1, left : right + 1]


def warp(image: np.ndarray, quad: np.ndarray) -> np.ndarray:
    rect = order_points(quad)
    top_left, top_right, bottom_right, bottom_left = rect
    width = int(max(np.linalg.norm(bottom_right - bottom_left), np.linalg.norm(top_right - top_left)))
    height = int(max(np.linalg.norm(top_right - bottom_right), np.linalg.norm(top_left - bottom_left)))
    width = max(width, 2)
    height = max(height, 2)
    destination = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype="float32",
    )
    matrix = cv2.getPerspectiveTransform(rect, destination)
    return cv2.warpPerspective(image, matrix, (width, height), flags=cv2.INTER_CUBIC)


def resize_width(image: np.ndarray, width: int) -> np.ndarray:
    height, current = image.shape[:2]
    if current <= width:
        return image
    scale = width / current
    return cv2.resize(image, (width, int(height * scale)), interpolation=cv2.INTER_AREA)


def save_webp(image: np.ndarray, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    Image.fromarray(rgb).save(path, "WEBP", quality=quality, method=4)


def sharpness(image: np.ndarray) -> float:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def process(path: Path) -> dict:
    image = load_bgr(path)
    height, width = image.shape[:2]
    quad = vision_quad(path, width, height)
    source = "vision" if quad is not None else "grabcut"
    if quad is None:
        quad = find_quad(image)
    used_fallback = quad is None
    if quad is None:
        height, width = image.shape[:2]
        margin_x = int(width * 0.06)
        margin_y = int(height * 0.05)
        quad = np.array(
            [
                [margin_x, margin_y],
                [width - margin_x, margin_y],
                [width - margin_x, height - margin_y],
                [margin_x, height - margin_y],
            ],
            dtype="float32",
        )
    cropped = warp(image, quad)
    if source != "vision":
        cropped = trim_wall(cropped)
    # Portrait posters that were photographed sideways come out landscape.
    if cropped.shape[1] > cropped.shape[0] * 1.15:
        cropped = cv2.rotate(cropped, cv2.ROTATE_90_CLOCKWISE)
    full = resize_width(cropped, 1600)
    thumb = resize_width(cropped, 480)
    preview = resize_width(image, 1400)
    stem = path.stem
    save_webp(full, OUT / f"{stem}.webp", 82)
    save_webp(thumb, OUT / f"{stem}-thumb.webp", 76)
    save_webp(preview, PREVIEW / f"{stem}.webp", 70)
    return {
        "file": path.name,
        "source": "fallback" if used_fallback else source,
        "fallback": used_fallback,
        "sharpness": round(sharpness(full), 2),
        "width": int(full.shape[1]),
        "height": int(full.shape[0]),
    }


def main() -> None:
    files = sorted(RAW.glob("*.jpg"))
    if len(sys.argv) > 1:
        wanted = set(sys.argv[1:])
        files = [path for path in files if path.name in wanted or path.stem in wanted]
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    report = []
    for index, path in enumerate(files, start=1):
        item = process(path)
        report.append(item)
        print(f"{index}/{len(files)} {path.name} {item['width']}x{item['height']} sharp={item['sharpness']} fallback={item['fallback']}", flush=True)
    (OUT / "report.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
