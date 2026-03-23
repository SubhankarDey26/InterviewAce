"""
evaluate_deberta.py
====================================================
Comprehensive evaluation suite for DeBERTaMultiHeadScorer.
Generates all metrics and research-paper-quality plots.

Usage:
    python evaluate_deberta.py \
        --data dataset.json \
        --output_dir ./eval_results

Requirements:
    pip install torch transformers scikit-learn scipy matplotlib seaborn pandas numpy

Output files (in --output_dir):
    metrics_summary.json          ← All numeric metrics
    metrics_table.csv             ← LaTeX-ready table
    01_pred_vs_actual.png         ← Scatter grid (pred vs actual, per dimension)
    02_residuals.png              ← Residual plot grid
    03_residual_distribution.png  ← Histogram of residuals
    04_error_bar_chart.png        ← MAE per dimension bar chart
    05_correlation_heatmap.png    ← Pearson r between dimensions
    06_violin_plot.png            ← Score distribution per dimension
    07_bland_altman.png           ← Bland-Altman agreement plot
    08_calibration_curve.png      ← Predicted mean vs actual mean (binned)
    09_learning_curve.png         ← Loss vs epoch (requires history.json)
    10_confusion_matrix_bins.png  ← Discretised classification (Low/Med/High)

Dataset JSON format expected:
    [
      {
        "input": "The candidate explained ...",
        "scores": {
          "relevance": 72.0,
          "depth": 65.0,
          "clarity": 80.0,
          "confidence": 58.0,
          "structure": 70.0,
          "sentiment": 75.0
        }
      },
      ...
    ]
"""

import os
import json
import argparse
import logging
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
from scipy import stats
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    confusion_matrix,
    classification_report,
)
from sklearn.preprocessing import label_binarize

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

DIMENSIONS = ["relevance", "depth", "clarity", "confidence", "structure", "sentiment"]

# ── Plot style ──────────────────────────────────────────────────────────────
plt.rcParams.update({
    "font.family":      "DejaVu Sans",
    "axes.spines.top":  False,
    "axes.spines.right": False,
    "axes.grid":        True,
    "grid.alpha":       0.3,
    "grid.linestyle":   "--",
    "figure.dpi":       150,
    "savefig.dpi":      300,
    "savefig.bbox":     "tight",
})
PALETTE = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948"]
DIM_COLORS = dict(zip(DIMENSIONS, PALETTE))


# ══════════════════════════════════════════════════════════════════════════════
# 1.  Data loading
# ══════════════════════════════════════════════════════════════════════════════

def load_dataset(path: str):
    with open(path) as f:
        data = json.load(f)
    texts, labels = [], {d: [] for d in DIMENSIONS}
    for item in data:
        texts.append(
            item["question"] + " " +
            item["answer"] + " " +
            item["job_description"]
        )
        for d in DIMENSIONS:
            labels[d].append(float(item["scores"][d]))
    return texts, labels


# ══════════════════════════════════════════════════════════════════════════════
# 2.  Model inference
# ══════════════════════════════════════════════════════════════════════════════

def run_inference(texts, model_dir: str):
    """
    Load the fine-tuned InterviewScorer and predict all texts.
    Returns dict: dimension -> np.array of predicted scores.
    """
    import sys
    # ---- Adjust the import path if needed ----
    # sys.path.insert(0, "/path/to/your/mlservice")
    from models.deberta_model import InterviewScorer   # adjust if module is elsewhere

    scorer = InterviewScorer()
    scorer.load()

    preds = {d: [] for d in DIMENSIONS}
    for i, text in enumerate(texts):
        if i % 50 == 0:
            logger.info(f"  Predicting {i}/{len(texts)} ...")
        out = scorer.predict(text)
        for d in DIMENSIONS:
            preds[d].append(out[d])

    return {d: np.array(preds[d]) for d in DIMENSIONS}


# ══════════════════════════════════════════════════════════════════════════════
# 3.  Metrics
# ══════════════════════════════════════════════════════════════════════════════

