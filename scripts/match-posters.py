"""Match cropped photos to Pretalx posters and publish the winning WebPs."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PHOTOS = ROOT / "raw" / "photos"
CROPS = ROOT / "raw" / "crops"
OCR_DIR = ROOT / "raw" / "ocr"
PUBLIC = ROOT / "public" / "posters"
POSTERS = ROOT / "src" / "data" / "posters.json"
PHOTO_MAP = ROOT / "src" / "data" / "photo-map.json"
OCR_BIN = ROOT / "scripts" / "ocr"

TOKEN = re.compile(r"[a-z0-9]{4,}")
BOARD = re.compile(r"\bP\d{3}\b", re.IGNORECASE)


def tokens(value: str) -> set[str]:
    return set(TOKEN.findall(value.lower()))


def surname(name: str) -> str:
    parts = re.findall(r"[A-Za-zÀ-ÿ]{3,}", name)
    return parts[-1].lower() if parts else ""


def ocr_text(filename: str) -> str:
    cache = OCR_DIR / f"{Path(filename).stem}.txt"
    if cache.exists():
        return cache.read_text()
    source = PHOTOS / filename
    output = subprocess.check_output([str(OCR_BIN), str(source)], text=True, stderr=subprocess.DEVNULL)
    cache.write_text(output)
    return output


def main() -> None:
    posters = json.loads(POSTERS.read_text())
    report = {item["file"]: item for item in json.loads((CROPS / "report.json").read_text())}
    OCR_DIR.mkdir(parents=True, exist_ok=True)
    ranked: list[dict] = []
    for filename, meta in report.items():
        text = ocr_text(filename)
        folded = text.lower()
        boards = [match.upper() for match in BOARD.findall(text)]
        scores = []
        for poster in posters:
            title = tokens(poster["title"])
            overlap = sum(1 for token in title if token in folded) / max(len(title), 1)
            author = any(
                re.search(rf"\b{re.escape(surname(person['name']))}\b", folded) is not None
                for person in poster["persons"]
                if len(surname(person["name"])) >= 4
            )
            scores.append((overlap * 2 + (1 if author else 0), overlap, author, poster["code"]))
        scores.sort(reverse=True)
        best = scores[0]
        second = scores[1]
        margin = best[0] - second[0]
        if best[1] >= 0.45 or (best[2] and best[1] >= 0.22 and margin >= 0.4):
            confidence = "high" if best[1] >= 0.45 and margin >= 0.35 else "medium"
        else:
            confidence = "low"
        ranked.append(
            {
                "file": filename,
                "code": best[3] if confidence != "low" else "",
                "board": boards[0] if boards else "",
                "confidence": confidence,
                "sharpness": meta.get("sharpness", 0),
                "titleOverlap": round(best[1], 3),
                "runnerUp": second[3],
            }
        )
        print(f"{filename} {confidence:6} {best[3] if confidence != 'low' else '-':8} overlap={best[1]:.2f} board={boards[:1]}", flush=True)

    winners: dict[str, dict] = {}
    for photo in ranked:
        if not photo["code"]:
            continue
        current = winners.get(photo["code"])
        if current is None or photo["sharpness"] > current["sharpness"]:
            winners[photo["code"]] = photo

    PUBLIC.mkdir(parents=True, exist_ok=True)
    for existing in PUBLIC.glob("*.webp"):
        existing.unlink()
    for photo in winners.values():
        stem = Path(photo["file"]).stem
        shutil.copyfile(CROPS / f"{stem}.webp", PUBLIC / f"{photo['code']}.webp")
        shutil.copyfile(CROPS / f"{stem}-thumb.webp", PUBLIC / f"{photo['code']}-thumb.webp")

    PHOTO_MAP.write_text(json.dumps({"photos": ranked}, indent=2) + "\n")
    print(f"matched {len(winners)} posters, {sum(1 for photo in ranked if photo['confidence']=='low')} low")


if __name__ == "__main__":
    main()
