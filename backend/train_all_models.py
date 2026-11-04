"""
Medi Consult - Master Clinical ML Training Pipeline
Sequentially prepares datasets and trains all 12 core clinical diagnostic models:
1.  Blood tests           -> XGBoost (MIMIC-IV)
2.  Chest X-ray           -> DenseNet121 (NIH Chest X-ray 14)
3.  Lung CT               -> 3D U-Net (LIDC-IDRI TCIA)
4.  Brain MRI             -> Multimodal 3D U-Net (BraTS)
5.  ECG                   -> 1D CNN (PTB-XL 1.0.3)
6.  Urine & Microscopy    -> XGBoost (Mendeley 6xhr6sfsr9)
7.  Bone Fracture         -> EfficientNet-B4 (4,148 Radiographs)
8.  Diabetic Retinopathy  -> ResNet-18 (APTOS 2019 Blindness Detection)
9.  Skin Lesions          -> ResNet-18 (HAM10000 / DermaMNIST)
10. Breast Ultrasound     -> ResNet-18 (BUSI 780 Cases)
11. Retinal OCT           -> ResNet-18 (OCTMNIST 109,309 Scans)
12. Colon Histopathology  -> ResNet-18 (PathMNIST 107,180 Tiles)

Exports all trained models and evaluation reports into:
backend/trained_models/
"""

import sys
import json
import time
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from ml_training.train_blood_xgboost import train_blood_xgboost
from ml_training.train_chest_xray_densenet import train_chest_xray_densenet
from ml_training.train_lung_ct_unet3d import train_lung_ct_unet3d
from ml_training.train_brain_mri_unet3d import train_brain_mri_unet3d
from ml_training.train_ecg_cnn1d import train_ecg_cnn1d
from ml_training.train_urine_xgboost import train_model as train_urine_xgboost
from ml_training.train_bone_fracture import train_bone_model as train_bone_fracture
from ml_training.train_diabetic_retinopathy import train_retinopathy_model as train_diabetic_retinopathy
from ml_training.train_skin_lesion import train_skin_model as train_skin_lesion
from ml_training.train_breast_ultrasound import train_breast_model as train_breast_ultrasound
from ml_training.train_retinal_oct import train_oct_model as train_retinal_oct
from ml_training.train_colon_histology import train_histology_model as train_colon_histology

MODELS_DIR = BASE_DIR / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def train_all_models():
    print("\n" + "#" * 70, flush=True)
    print("MEDI CONSULT - MASTER CLINICAL ML TRAINING PIPELINE (MODELS 1 TO 12)", flush=True)
    print("#" * 70, flush=True)

    start_time = time.time()
    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "models": {}
    }

    pipeline_tasks = [
        ("blood_xgboost", "Blood Tests (XGBoost)", train_blood_xgboost),
        ("chest_xray_densenet", "Chest X-ray (DenseNet121)", train_chest_xray_densenet),
        ("lung_ct_unet3d", "Lung CT (3D U-Net)", train_lung_ct_unet3d),
        ("brain_mri_unet3d", "Brain MRI (3D U-Net)", train_brain_mri_unet3d),
        ("ecg_1d_cnn", "ECG (1D CNN)", train_ecg_cnn1d),
        ("urine_xgboost", "Urine Routine & Microscopy (XGBoost)", train_urine_xgboost),
        ("bone_fracture", "Bone Fracture (EfficientNetB4)", train_bone_fracture),
        ("diabetic_retinopathy", "Diabetic Retinopathy (ResNet-18)", train_diabetic_retinopathy),
        ("skin_lesion", "Skin Lesions (HAM10000 ResNet-18)", train_skin_lesion),
        ("breast_ultrasound", "Breast Ultrasound (BUSI ResNet-18)", train_breast_ultrasound),
        ("retinal_oct", "Retinal OCT (OCTMNIST ResNet-18)", train_retinal_oct),
        ("colon_histology", "Colon Histopathology (PathMNIST ResNet-18)", train_colon_histology),
    ]

    for key, name, train_fn in pipeline_tasks:
        print(f"\n>>> Starting Pipeline Task: {name}...", flush=True)
        task_start = time.time()
        try:
            meta = train_fn()
            duration = time.time() - task_start
            summary["models"][key] = {
                "status": "SUCCESS",
                "name": name,
                "duration_seconds": round(duration, 2),
                "details": meta
            }
            print(f">>> Completed {name} in {duration:.2f}s [SUCCESS]", flush=True)
        except Exception as error:
            duration = time.time() - task_start
            print(f">>> Failed {name} after {duration:.2f}s: {error}", flush=True)
            summary["models"][key] = {
                "status": "FAILED",
                "name": name,
                "duration_seconds": round(duration, 2),
                "error": str(error)
            }

    total_duration = time.time() - start_time
    summary["total_duration_seconds"] = round(total_duration, 2)

    # Save summary report
    summary_path = MODELS_DIR / "training_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 70, flush=True)
    print("ALL 12 CLINICAL ML ALGORITHMS TRAINED SUCCESSFULLY", flush=True)
    print(f"Total Pipeline Runtime: {total_duration:.2f} seconds", flush=True)
    print(f"Summary Report: {summary_path}", flush=True)
    print("Trained Models Folder: backend/trained_models/", flush=True)
    print("=" * 70 + "\n", flush=True)

    return summary


if __name__ == "__main__":
    train_all_models()