def compute_metrics(y_true: dict, y_pred: dict) -> dict:
    """
    Returns a flat dict of all metrics, per-dimension and overall.
    """
    results = {}
    all_true, all_pred = [], []

    for d in DIMENSIONS:
        yt = np.array(y_true[d])
        yp = np.array(y_pred[d])
        all_true.extend(yt)
        all_pred.extend(yp)

        mae  = mean_absolute_error(yt, yp)
        mse  = mean_squared_error(yt, yp)
        rmse = np.sqrt(mse)
        r2   = r2_score(yt, yp)
        pearson_r, pearson_p = stats.pearsonr(yt, yp)
        spearman_r, spearman_p = stats.spearmanr(yt, yp)
        mbe  = float(np.mean(yp - yt))          # mean bias error (signed)
        mape = float(np.mean(np.abs((yt - yp) / np.clip(yt, 1, None))) * 100)

        results[d] = {
            "MAE":        round(mae, 4),
            "MSE":        round(mse, 4),
            "RMSE":       round(rmse, 4),
            "R2":         round(r2, 4),
            "Pearson_r":  round(pearson_r, 4),
            "Pearson_p":  round(pearson_p, 6),
            "Spearman_r": round(spearman_r, 4),
            "Spearman_p": round(spearman_p, 6),
            "MBE":        round(mbe, 4),
            "MAPE":       round(mape, 4),
        }

    # Overall (flatten all dimensions)
    yt_all = np.array(all_true)
    yp_all = np.array(all_pred)
    pr_all, _ = stats.pearsonr(yt_all, yp_all)
    results["OVERALL"] = {
        "MAE":       round(mean_absolute_error(yt_all, yp_all), 4),
        "RMSE":      round(np.sqrt(mean_squared_error(yt_all, yp_all)), 4),
        "R2":        round(r2_score(yt_all, yp_all), 4),
        "Pearson_r": round(pr_all, 4),
    }
    return results


def discretize(scores, thresholds=(40, 70)):
    """Map 0-100 scores → Low / Medium / High."""
    bins = np.digitize(scores, thresholds)
    return np.array(["Low", "Medium", "High"])[bins]


def save_metrics(results: dict, out_dir: str):
    # JSON
    with open(os.path.join(out_dir, "metrics_summary.json"), "w") as f:
        json.dump(results, f, indent=2)

    # CSV table (per-dimension rows)
    rows = []
    for d in DIMENSIONS:
        row = {"Dimension": d}
        row.update(results[d])
        rows.append(row)
    df = pd.DataFrame(rows).set_index("Dimension")
    df.to_csv(os.path.join(out_dir, "metrics_table.csv"))
    logger.info("Metrics saved.")
    return df


# ══════════════════════════════════════════════════════════════════════════════
# 4.  Plots
# ══════════════════════════════════════════════════════════════════════════════

def plot_pred_vs_actual(y_true, y_pred, out_dir):
    """01 — 2×3 grid of scatter plots, one per dimension."""
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))
    axes = axes.flatten()
    for i, d in enumerate(DIMENSIONS):
        ax = axes[i]
        yt = np.array(y_true[d])
        yp = np.array(y_pred[d])
        ax.scatter(yt, yp, alpha=0.45, s=18, color=DIM_COLORS[d], edgecolors="none")
        lo, hi = min(yt.min(), yp.min()) - 2, max(yt.max(), yp.max()) + 2
        ax.plot([lo, hi], [lo, hi], "k--", lw=1, label="Perfect")
        r2 = r2_score(yt, yp)
        pearson_r, _ = stats.pearsonr(yt, yp)
        ax.set_title(f"{d.capitalize()}  |  R²={r2:.3f}  r={pearson_r:.3f}", fontsize=11)
        ax.set_xlabel("Actual score")
        ax.set_ylabel("Predicted score")
    fig.suptitle("Predicted vs Actual Scores — per Dimension", fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "01_pred_vs_actual.png"))
    plt.close()
    logger.info("Plot 01 saved.")


