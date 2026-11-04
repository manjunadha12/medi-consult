"""
Medi Consult Model 6 - Urine Routine & Microscopy Dataset Downloader & Inspector
Downloads the Mendeley Urinalysis Dataset (DOI: 10.17632/6xhr6sfsr9.1)
Using the Mendeley Data Public Open-Access API & Direct CDN
"""

import os
import sys
import json
from pathlib import Path
import requests
import pandas as pd

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR / "datasets" / "urine" / "numerical"
DATASETS_DIR.mkdir(parents=True, exist_ok=True)

EXCEL_PATH = DATASETS_DIR / "UrineDataU.xlsx"
CSV_PATH = DATASETS_DIR / "urine_dataset.csv"

# Dataset metadata
DATASET_ID = "6xhr6sfsr9"
DATASET_VERSION = 1
DIRECT_API_FILES_URL = f"https://data.mendeley.com/api/datasets/{DATASET_ID}/files"
FALLBACK_DIRECT_URL = "https://data.mendeley.com/public-files/datasets/6xhr6sfsr9/files/c9a6e5ef-c0c8-4135-9403-a51e3d8794fc/file_downloaded"


def get_download_url_via_mendeley_api():
    """Attempts to resolve the live download URL using Mendeley Data API."""
    client_id = os.getenv("MENDELEY_CLIENT_ID")
    client_secret = os.getenv("MENDELEY_CLIENT_SECRET")

    # 1. If OAuth2 credentials exist in .env, authenticate first
    if client_id and client_secret:
        try:
            print("[AUTH] Authenticating with Mendeley OAuth2 API...")
            token_resp = requests.post(
                "https://auth.data.mendeley.com/oauth2/token",
                auth=(client_id, client_secret),
                data={"grant_type": "client_credentials", "scope": "openid profile email dcd:profile"},
                timeout=20
            )
            if token_resp.status_code == 200:
                token = token_resp.json().get("access_token")
                print("  [SUCCESS] OAuth2 Bearer token obtained.")
                headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
                resp = requests.get(DIRECT_API_FILES_URL, headers=headers, timeout=20)
                if resp.status_code == 200:
                    files = resp.json()
                    for f in files:
                        if "UrineDataU" in f.get("filename", ""):
                            return f.get("content_details", {}).get("download_url") or FALLBACK_DIRECT_URL
        except Exception as auth_err:
            print(f"  [WARN] OAuth2 attempt error: {auth_err}. Falling back to Open-Access endpoint...")

    # 2. Public Open-Access API check (No credentials needed for CC BY 4.0)
    try:
        print("[API] Checking Mendeley Data Public Open-Access Endpoint...")
        resp = requests.get(DIRECT_API_FILES_URL, headers={"Accept": "application/json", "User-Agent": "MediConsult/1.0"}, timeout=15)
        if resp.status_code == 200:
            files = resp.json()
            for f in files:
                if "UrineDataU" in f.get("filename", ""):
                    url = f.get("content_details", {}).get("download_url")
                    if url:
                        print(f"  [RESOLVED] Public Download URL: {url}")
                        return url
    except Exception as e:
        print(f"  [WARN] Public API endpoint query error: {e}")

    # 3. Direct Permanent CDN fallback
    print(f"  [FALLBACK] Using verified permanent CDN endpoint: {FALLBACK_DIRECT_URL}")
    return FALLBACK_DIRECT_URL


def download_dataset():
    """Downloads UrineDataU.xlsx into the designated dataset directory."""
    if EXCEL_PATH.exists() and EXCEL_PATH.stat().st_size > 5000:
        print(f"[CACHE] Found existing dataset at: {EXCEL_PATH} ({EXCEL_PATH.stat().st_size:,} bytes)")
        return EXCEL_PATH

    download_url = get_download_url_via_mendeley_api()
    print(f"[DOWNLOAD] Streaming Mendeley Urine Analysis Dataset...")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*"
    }
    
    resp = requests.get(download_url, headers=headers, stream=True, timeout=60)
    resp.raise_for_status()

    total_bytes = 0
    with open(EXCEL_PATH, "wb") as f:
        for chunk in resp.iter_content(chunk_size=32768):
            if chunk:
                f.write(chunk)
                total_bytes += len(chunk)

    print(f"[SUCCESS] Downloaded: {EXCEL_PATH} ({total_bytes:,} bytes)")
    return EXCEL_PATH


def inspect_dataset(file_path):
    """Loads and inspects the Urinalysis dataset."""
    print("\n" + "=" * 70)
    print("MEDI CONSULT MODEL 6 - URINALYSIS DATASET INSPECTION")
    print("=" * 70)

    df = pd.read_excel(file_path)

    print(f"\n1. Dataset Shape (Rows, Columns): {df.shape}")

    print("\n2. Column Names (df.columns.tolist()):")
    print(df.columns.tolist())

    print("\n3. First 10 Records (df.head(10)):")
    pd.set_option("display.max_columns", None)
    pd.set_option("display.width", 1000)
    print(df.head(10))

    print("\n4. Missing Values Count (df.isnull().sum()):")
    print(df.isnull().sum())

    print("\n5. Data Types (df.dtypes):")
    print(df.dtypes)

    print("\n6. Statistical Summary (df.describe(include='all')):")
    print(df.describe(include="all"))

    # Save CSV copy for high-speed ML training
    df.to_csv(CSV_PATH, index=False)
    print(f"\n[CACHE] Saved tabular CSV copy to: {CSV_PATH}")

    # Also save a root-accessible copy if needed
    root_datasets_dir = BASE_DIR.parent / "datasets"
    if root_datasets_dir.exists():
        root_file = root_datasets_dir / "UrineDataU.xlsx"
        try:
            import shutil
            shutil.copy2(EXCEL_PATH, root_file)
            print(f"[SYNC] Mirrored copy to root datasets: {root_file}")
        except Exception:
            pass

    return df


if __name__ == "__main__":
    try:
        path = download_dataset()
        inspect_dataset(path)
    except Exception as e:
        print(f"[ERROR] Failed to download/inspect urinalysis dataset: {e}", file=sys.stderr)
        sys.exit(1)
