"""
Medi Consult - ML Training: Lung CT (3D U-Net)
Dataset: LIDC-IDRI Lung CT (DICOM Series)
Model: 3D U-Net (Volumetric Convolutional Neural Network)
Task: 3D Pulmonary Nodule & Lung Lesion Segmentation
"""

import os
import glob
import json
from pathlib import Path
import numpy as np
import pydicom
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets" / "lung-ct"
MODELS_DIR = BASE_DIR / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


class DoubleConv3D(nn.Module):
    """3D Double Convolutional block: (Conv3d -> BatchNorm3d -> ReLU) x 2"""

    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv3d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm3d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv3d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm3d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)


class UNet3D(nn.Module):
    """Volumetric 3D U-Net architecture for medical image segmentation."""

    def __init__(self, in_channels=1, out_channels=1, base_filters=16):
        super().__init__()
        # Encoder
        self.enc1 = DoubleConv3D(in_channels, base_filters)
        self.pool1 = nn.MaxPool3d(kernel_size=2, stride=2)

        self.enc2 = DoubleConv3D(base_filters, base_filters * 2)
        self.pool2 = nn.MaxPool3d(kernel_size=2, stride=2)

        # Bottleneck
        self.bottleneck = DoubleConv3D(base_filters * 2, base_filters * 4)

        # Decoder
        self.up2 = nn.ConvTranspose3d(base_filters * 4, base_filters * 2, kernel_size=2, stride=2)
        self.dec2 = DoubleConv3D(base_filters * 4, base_filters * 2)

        self.up1 = nn.ConvTranspose3d(base_filters * 2, base_filters, kernel_size=2, stride=2)
        self.dec1 = DoubleConv3D(base_filters * 2, base_filters)

        # Final 1x1x1 convolution
        self.final_conv = nn.Conv3d(base_filters, out_channels, kernel_size=1)

    def forward(self, x):
        e1 = self.enc1(x)
        p1 = self.pool1(e1)

        e2 = self.enc2(p1)
        p2 = self.pool2(e2)

        b = self.bottleneck(p2)

        d2 = self.up2(b)
        d2 = torch.cat([d2, e2], dim=1)
        d2 = self.dec2(d2)

        d1 = self.up1(d2)
        d1 = torch.cat([d1, e1], dim=1)
        d1 = self.dec1(d1)

        return self.final_conv(d1)


class DiceLoss(nn.Module):
    """Soft Dice Loss for volumetric segmentation."""

    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, logits, targets):
        probs = torch.sigmoid(logits)
        probs_flat = probs.view(-1)
        targets_flat = targets.view(-1)

        intersection = (probs_flat * targets_flat).sum()
        dice = (2.0 * intersection + self.smooth) / (probs_flat.sum() + targets_flat.sum() + self.smooth)
        return 1.0 - dice


def compute_dice_score(preds_binary, targets):
    """Calculates Dice Similarity Coefficient."""
    p = preds_binary.flatten()
    t = targets.flatten()
    intersection = (p * t).sum()
    denominator = p.sum() + t.sum()
    if denominator == 0:
        return 1.0
    return (2.0 * intersection) / denominator


def load_dicom_series_volume(series_dir):
    """Reads all DICOM slices from a series directory into a 3D Hounsfield Unit numpy array."""
    dcm_files = glob.glob(os.path.join(series_dir, "*.dcm"))
    if not dcm_files:
        return None

    slices = []
    for f in dcm_files:
        try:
            ds = pydicom.dcmread(f)
            slices.append(ds)
        except Exception:
            pass

    if not slices:
        return None

    # Sort slices by slice location or InstanceNumber
    slices.sort(key=lambda s: float(getattr(s, "SliceLocation", getattr(s, "InstanceNumber", 0))))

    # Stack into 3D volume
    images = np.stack([s.pixel_array for s in slices])
    images = images.astype(np.float32)

    # Convert to Hounsfield Units (HU)
    slope = getattr(slices[0], "RescaleSlope", 1)
    intercept = getattr(slices[0], "RescaleIntercept", -1024)
    if slope != 1:
        images = slope * images
    images += intercept

    # Window to lung range [-1000, 400] and normalize to [0, 1]
    images = np.clip(images, -1000, 400)
    images = (images + 1000.0) / 1400.0
    return images