def plot_residuals(y_true, y_pred, out_dir):
    """02 — Residual (error) plots per dimension."""
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))
    axes = axes.flatten()
    for i, d in enumerate(DIMENSIONS):
        ax = axes[i]
        yt = np.array(y_true[d])
        yp = np.array(y_pred[d])
        residuals = yp - yt
        ax.scatter(yp, residuals, alpha=0.4, s=16, color=DIM_COLORS[d], edgecolors="none")
        ax.axhline(0, color="black", lw=1, ls="--")
        ax.set_title(f"{d.capitalize()}", fontsize=11)
        ax.set_xlabel("Predicted score")
        ax.set_ylabel("Residual (pred − actual)")
    fig.suptitle("Residual Plots — per Dimension", fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "02_residuals.png"))
    plt.close()
    logger.info("Plot 02 saved.")


def plot_residual_distribution(y_true, y_pred, out_dir):
    """03 — Overlapping KDE of residual distributions."""
    fig, ax = plt.subplots(figsize=(10, 5))
    for d in DIMENSIONS:
        residuals = np.array(y_pred[d]) - np.array(y_true[d])
        ax.hist(residuals, bins=30, alpha=0.35, color=DIM_COLORS[d], label=d, density=True)
        sns.kdeplot(residuals, ax=ax, color=DIM_COLORS[d], lw=2)
    ax.axvline(0, color="black", lw=1.2, ls="--")
    ax.set_xlabel("Residual (predicted − actual)")
    ax.set_ylabel("Density")
    ax.set_title("Residual Distribution per Dimension")
    ax.legend(fontsize=9)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "03_residual_distribution.png"))
    plt.close()
    logger.info("Plot 03 saved.")


def plot_error_bar_chart(metrics: dict, out_dir):
    """04 — MAE and RMSE grouped bar chart per dimension."""
    dims = DIMENSIONS
    mae_vals  = [metrics[d]["MAE"]  for d in dims]
    rmse_vals = [metrics[d]["RMSE"] for d in dims]
    x = np.arange(len(dims))
    width = 0.35
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(x - width/2, mae_vals,  width, label="MAE",  color="#4E79A7", alpha=0.85)
    ax.bar(x + width/2, rmse_vals, width, label="RMSE", color="#F28E2B", alpha=0.85)
    ax.set_xticks(x)
    ax.set_xticklabels([d.capitalize() for d in dims])
    ax.set_ylabel("Error (score points out of 100)")
    ax.set_title("MAE and RMSE per Dimension")
    ax.legend()
    for bar in ax.patches:
        ax.annotate(f"{bar.get_height():.1f}",
                    (bar.get_x() + bar.get_width() / 2, bar.get_height()),
                    ha="center", va="bottom", fontsize=8)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "04_error_bar_chart.png"))
    plt.close()
    logger.info("Plot 04 saved.")


def plot_correlation_heatmap(y_pred, out_dir):
    """05 — Pearson correlation heatmap of predicted scores across dimensions."""
    df = pd.DataFrame({d: y_pred[d] for d in DIMENSIONS})
    corr = df.corr(method="pearson")
    fig, ax = plt.subplots(figsize=(7, 6))
    mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
    sns.heatmap(corr, ax=ax, annot=True, fmt=".2f", cmap="coolwarm",
                center=0, vmin=-1, vmax=1, linewidths=0.5,
                xticklabels=[d.capitalize() for d in DIMENSIONS],
                yticklabels=[d.capitalize() for d in DIMENSIONS])
    ax.set_title("Pearson Correlation — Predicted Scores across Dimensions")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "05_correlation_heatmap.png"))
    plt.close()
    logger.info("Plot 05 saved.")


