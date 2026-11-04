"""
Medi Consult - Model 7: Bone Fracture Detection (EfficientNetB4)
Dataset: Bone Fracture Computer Vision Project (4,148 Radiographs)
Classes: Fractured (positive) vs Normal (negative control)
Architecture: Pre-trained EfficientNet-B4 with Transfer Learning
"""

import os
import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import torchvision.models as models
from torchvision.models import EfficientNet_B4_Weights
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets" / "bone_classification"
MODELS_DIR = BASE_DIR / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODELS_DIR / "bone_fracture_efficientnetb4.pth"
META_FILE = MODELS_DIR / "bone_fracture_meta.json"

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
NUM_EPOCHS = 2
LEARNING_RATE = 2e-4

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def get_dataloaders():
    """Builds standard PyTorch ImageFolder data loaders for train, val, and test splits."""
    train_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_ds = datasets.ImageFolder(str(DATA_DIR / "train"), transform=train_transform)
    val_ds = datasets.ImageFolder(str(DATA_DIR / "val"), transform=val_test_transform)
    test_ds = datasets.ImageFolder(str(DATA_DIR / "test"), transform=val_test_transform)

    print(f"[DATASET] Classes detected: {train_ds.class_to_idx}")
    print(f"  Train samples: {len(train_ds)}")
    print(f"  Val samples:   {len(val_ds)}")
    print(f"  Test samples:  {len(test_ds)}")

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    return train_loader, val_loader, test_loader, train_ds.class_to_idx


def build_model(num_classes=2):
    """Initializes EfficientNetB4 with ImageNet pre-trained weights and a custom classification head."""
    print("[MODEL] Loading EfficientNet-B4 pre-trained backbone...")
    weights = EfficientNet_B4_Weights.DEFAULT
    model = models.efficientnet_b4(weights=weights)

    # Freeze earlier convolutional stages for fast, stable CPU transfer learning
    for param in model.features[:-2].parameters():
        param.requires_grad = False

    in_features = model.classifier[1].in_features  # 1792
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=False),
        nn.Linear(in_features, 256),
        nn.ReLU(inplace=False),
        nn.Dropout(p=0.2, inplace=False),
        nn.Linear(256, num_classes)
    )

    model.to(device)
    return model


