"""
Medi Consult - Medical Dataset Downloader
Downloads medical datasets across five core clinical diagnostic categories:
1. Blood tests     - MIMIC-IV / Clinical Demo (XGBoost)
2. Chest X-ray     - NIH Chest X-ray 14 (DenseNet121)
3. Lung CT         - LIDC-IDRI 5 sample series via TCIA (3D U-Net)
4. Brain MRI       - BraTS via Synapse (3D U-Net)
5. ECG             - PTB-XL 1.0.3 via PhysioNet (1D CNN)

Environment variables for credentialed access:
- $env:PHYSIONET_USERNAME and $env:PHYSIONET_PASSWORD (MIMIC-IV)
- $env:BRATS_SYNAPSE_ID and $env:SYNAPSE_AUTH_TOKEN (BraTS)
- $env:DOWNLOAD_FULL_ECG="1" (Optional: Download all 3GB of PTB-XL waveforms)
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
import requests

# Base directory setup
BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets"

FOLDERS = {
    "blood": DATASETS_DIR / "blood",
    "chest_xray": DATASETS_DIR / "chest-xray",
    "lung_ct": DATASETS_DIR / "lung-ct",
    "brain_mri": DATASETS_DIR / "brain-mri",
    "ecg": DATASETS_DIR / "ecg",
}

# Ensure folders exist
for folder in FOLDERS.values():
    folder.mkdir(parents=True, exist_ok=True)


def run_command(cmd_list):
    """Executes a command safely, handling python module invocations on Windows."""
    if isinstance(cmd_list, list) and cmd_list and cmd_list[0] == "physionet":
        if shutil.which("physionet") is None:
            cmd_list = [sys.executable, "-m", "physionet"] + cmd_list[1:]
    print(f"Executing: {' '.join(str(c) for c in cmd_list)}")
    return subprocess.run(cmd_list, check=True)


# -------------------------------------------------
# 1. Blood tests - MIMIC-IV
# PhysioNet dataset (XGBoost)
# -------------------------------------------------
def download_mimic():
    print("\n" + "=" * 60)
    print("[1/5] Blood Tests - MIMIC-IV")
    print("=" * 60)

    username = os.getenv("PHYSIONET_USERNAME")
    password = os.getenv("PHYSIONET_PASSWORD")

    if not username or not password:
        print("Skipped full MIMIC-IV: Requires credentialed PhysioNet access.")
        print("To configure access later:")
        print('  $env:PHYSIONET_USERNAME="YOUR_USERNAME"')
        print('  $env:PHYSIONET_PASSWORD="YOUR_PASSWORD"')
        print("\nDownloading public MIMIC-IV Clinical Demo (v2.2) lab events & dictionary")
        print("so offline development & XGBoost model training can begin immediately...")

        demo_url_base = "https://physionet.org/files/mimic-iv-demo/2.2/hosp"
        files_to_download = [
            "d_labitems.csv.gz",
            "labevents.csv.gz",
        ]

        for fname in files_to_download:
            dest = FOLDERS["blood"] / fname
            if dest.exists() and dest.stat().st_size > 0:
                print(f"  [Exists] {fname} ({dest.stat().st_size / 1024:.1f} KB)")
                continue

            url = f"{demo_url_base}/{fname}"
            print(f"  Downloading {fname} from PhysioNet...")
            resp = requests.get(url, stream=True, timeout=60, allow_redirects=True)
            resp.raise_for_status()
            with open(dest, "wb") as out_f:
                for chunk in resp.iter_content(chunk_size=65536):
                    if chunk:
                        out_f.write(chunk)
            print(f"  [Saved] {fname} ({dest.stat().st_size / 1024:.1f} KB)")

        print("Blood test dataset ready in:", FOLDERS["blood"])
        return

    # Credentialed download
    try:
        run_command([
            "physionet", "download", "mimiciv",
            "--version", "2.2",
            "--output", str(FOLDERS["blood"]),
            "--username", username,
            "--password", password,
            "--include", "hosp/labevents.csv.gz",
            "--include", "hosp/d_labitems.csv.gz"
        ])
        print("MIMIC-IV lab records downloaded successfully.")
    except Exception as error:
        print("MIMIC-IV download failed:", error)


# -------------------------------------------------
# 2. Chest X-ray - NIH Chest X-ray 14
# Kaggle / NIH Archive (DenseNet121)
# -------------------------------------------------
def download_chest_xray():
    print("\n" + "=" * 60)
    print("[2/5] Chest X-Ray - NIH Chest X-ray 14")
    print("=" * 60)

    target_csv = FOLDERS["chest_xray"] / "Data_Entry_2017.csv"

    if target_csv.exists() and target_csv.stat().st_size > 0:
        print(f"  [Exists] Data_Entry_2017.csv ({target_csv.stat().st_size / 1024:.1f} KB)")
    else:
        try:
            import kagglehub
            print("Downloading Data_Entry_2017.csv via kagglehub...")
            downloaded = kagglehub.dataset_download("nih-chest-xrays/data", path="Data_Entry_2017.csv")
            src_file = Path(downloaded)
            if src_file.is_dir():
                src_file = src_file / "Data_Entry_2017.csv"
            if src_file.exists():
                shutil.copy2(src_file, target_csv)
                print(f"  [Saved] Data_Entry_2017.csv ({target_csv.stat().st_size / 1024:.1f} KB)")
        except Exception as error:
            print("kagglehub download notice:", error)
            print("Fetching Data_Entry_2017.csv from public NIH mirror...")
            try:
                nih_url = "https://raw.githubusercontent.com/nih-chest-xrays/nih-chest-xrays.github.io/master/Data_Entry_2017.csv"
                resp = requests.get(nih_url, stream=True, timeout=30)
                if resp.status_code == 200:
                    with open(target_csv, "wb") as f:
                        for chunk in resp.iter_content(chunk_size=65536):
                            if chunk:
                                f.write(chunk)
                    print(f"  [Saved] Data_Entry_2017.csv ({target_csv.stat().st_size / 1024:.1f} KB)")
            except Exception as e:
                print("NIH direct download notice:", e)

    # Also download train_val_list.txt and test_list.txt split metadata
    for split_name in ["train_val_list.txt", "test_list.txt"]:
        split_dest = FOLDERS["chest_xray"] / split_name
        if not split_dest.exists():
            try:
                import kagglehub
                downloaded = kagglehub.dataset_download("nih-chest-xrays/data", path=split_name)
                src = Path(downloaded)
                if src.is_dir():
                    src = src / split_name
                if src.exists():
                    shutil.copy2(src, split_dest)
                    print(f"  [Saved] {split_name}")
            except Exception:
                pass

    print("Chest X-ray metadata and ground truth labels ready in:", FOLDERS["chest_xray"])


# -------------------------------------------------
# 3. Lung CT - LIDC-IDRI
# TCIA NBIA dataset (3D U-Net)
# -------------------------------------------------
def download_lung_ct():
    print("\n" + "=" * 60)
    print("[3/5] Lung CT - LIDC-IDRI (5 Sample Series)")
    print("=" * 60)

    existing_files = list(FOLDERS["lung_ct"].glob("*"))
    if len(existing_files) >= 5:
        print(f"  [Exists] {len(existing_files)} CT series already present in {FOLDERS['lung_ct']}")
        return

    try:
        from tcia_utils import nbia
        print("Querying TCIA NBIA for LIDC-IDRI CT series...")
        series_df = nbia.getSeries(collection="LIDC-IDRI", modality="CT", format="df")

        if series_df is not None and not series_df.empty:
            print(f"Found {len(series_df)} CT series.")
            print("Downloading 5 sample CT series as requested for test & 3D U-Net prototyping...")
            nbia.downloadSeries(series_df, number=5, path=str(FOLDERS["lung_ct"]), input_type="df")
            print("Lung CT 5 series download finished successfully.")
        else:
            print("No CT series found in TCIA NBIA response.")
    except Exception as error:
        print("Lung CT download failed:", error)


# -------------------------------------------------
# 4. Brain MRI - BraTS
# Synapse dataset (3D U-Net)
# -------------------------------------------------
def download_brain_mri():
    print("\n" + "=" * 60)
    print("[4/5] Brain MRI - BraTS")
    print("=" * 60)

    synapse_token = os.getenv("SYNAPSE_AUTH_TOKEN")
    synapse_id = os.getenv("BRATS_SYNAPSE_ID")

    if not synapse_token or not synapse_id:
        print("Skipped: BraTS requires approved Synapse credentials.")
        print("Set BRATS_SYNAPSE_ID and SYNAPSE_AUTH_TOKEN in your environment to download:")
        print('  $env:BRATS_SYNAPSE_ID="YOUR_APPROVED_SYNAPSE_ID"')
        print('  $env:SYNAPSE_AUTH_TOKEN="YOUR_SYNAPSE_TOKEN"')
        print("To apply for access, visit: https://www.synapse.org/")
        return

    try:
        import synapseclient
        syn = synapseclient.Synapse()
        syn.login(authToken=synapse_token)
        result = syn.get(
            synapse_id,
            downloadLocation=str(FOLDERS["brain_mri"])
        )
        print("Downloaded BraTS dataset to:", result.path)
    except Exception as error:
        print("BraTS download failed:", error)


# -------------------------------------------------
# 5. ECG - PTB-XL
# PhysioNet dataset (1D CNN)
# -------------------------------------------------
def download_ecg():
    print("\n" + "=" * 60)
    print("[5/5] PTB-XL ECG (1.0.3)")
    print("=" * 60)

    # 1. Ensure metadata tables (ptbxl_database.csv & scp_statements.csv) are immediately downloaded
    target_csv = FOLDERS["ecg"] / "ptbxl_database.csv"
    statements_csv = FOLDERS["ecg"] / "scp_statements.csv"

    base_url = "https://physionet.org/files/ptb-xl/1.0.3"
    for fname, path_obj in [("ptbxl_database.csv", target_csv), ("scp_statements.csv", statements_csv)]:
        if path_obj.exists() and path_obj.stat().st_size > 0:
            print(f"  [Exists] {fname} ({path_obj.stat().st_size / 1024:.1f} KB)")
        else:
            print(f"  Downloading {fname} from PhysioNet...")
            try:
                r = requests.get(f"{base_url}/{fname}", stream=True, timeout=60, allow_redirects=True)
                r.raise_for_status()
                with open(path_obj, "wb") as f:
                    for chunk in r.iter_content(chunk_size=65536):
                        if chunk:
                            f.write(chunk)
                print(f"  [Saved] {fname} ({path_obj.stat().st_size / 1024:.1f} KB)")
            except Exception as e:
                print(f"  Could not download {fname}: {e}")

    # 2. Check if full waveform download was requested via env var
    download_full = os.getenv("DOWNLOAD_FULL_ECG", "").strip().lower() in ("1", "true", "yes")
    if download_full:
        print("\nFull waveform download requested ($env:DOWNLOAD_FULL_ECG=1).")
        print("Downloading entire PTB-XL archive (~3 GB)...")
        run_command([
            "physionet", "download", "ptb-xl",
            "--version", "1.0.3",
            "--output", str(FOLDERS["ecg"])
        ])
    else:
        print("\nPTB-XL ECG database table & diagnostic SCP statements are ready in:", FOLDERS["ecg"])
        print("Note: The complete PTB-XL waveform dataset contains 43,000 files (~3 GB).")
        print("To download the full waveform collection, run:")
        print('  $env:DOWNLOAD_FULL_ECG="1"')
        print("  python download_datasets.py")
        print("or run directly:")
        print(f"  python -m physionet download ptb-xl --version 1.0.3 --output {FOLDERS['ecg']}")


# -------------------------------------------------
# MAIN
# -------------------------------------------------
if __name__ == "__main__":
    print("\n" + "#" * 60)
    print("MEDI CONSULT - MEDICAL DATASET DOWNLOADER")
    print("#" * 60)

    tasks = [
        ("Blood tests", download_mimic),
        ("Chest X-ray", download_chest_xray),
        ("Lung CT", download_lung_ct),
        ("Brain MRI", download_brain_mri),
        ("ECG", download_ecg),
    ]

    for name, task in tasks:
        try:
            task()
        except Exception as error:
            print(f"{name} error:", error)

    print("\n" + "=" * 60)
    print("DATASET DOWNLOAD PROCESS FINISHED")
    print("Check the 'backend/datasets' folder for downloaded files.")
    print("=" * 60 + "\n")
