"""
Medi Consult - Model 7: Bone Fracture Dataset Preparation
Converts YOLO-annotated bone fracture images into classified folder structure:
  backend/datasets/bone_classification/
  ├── train/
  │   ├── Fractured/
  │   └── Normal/
  ├── val/
  │   ├── Fractured/
  │   └── Normal/
  └── test/
      ├── Fractured/
      └── Normal/
"""

import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_BONE_DIR = BASE_DIR / "datasets" / "bone"
TARGET_DIR = BASE_DIR / "datasets" / "bone_classification"

ANATOMICAL_MAP = {
    0: "Elbow",
    1: "Fingers",
    2: "Forearm",
    3: "Humerus",
    4: "Humerus",  # negative control / normal humerus
    5: "Shoulder",
    6: "Wrist"
}

FRACTURE_CLASSES = {0, 1, 2, 3, 5, 6}


def prepare_bone_dataset():
    print("=" * 65)
    print("MEDI CONSULT - PREPARING BONE FRACTURE DATASET")
    print(f"Source: {RAW_BONE_DIR}")
    print(f"Target: {TARGET_DIR}")
    print("=" * 65)

    if not RAW_BONE_DIR.exists():
        raise FileNotFoundError(f"Raw bone dataset not found at {RAW_BONE_DIR}")

    stats = {}

    split_mapping = {
        "train": "train",
        "valid": "val",
        "test": "test"
    }

    manifest = []

    for src_split, target_split in split_mapping.items():
        img_dir = RAW_BONE_DIR / src_split / "images"
        lbl_dir = RAW_BONE_DIR / src_split / "labels"

        fractured_out = TARGET_DIR / target_split / "Fractured"
        normal_out = TARGET_DIR / target_split / "Normal"
        fractured_out.mkdir(parents=True, exist_ok=True)
        normal_out.mkdir(parents=True, exist_ok=True)

        n_fractured = 0
        n_normal = 0

        image_files = list(img_dir.glob("*.*"))
        print(f"\nProcessing {src_split} -> {target_split} ({len(image_files)} images)...")

        for img_path in image_files:
            if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
                continue

            lbl_path = lbl_dir / f"{img_path.stem}.txt"
            is_fractured = False
            detected_regions = []

            if lbl_path.exists():
                content = lbl_path.read_text().strip()
                if content:
                    for line in content.split("\n"):
                        parts = line.strip().split()
                        if parts:
                            try:
                                cls_id = int(parts[0])
                                region = ANATOMICAL_MAP.get(cls_id, "Bone")
                                if region not in detected_regions:
                                    detected_regions.append(region)
                                if cls_id in FRACTURE_CLASSES:
                                    is_fractured = True
                            except ValueError:
                                pass

            category = "Fractured" if is_fractured else "Normal"
            dest_folder = fractured_out if is_fractured else normal_out
            dest_file = dest_folder / img_path.name

            # Hardlink or copy for instant zero-overhead organization
            if not dest_file.exists():
                try:
                    os.link(str(img_path), str(dest_file))
                except Exception:
                    shutil.copy2(str(img_path), str(dest_file))

            if is_fractured:
                n_fractured += 1
            else:
                n_normal += 1

            manifest.append({
                "fileName": img_path.name,
                "split": target_split,
                "category": category,
                "isFractured": is_fractured,
                "regions": detected_regions
            })

        stats[target_split] = {
            "total": n_fractured + n_normal,
            "fractured": n_fractured,
            "normal": n_normal
        }
        print(f"  [{target_split.upper()}] Fractured: {n_fractured} | Normal: {n_normal} | Total: {n_fractured + n_normal}")

    import json
    manifest_file = TARGET_DIR / "bone_manifest.json"
    with open(manifest_file, "w") as f:
        json.dump({"statistics": stats, "manifest": manifest[:50]}, f, indent=2)

    print("\n" + "=" * 65)
    print("BONE FRACTURE DATASET PREPARATION COMPLETED!")
    print(f"Data directory: {TARGET_DIR}")
    print("=" * 65)
    return TARGET_DIR, stats


if __name__ == "__main__":
    prepare_bone_dataset()

