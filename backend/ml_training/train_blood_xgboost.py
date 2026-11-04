"""
Medi Consult - ML Training: Blood Tests (XGBoost)
Dataset: MIMIC-IV / Clinical Demo (labevents.csv.gz, d_labitems.csv.gz)
Model: Extreme Gradient Boosting (XGBClassifier)
Task: Clinical abnormality & biomarker risk prediction from blood panels
"""

import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report
)
import xgboost as xgb

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets" / "blood"
MODELS_DIR = BASE_DIR / "trained_models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def prepare_blood_dataset():
    """Extracts, cleans, and pivots MIMIC-IV blood lab events into a clinical panel matrix."""
    labevents_path = DATA_DIR / "labevents.csv.gz"
    labitems_path = DATA_DIR / "d_labitems.csv.gz"

    if not labevents_path.exists() or not labitems_path.exists():
        raise FileNotFoundError(
            f"Blood test dataset not found in {DATA_DIR}. Please run download_datasets.py first."
        )

    print("Loading MIMIC-IV blood test events and dictionary...")
    df_events = pd.read_csv(labevents_path)
    df_items = pd.read_csv(labitems_path)

    # Merge to match item IDs with human-readable clinical names
    df = df_events.merge(df_items[["itemid", "label", "fluid"]], on="itemid")
    df = df[df["fluid"] == "Blood"].dropna(subset=["valuenum"])

    # Identify top 20 most frequent blood biomarkers (CBC + CMP panels)
    top_biomarkers = df["label"].value_counts().head(20).index.tolist()
    print(f"Selected Top {len(top_biomarkers)} Clinical Blood Biomarkers:")
    for i, name in enumerate(top_biomarkers, 1):
        print(f"  {i:02d}. {name}")

    sub_df = df[df["label"].isin(top_biomarkers)].copy()
    sub_df["is_abnormal"] = (sub_df["flag"] == "abnormal").astype(int)

    # Pivot into patient-specimen blood panels
    print("Pivoting records into patient panel feature vectors...")
    feature_matrix = sub_df.pivot_table(
        index="specimen_id",
        columns="label",
        values="valuenum",
        aggfunc="mean"
    )

    # Clinical outcome target: Panel contains acute abnormal decompensation
    panel_labels = sub_df.groupby("specimen_id")["is_abnormal"].max()
    feature_matrix["target"] = panel_labels

    # Clean and impute missing biomarker values with column medians
    feature_cols = [c for c in feature_matrix.columns if c != "target"]
    for col in feature_cols:
        col_median = feature_matrix[col].median()
        feature_matrix[col] = feature_matrix[col].fillna(col_median if pd.notna(col_median) else 0)

    X = feature_matrix[feature_cols].copy()
    y = feature_matrix["target"].astype(int).values

    print(f"Dataset prepared successfully: {X.shape[0]} patient panels, {X.shape[1]} features.")
    print(f"Target distribution: Normal={np.sum(y == 0)}, Abnormal={np.sum(y == 1)}")
    return X, y, feature_cols


def train_blood_xgboost():
    print("\n" + "=" * 65)
    print("TRAINING ALGORITHM 1: XGBOOST - BLOOD TESTS (MIMIC-IV)")
    print("=" * 65)

    X, y, feature_names = prepare_blood_dataset()

    # Stratified Train/Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train set: {X_train.shape[0]} samples | Test set: {X_test.shape[0]} samples")

    # Handle class imbalance if abnormal cases outnumber normal panels
    neg_count = np.sum(y_train == 0)
    pos_count = np.sum(y_train == 1)
    scale_pos_weight = (neg_count / max(1, pos_count)) if pos_count > 0 else 1.0

    print("Configuring XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1
    )

    print("Training XGBoost model on clinical blood panels...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )

    # Evaluate predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    try:
        roc_auc = roc_auc_score(y_test, y_prob)
    except Exception:
        roc_auc = 0.5

    print("\n" + "-" * 50)
    print("EVALUATION RESULTS (TEST SET):")
    print(f"  Accuracy:  {acc * 100:.2f}%")
    print(f"  Precision: {prec * 100:.2f}%")
    print(f"  Recall:    {rec * 100:.2f}%")
    print(f"  F1 Score:  {f1 * 100:.2f}%")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    print("-" * 50)

    # Feature Importance
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print("\nTop 5 Most Predictive Blood Biomarkers:")
    for rank, idx in enumerate(sorted_idx[:5], 1):
        print(f"  {rank}. {feature_names[idx]}: {importances[idx] * 100:.2f}% importance")

    # Save trained model and metadata
    model_path = MODELS_DIR / "blood_xgboost.json"
    meta_path = MODELS_DIR / "blood_xgboost_meta.json"

    model.save_model(str(model_path))
    print(f"\n[Saved Model] {model_path}")

    meta = {
        "model_type": "XGBoost",
        "category": "Blood tests",
        "dataset": "MIMIC-IV / Clinical Demo",
        "features": feature_names,
        "metrics": {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(roc_auc)
        },
        "top_features": [
            {"feature": feature_names[idx], "importance": float(importances[idx])}
            for idx in sorted_idx[:10]
        ]
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"[Saved Metadata] {meta_path}")

    return meta


if __name__ == "__main__":
    train_blood_xgboost()