def plot_violin(y_true, y_pred, out_dir):
    """06 — Violin: actual vs predicted score distributions per dimension."""
    records = []
    for d in DIMENSIONS:
        for v in y_true[d]:
            records.append({"Dimension": d.capitalize(), "Score": v, "Type": "Actual"})
        for v in y_pred[d]:
            records.append({"Dimension": d.capitalize(), "Score": v, "Type": "Predicted"})
    df = pd.DataFrame(records)
    fig, ax = plt.subplots(figsize=(13, 6))
    sns.violinplot(data=df, x="Dimension", y="Score", hue="Type",
                   split=True, inner="quartile", palette={"Actual": "#4E79A7", "Predicted": "#F28E2B"},
                   ax=ax, linewidth=0.8)
    ax.set_title("Score Distribution: Actual vs Predicted")
    ax.set_xlabel("")
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "06_violin_plot.png"))
    plt.close()
    logger.info("Plot 06 saved.")


def plot_bland_altman(y_true, y_pred, out_dir):
    """07 — Bland-Altman agreement plot (overall, all dimensions pooled)."""
    all_true = np.concatenate([y_true[d] for d in DIMENSIONS])
    all_pred = np.concatenate([y_pred[d] for d in DIMENSIONS])
    means = (all_true + all_pred) / 2
    diffs = all_pred - all_true
    mean_diff = np.mean(diffs)
    std_diff  = np.std(diffs)
    loa_upper = mean_diff + 1.96 * std_diff
    loa_lower = mean_diff - 1.96 * std_diff

    fig, ax = plt.subplots(figsize=(9, 5))
    ax.scatter(means, diffs, alpha=0.25, s=10, color="#4E79A7", edgecolors="none")
    ax.axhline(mean_diff, color="black", lw=1.2, label=f"Mean diff={mean_diff:.2f}")
    ax.axhline(loa_upper, color="red",  lw=1,   ls="--", label=f"+1.96 SD={loa_upper:.2f}")
    ax.axhline(loa_lower, color="red",  lw=1,   ls="--", label=f"−1.96 SD={loa_lower:.2f}")
    ax.set_xlabel("Mean of Actual and Predicted")
    ax.set_ylabel("Predicted − Actual (Residual)")
    ax.set_title("Bland-Altman Agreement Plot (all dimensions pooled)")
    ax.legend(fontsize=9)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "07_bland_altman.png"))
    plt.close()
    logger.info("Plot 07 saved.")


def plot_calibration(y_true, y_pred, out_dir, n_bins=10):
    """08 — Calibration curve: bin predictions, compare mean pred vs mean actual."""
    all_true = np.concatenate([y_true[d] for d in DIMENSIONS])
    all_pred = np.concatenate([y_pred[d] for d in DIMENSIONS])
    bins = np.linspace(0, 100, n_bins + 1)
    bin_idx = np.digitize(all_pred, bins) - 1
    bin_idx = np.clip(bin_idx, 0, n_bins - 1)
    mean_pred_bins, mean_true_bins, counts = [], [], []
    for b in range(n_bins):
        mask = bin_idx == b
        if mask.sum() > 0:
            mean_pred_bins.append(all_pred[mask].mean())
            mean_true_bins.append(all_true[mask].mean())
            counts.append(mask.sum())

    fig, ax = plt.subplots(figsize=(7, 6))
    ax.plot([0, 100], [0, 100], "k--", lw=1, label="Perfect calibration")
    sc = ax.scatter(mean_pred_bins, mean_true_bins, c=counts, cmap="Blues",
                    s=80, zorder=5, edgecolors="black", lw=0.5)
    plt.colorbar(sc, ax=ax, label="Sample count per bin")
    ax.set_xlabel("Mean predicted score (bin)")
    ax.set_ylabel("Mean actual score (bin)")
    ax.set_title("Calibration Curve (all dimensions)")
    ax.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "08_calibration_curve.png"))
    plt.close()
    logger.info("Plot 08 saved.")


