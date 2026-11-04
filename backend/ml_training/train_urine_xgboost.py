"""
Medi Consult - Model 6: Urine Routine & Microscopy XGBoost Model
Dataset: Mendeley Urine Analysis Dataset (DOI: 10.17632/6xhr6sfsr9.1)
Clinical Targets:
  1. UTI (Urinary Tract Infection / Pyuria)
  2. KIDNEY_DISEASE (Nephropathy / Proteinuria & Urinary Casts)
  3. KIDNEY_STONES (Nephrolithiasis / Hematuria)
"""

import os
import json
import re
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, precision_score, recall_score
import xgboost as xgb

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets" / "urine" / "numerical"
MODELS_DIR = BASE_DIR / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODELS_DIR / "urine_xgboost.json"
META_FILE = MODELS_DIR / "urine_xgboost_meta.json"

FEATURE_NAMES = [
    "Age",
    "Sex_Female",
    "Turbidity",
    "Sediment_Grade",
    "Albumin_Protein_Grade",
    "Sugar_Glucose_Grade",
    "Epithelial_Cells_HPF",
    "Pus_Cells_WBC_HPF",
    "RBC_Erythrocytes_HPF",
    "Casts_Epithelial_Grade",
    "Casts_Granular_Grade"
]


def parse_grade(val):
    """Converts semi-quantitative clinical grades (Nil, Trace, +, ++, +++) to numerical scale."""
    if pd.isna(val):
        return 0.0
    s = str(val).strip().replace('"', '').replace('(', '').replace(')', '')
    if s in ['Nil', 'Not Done', 'Not Found', 'nan', 'None']:
        return 0.0
    if s == 'Trace':
        return 0.5
    if '+' in s:
        return float(s.count('+'))
    try:
        return float(s)
    except Exception:
        return 0.0


def parse_hpf(val):
    """Parses microscopic High Power Field (HPF) ranges (e.g. 2-4/HPF, Plenty/HPF) to quantitative count."""
    if pd.isna(val):
        return 0.0
    s = str(val).strip().replace('"', '').replace('/HPF', '').replace('/hpf', '').strip()
    if s in ['Nil', 'Not Found', 'Not Done', 'nan', 'None']:
        return 0.0
    if 'Plenty' in s:
        return 25.0
    if s == 'Trace':
        return 1.0
    m = re.match(r'(\d+)\s*-\s*(\d+)', s)
    if m:
        return (float(m.group(1)) + float(m.group(2))) / 2.0
    try:
        return float(s)
    except Exception:
        return 0.0


def prepare_dataset():
    """Loads and preprocesses the Mendeley Urinalysis clinical dataset."""
    xlsx_path = DATA_DIR / "UrineDataU.xlsx"
    csv_path = DATA_DIR / "urine_dataset.csv"

    if xlsx_path.exists():
        df = pd.read_excel(xlsx_path)
    elif csv_path.exists():
        df = pd.read_csv(csv_path)
    else:
        raise FileNotFoundError(f"Urinalysis dataset not found in {DATA_DIR}. Run download_urine_dataset.py first.")

    print(f"[DATA] Loaded {len(df)} records from {xlsx_path.name if xlsx_path.exists() else csv_path.name}")

    # Engineered clinical features
    df_feat = pd.DataFrame()
    df_feat["Age"] = pd.to_numeric(df["Age"], errors="coerce").fillna(40.0)
    df_feat["Sex_Female"] = df["Sex"].astype(str).str.strip().map({"Female": 1.0, "Male": 0.0}).fillna(0.0)
    df_feat["Turbidity"] = df["Appearance"].astype(str).str.strip().map({"Turbid": 1.0, "Clear": 0.0}).fillna(0.0)
    df_feat["Sediment_Grade"] = df["Sediment"].apply(parse_grade)
    df_feat["Albumin_Protein_Grade"] = df["Albumin"].apply(parse_grade)
    df_feat["Sugar_Glucose_Grade"] = df["Sugar (Reducing substance)"].apply(parse_grade)
    df_feat["Epithelial_Cells_HPF"] = df["Epithelial cells"].apply(parse_hpf)
    df_feat["Pus_Cells_WBC_HPF"] = df["Pus cells"].apply(parse_hpf)
    df_feat["RBC_Erythrocytes_HPF"] = df["RBC"].apply(parse_hpf)
    df_feat["Casts_Epithelial_Grade"] = df["Casts (Epithelial)"].apply(parse_grade)
    df_feat["Casts_Granular_Grade"] = df["Casts (Granular)"].apply(parse_grade)

    # Multi-label binary targets
    targets = {
        "uti": (df["UTI"].astype(str).str.strip().str.upper() == "YES").astype(int).values,
        "kidney_disease": (df["KIDNEY_DISEASE"].astype(str).str.strip().str.upper() == "YES").astype(int).values,
        "kidney_stones": (df["KIDNEY_STONES"].astype(str).str.strip().str.upper() == "YES").astype(int).values
    }

    return df_feat, targets, df