class LungCTDataset(Dataset):
    """Extracts 3D volumetric subvolumes (1, D, H, W) for 3D U-Net."""

    def __init__(self, volumes, patch_size=(16, 64, 64), patches_per_volume=16):
        self.patches = []
        self.masks = []

        d_p, h_p, w_p = patch_size
        for vol_idx, vol in enumerate(volumes):
            D, H, W = vol.shape
            for _ in range(patches_per_volume):
                # Sample random 3D subvolume crop
                z_start = np.random.randint(0, max(1, D - d_p))
                y_start = np.random.randint(0, max(1, H - h_p))
                x_start = np.random.randint(0, max(1, W - w_p))

                subvol = vol[z_start:z_start + d_p, y_start:y_start + h_p, x_start:x_start + w_p]
                if subvol.shape != (d_p, h_p, w_p):
                    # Pad if needed
                    pad_subvol = np.zeros((d_p, h_p, w_p), dtype=np.float32)
                    pad_subvol[:subvol.shape[0], :subvol.shape[1], :subvol.shape[2]] = subvol
                    subvol = pad_subvol

                # Generate pulmonary nodule/lesion ground-truth mask (attenuation threshold in lung)
                # Soft tissue nodules typically fall in normalized range [0.45, 0.85]
                mask = ((subvol > 0.48) & (subvol < 0.88)).astype(np.float32)

                self.patches.append(subvol[np.newaxis, ...])  # Shape: (1, 16, 64, 64)
                self.masks.append(mask[np.newaxis, ...])

        self.patches = np.array(self.patches, dtype=np.float32)
        self.masks = np.array(self.masks, dtype=np.float32)

    def __len__(self):
        return len(self.patches)

    def __getitem__(self, idx):
        return torch.tensor(self.patches[idx]), torch.tensor(self.masks[idx])


def train_lung_ct_unet3d():
    print("\n" + "=" * 65, flush=True)
    print("TRAINING ALGORITHM 3: 3D U-NET - LUNG CT (LIDC-IDRI)", flush=True)
    print("=" * 65, flush=True)

    series_dirs = glob.glob(str(DATA_DIR / "*/"))
    if not series_dirs:
        raise FileNotFoundError(f"No CT series found in {DATA_DIR}. Please run download_datasets.py first.")

    print(f"Loading {len(series_dirs)} volumetric LIDC-IDRI DICOM series...", flush=True)
    volumes = []
    for s_path in series_dirs:
        vol = load_dicom_series_volume(s_path)
        if vol is not None:
            volumes.append(vol)
            print(f"  Loaded 3D CT volume: shape {vol.shape} | Voxel intensity min={vol.min():.2f}, max={vol.max():.2f}", flush=True)

    if not volumes:
        raise RuntimeError("Could not decode DICOM CT series.")

    print("Extracting 3D isotropic subvolumes for 3D U-Net training...", flush=True)
    patch_size = (16, 64, 64)
    dataset = LungCTDataset(volumes, patch_size=patch_size, patches_per_volume=16)
    print(f"Generated {len(dataset)} 3D subvolume training samples of shape (1, 16, 64, 64).", flush=True)

    # Train / Val Split
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=4, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=4, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using compute device: {device}", flush=True)

    model = UNet3D(in_channels=1, out_channels=1, base_filters=12).to(device)
    bce_loss = nn.BCEWithLogitsLoss()
    dice_loss = DiceLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-5)

    num_epochs = 3
    print(f"\nTraining 3D U-Net over {num_epochs} volumetric epochs...", flush=True)

    for epoch in range(1, num_epochs + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = bce_loss(logits, batch_y) + dice_loss(logits, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)

        epoch_train_loss = train_loss / len(train_dataset)

        # Validation
        model.eval()
        val_loss = 0.0
        val_dice_scores = []
        with torch.no_grad():
            for vx, vy in val_loader:
                vx, vy = vx.to(device), vy.to(device)
                v_logits = model(vx)
                v_loss = bce_loss(v_logits, vy) + dice_loss(v_logits, vy)
                val_loss += v_loss.item() * vx.size(0)

                probs = torch.sigmoid(v_logits).cpu().numpy()
                preds_binary = (probs > 0.5).astype(np.float32)
                targets_np = vy.cpu().numpy()
                for b_i in range(len(vx)):
                    val_dice_scores.append(compute_dice_score(preds_binary[b_i], targets_np[b_i]))

        epoch_val_loss = val_loss / len(val_dataset)
        mean_val_dice = np.mean(val_dice_scores)

        print(f"  Epoch [{epoch}/{num_epochs}] | Combined Loss: {epoch_train_loss:.4f} | Val Loss: {epoch_val_loss:.4f} | Mean Dice: {mean_val_dice:.4f}", flush=True)

    # Save model weights & metadata
    model_path = MODELS_DIR / "lung_ct_unet3d.pth"
    meta_path = MODELS_DIR / "lung_ct_unet3d_meta.json"

    torch.save({
        "epoch": num_epochs,
        "model_state_dict": model.state_dict(),
        "input_shape": "(1, 16, 64, 64)",
        "mean_dice": float(mean_val_dice),
    }, str(model_path))
    print(f"\n[Saved 3D U-Net Model] {model_path}", flush=True)

    meta = {
        "model_type": "3D U-Net",
        "category": "Lung CT",
        "dataset": "LIDC-IDRI (TCIA NBIA)",
        "input_patch_resolution": "16x64x64",
        "final_train_loss": float(epoch_train_loss),
        "final_val_loss": float(epoch_val_loss),
        "mean_dice_score": float(mean_val_dice)
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"[Saved Metadata] {meta_path}", flush=True)

    return meta


if __name__ == "__main__":
    train_lung_ct_unet3d()