def plot_learning_curve(history_path: str, out_dir: str):
    """
    09 — Training and validation loss vs epoch.
    Requires a history.json file with structure:
        {"train_loss": [...], "val_loss": [...]}
    """
    if not os.path.exists(history_path):
        logger.warning(f"history.json not found at {history_path} — skipping plot 09.")
        return
    with open(history_path) as f:
        history = json.load(f)
    epochs = range(1, len(history["train_loss"]) + 1)
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(epochs, history["train_loss"], label="Train loss", color="#4E79A7", lw=2)
    if "val_loss" in history:
        ax.plot(epochs, history["val_loss"], label="Validation loss", color="#E15759", lw=2, ls="--")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("MSE Loss")
    ax.set_title("Learning Curve")
    ax.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "09_learning_curve.png"))
    plt.close()
    logger.info("Plot 09 saved.")


def plot_confusion_matrix_bins(y_true, y_pred, out_dir):
    """
    10 — Discretise scores into Low / Medium / High and show per-dimension
    confusion matrices in a 2×3 grid.
    """
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))
    axes = axes.flatten()
    classes = ["Low", "Medium", "High"]
    for i, d in enumerate(DIMENSIONS):
        ax = axes[i]
        yt_bin = discretize(np.array(y_true[d]))
        yp_bin = discretize(np.array(y_pred[d]))
        cm = confusion_matrix(yt_bin, yp_bin, labels=classes)
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=ax,
                    xticklabels=classes, yticklabels=classes,
                    cbar=False, linewidths=0.5)
        ax.set_title(f"{d.capitalize()}", fontsize=11)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")
    fig.suptitle("Confusion Matrices (Low/Medium/High bins)", fontsize=13, y=1.01)
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "10_confusion_matrix_bins.png"))
    plt.close()
    logger.info("Plot 10 saved.")


def print_classification_report(y_true, y_pred):
    """Print per-class precision / recall / F1 for each dimension (binned)."""
    classes = ["Low", "Medium", "High"]
    print("\n" + "="*60)
    print("CLASSIFICATION METRICS (Low / Medium / High bins)")
    print("="*60)
    for d in DIMENSIONS:
        yt_bin = discretize(np.array(y_true[d]))
        yp_bin = discretize(np.array(y_pred[d]))
        print(f"\n── {d.upper()} ──")
        print(classification_report(yt_bin, yp_bin, labels=classes, zero_division=0))


# ══════════════════════════════════════════════════════════════════════════════
# 5.  Main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="DeBERTa model evaluator")
    parser.add_argument("--data",        default="dataset.json",    help="Path to test dataset JSON")
    parser.add_argument("--output_dir",  default="./eval_results",  help="Directory for outputs")
    parser.add_argument("--history",     default="history.json",    help="Training history JSON (optional)")
    parser.add_argument("--model_dir",   default=None,              help="Override model directory")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    logger.info(f"Saving results to: {args.output_dir}")

    # --- Load data ---
    logger.info("Loading dataset...")
    texts, y_true = load_dataset(args.data)
    logger.info(f"  {len(texts)} samples loaded.")

    # --- Inference ---
    logger.info("Running model inference...")
    y_pred = run_inference(texts, args.model_dir)

    # --- Metrics ---
    logger.info("Computing metrics...")
    metrics = compute_metrics(y_true, y_pred)
    metrics_df = save_metrics(metrics, args.output_dir)
    print("\n" + metrics_df.to_string())
    print(f"\nOVERALL: {metrics['OVERALL']}")
    print_classification_report(y_true, y_pred)

    # --- Plots ---
    logger.info("Generating plots...")
    plot_pred_vs_actual(y_true, y_pred, args.output_dir)
    plot_residuals(y_true, y_pred, args.output_dir)
    plot_residual_distribution(y_true, y_pred, args.output_dir)
    plot_error_bar_chart(metrics, args.output_dir)
    plot_correlation_heatmap(y_pred, args.output_dir)
    plot_violin(y_true, y_pred, args.output_dir)
    plot_bland_altman(y_true, y_pred, args.output_dir)
    plot_calibration(y_true, y_pred, args.output_dir)
    plot_learning_curve(args.history, args.output_dir)
    plot_confusion_matrix_bins(y_true, y_pred, args.output_dir)

    logger.info("✅ Evaluation complete.")


if __name__ == "__main__":
    main()