def train_model():
    print("=" * 65)
    print("MEDI CONSULT - TRAINING MODEL 6: URINE ROUTINE & MICROSCOPY (XGBOOST)")
    print("=" * 65)

    X_df, targets, raw_df = prepare_dataset()
    X = X_df[FEATURE_NAMES].values

    # Unified primary risk target (Positive if any condition is present)
    y_any = ((targets["uti"] == 1) | (targets["kidney_disease"] == 1) | (targets["kidney_stones"] == 1)).astype(int)

    # Train / Test split (stratified by any pathological condition)
    X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
        X, y_any, np.arange(len(y_any)), test_size=0.20, random_state=42, stratify=y_any
    )

    pos_count = int(np.sum(y_train))
    neg_count = len(y_train) - pos_count
    pos_weight = float(np.clip(neg_count / max(1, pos_count), 1.0, 10.0))

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURE_NAMES)
    dtest = xgb.DMatrix(X_test, label=y_test, feature_names=FEATURE_NAMES)

    params = {
        "objective": "binary:logistic",
        "eval_metric": ["logloss", "auc"],
        "max_depth": 4,
        "learning_rate": 0.05,
        "scale_pos_weight": pos_weight,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "seed": 42
    }

    print("\n[TRAINING] Fitting XGBoost Classifier on 11 Urinalysis Biomarkers...")
    evallist = [(dtrain, "train"), (dtest, "eval")]
    booster = xgb.train(params, dtrain, num_boost_round=120, evals=evallist, verbose_eval=False)

    # Evaluation
    test_probs = booster.predict(dtest)
    test_preds = (test_probs >= 0.50).astype(int)

    acc = float(accuracy_score(y_test, test_preds))
    auc = float(roc_auc_score(y_test, test_probs))
    f1 = float(f1_score(y_test, test_preds))
    prec = float(precision_score(y_test, test_preds))
    rec = float(recall_score(y_test, test_preds))

    print(f"\n[EVALUATION] Overall Pathology Detection Performance:")
    print(f"  Accuracy:  {acc * 100:.2f}%")
    print(f"  ROC-AUC:   {auc:.4f}")
    print(f"  Precision: {prec * 100:.2f}%")
    print(f"  Recall:    {rec * 100:.2f}%")
    print(f"  F1-Score:  {f1:.4f}")

    # Sub-target evaluation
    sub_metrics = {}
    for t_name, y_vec in targets.items():
        y_sub_test = y_vec[idx_test]
        # Train lightweight sub-classifiers for disease-specific probability heads
        dtrain_sub = xgb.DMatrix(X_train, label=y_vec[idx_train], feature_names=FEATURE_NAMES)
        sub_pos_weight = float(np.clip((len(y_train) - np.sum(y_vec[idx_train])) / max(1, np.sum(y_vec[idx_train])), 1.0, 10.0))
        sub_params = {**params, "scale_pos_weight": sub_pos_weight}
        sub_booster = xgb.train(sub_params, dtrain_sub, num_boost_round=80, verbose_eval=False)
        sub_probs = sub_booster.predict(dtest)
        sub_preds = (sub_probs >= 0.50).astype(int)

        sub_auc = float(roc_auc_score(y_sub_test, sub_probs)) if len(np.unique(y_sub_test)) > 1 else 1.0
        sub_acc = float(accuracy_score(y_sub_test, sub_preds))
        sub_metrics[t_name] = {
            "accuracy": round(sub_acc, 4),
            "roc_auc": round(sub_auc, 4),
            "prevalencePct": round(float(np.mean(y_vec)) * 100, 1)
        }
        print(f"  -> {t_name.upper()}: ROC-AUC = {sub_auc:.4f}, Accuracy = {sub_acc*100:.2f}%")

    # Feature Importance
    importance = booster.get_score(importance_type="gain")
    sorted_importance = {k: round(float(v), 2) for k, v in sorted(importance.items(), key=lambda x: x[1], reverse=True)}

    # Save Booster
    booster.save_model(str(MODEL_FILE))
    print(f"\n[SAVED] Urine XGBoost Model: {MODEL_FILE}")

    # Save Metadata
    meta = {
        "modelName": "Urine Routine & Microscopy XGBoost Model",
        "modelType": "XGBoost Classifier",
        "clinicalCategory": "Nephrology & Urology / Urinalysis",
        "datasetSource": "Mendeley Urinalysis Dataset (DOI: 10.17632/6xhr6sfsr9.1)",
        "samplesTrained": len(X_train),
        "samplesEvaluated": len(X_test),
        "features": FEATURE_NAMES,
        "featureImportanceGain": sorted_importance,
        "metrics": {
            "accuracy": round(acc, 4),
            "roc_auc": round(auc, 4),
            "f1_score": round(f1, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4)
        },
        "subTargets": sub_metrics,
        "referenceRanges": {
            "Turbidity": {"normal": "Clear", "unit": ""},
            "Albumin_Protein_Grade": {"normal": "Nil / Trace (<1+)", "unit": "Grade"},
            "Sugar_Glucose_Grade": {"normal": "Nil", "unit": "Grade"},
            "Pus_Cells_WBC_HPF": {"normal": "< 5 / HPF", "unit": "/HPF"},
            "RBC_Erythrocytes_HPF": {"normal": "< 3 / HPF", "unit": "/HPF"},
            "Epithelial_Cells_HPF": {"normal": "< 5 / HPF", "unit": "/HPF"},
            "Casts_Epithelial_Grade": {"normal": "Nil / Not Found", "unit": "Grade"},
            "Casts_Granular_Grade": {"normal": "Nil / Not Found", "unit": "Grade"}
        },
        "baselineMedians": {
            "Age": 40.0,
            "Sex_Female": 0.5,
            "Turbidity": 0.0,
            "Sediment_Grade": 0.0,
            "Albumin_Protein_Grade": 0.0,
            "Sugar_Glucose_Grade": 0.0,
            "Epithelial_Cells_HPF": 3.0,
            "Pus_Cells_WBC_HPF": 2.0,
            "RBC_Erythrocytes_HPF": 1.0,
            "Casts_Epithelial_Grade": 0.0,
            "Casts_Granular_Grade": 0.0
        }
    }

    with open(META_FILE, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"[SAVED] Metadata and Reference Ranges: {META_FILE}")

    return meta


if __name__ == "__main__":
    train_model()