def train_bone_model():
    print("=" * 70)
    print("MEDI CONSULT - TRAINING MODEL 7: BONE FRACTURE DETECTION (EFFICIENTNET-B4)")
    print(f"Device: {device}")
    print("=" * 70)

    train_loader, val_loader, test_loader, class_to_idx = get_dataloaders()
    model = build_model(num_classes=len(class_to_idx))

    # Calculate class weights for cross-entropy loss
    # Classes: Fractured (0), Normal (1) in alphabetical order
    class_weights = torch.tensor([2123.0 / 1508.0, 1.0], dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LEARNING_RATE,
        weight_decay=1e-3
    )

    best_val_auc = 0.0
    start_time = time.time()

    print("\n[TRAINING] Starting transfer learning epochs...")
    for epoch in range(1, NUM_EPOCHS + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        # Train loop
        for step, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            if (step + 1) % 50 == 0 or (step + 1) == len(train_loader):
                print(f"  Epoch [{epoch}/{NUM_EPOCHS}] Step [{step + 1}/{len(train_loader)}] Loss: {loss.item():.4f}")

        train_loss = running_loss / total
        train_acc = correct / total

        # Validation loop
        model.eval()
        val_loss = 0.0
        val_labels_all = []
        val_probs_all = []
        val_preds_all = []

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)

                probs = torch.softmax(outputs, dim=1)[:, 0]  # Probability of Fractured (class 0)
                _, preds = outputs.max(1)

                val_labels_all.extend(labels.cpu().numpy())
                val_probs_all.extend(probs.cpu().numpy())
                val_preds_all.extend(preds.cpu().numpy())

        val_total = len(val_labels_all)
        val_loss = val_loss / val_total
        val_acc = accuracy_score(val_labels_all, val_preds_all)
        # Flip labels for AUC so that class 0 (Fractured) is positive target
        binary_targets = [1 if l == 0 else 0 for l in val_labels_all]
        val_auc = roc_auc_score(binary_targets, val_probs_all)

        print(f"\n[EPOCH {epoch}] Train Loss: {train_loss:.4f} | Train Acc: {train_acc * 100:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc * 100:.2f}% | Val AUC: {val_auc:.4f}")

        if val_auc > best_val_auc:
            best_val_auc = val_auc
            torch.save({
                "model_state_dict": model.state_dict(),
                "class_to_idx": class_to_idx,
                "epoch": epoch,
                "val_auc": val_auc
            }, str(MODEL_FILE))
            print(f"  -> Saved best model checkpoint (Val AUC: {val_auc:.4f})")

    # Final Independent Test Set Evaluation
    print("\n" + "=" * 70)
    print("INDEPENDENT UNTOUCHED TEST SET EVALUATION (169 Radiographs)")
    print("=" * 70)

    checkpoint = torch.load(str(MODEL_FILE), map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    test_labels = []
    test_probs = []
    test_preds = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)[:, 0]  # Prob of Fractured
            _, preds = outputs.max(1)

            test_labels.extend(labels.numpy())
            test_probs.extend(probs.cpu().numpy())
            test_preds.extend(preds.cpu().numpy())

    test_binary_targets = [1 if l == 0 else 0 for l in test_labels]
    test_binary_preds = [1 if p == 0 else 0 for p in test_preds]

    test_acc = accuracy_score(test_labels, test_preds)
    test_auc = roc_auc_score(test_binary_targets, test_probs)
    test_prec = precision_score(test_binary_targets, test_binary_preds)
    test_rec = recall_score(test_binary_targets, test_binary_preds)
    test_f1 = f1_score(test_binary_targets, test_binary_preds)
    cm = confusion_matrix(test_binary_targets, test_binary_preds)

    print(f"Test Accuracy:  {test_acc * 100:.2f}%")
    print(f"Test ROC-AUC:   {test_auc:.4f}")
    print(f"Test Precision: {test_prec * 100:.2f}%")
    print(f"Test Recall:    {test_rec * 100:.2f}%")
    print(f"Test F1-Score:  {test_f1:.4f}")
    print(f"Confusion Matrix (TN, FP / FN, TP):\n{cm}")

    elapsed = round(time.time() - start_time, 1)

    # Save Metadata
    meta = {
        "modelName": "Bone Fracture EfficientNet-B4 Classifier",
        "modelType": "EfficientNet-B4 Convolutional Neural Network",
        "clinicalCategory": "Orthopedics & Traumatology / Skeletal Radiography",
        "datasetSource": "Bone Fracture Detection Computer Vision Project (4,148 Radiographs)",
        "classes": list(class_to_idx.keys()),
        "class_to_idx": class_to_idx,
        "metrics": {
            "test_accuracy": round(test_acc, 4),
            "test_roc_auc": round(test_auc, 4),
            "test_precision": round(test_prec, 4),
            "test_recall": round(test_rec, 4),
            "test_f1": round(test_f1, 4)
        },
        "confusionMatrix": cm.tolist(),
        "anatomicalRegionsCovered": [
            "Elbow", "Fingers & Hand Phalanx", "Forearm (Radius/Ulna)",
            "Humerus", "Shoulder & Clavicle", "Wrist"
        ],
        "trainingDurationSeconds": elapsed,
        "inputResolution": "224x224 RGB",
        "version": "v1.0"
    }

    with open(META_FILE, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n[SAVED] Bone Fracture Metadata: {META_FILE}")
    print(f"[SAVED] Bone Fracture Weights: {MODEL_FILE}")
    return meta


if __name__ == "__main__":
    train_bone_model()
