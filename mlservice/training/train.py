"""
mlservice/training/train.py
==============================
Fine-tuning script for DeBERTa-v3-base on interview scoring.

Usage:
    python training/train.py \
        --dataset  training/dataset.json \
        --output   saved_models/deberta \
        --epochs   10 \
        --batch    8 \
        --lr       2e-5

What this does:
  1. Loads dataset.json (Q+A+JD + 6 human-style dimension scores)
  2. Tokenizes with DeBERTa tokenizer
  3. Fine-tunes DeBERTaMultiHeadScorer with MSE loss (multi-task regression)
  4. Evaluates on hold-out validation split (20%)
  5. Saves best checkpoint by val_loss
"""

import os
import sys
import json
import argparse
import logging
import random
import numpy as np
from typing import List, Tuple, Dict

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
from torch.optim import AdamW
from transformers import AutoTokenizer, get_linear_schedule_with_warmup

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.deberta_model import (
    DeBERTaMultiHeadScorer, BASE_MODEL_NAME, SAVED_MODEL_DIR,
    DIMENSIONS, MAX_SEQ_LEN, DEVICE,
)
from utils.preprocess import build_input_text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


# ─── Dataset ──────────────────────────────────────────────────────────────────

class InterviewDataset(Dataset):
    """
    Loads records from dataset.json.

    Expected schema per record:
    {
      "question":        "Describe a time you led a team...",
      "answer":          "At my previous company, I led a 5-person...",
      "job_description": "We are looking for a senior engineer...",  (optional)
      "question_type":   "behavioral",
      "scores": {
        "relevance":   85.0,
        "depth":       72.0,
        "clarity":     78.0,
        "confidence":  80.0,
        "structure":   90.0,
        "sentiment":   82.0
      }
    }
    """

    def __init__(self, records: List[dict], tokenizer: AutoTokenizer, max_len: int = MAX_SEQ_LEN):
        self.records   = records
        self.tokenizer = tokenizer
        self.max_len   = max_len

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx) -> Tuple[dict, dict]:
        rec = self.records[idx]

        input_text = build_input_text(
            question=rec["question"],
            answer=rec["answer"],
            job_description=rec.get("job_description"),
            question_type=rec.get("question_type", "mixed"),
        )

        encoding = self.tokenizer(
            input_text,
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        # Scores normalised to [0, 1] for Sigmoid output
        scores = rec["scores"]
        labels = {dim: torch.tensor(scores[dim] / 100.0, dtype=torch.float32) for dim in DIMENSIONS}

        item = {
            "input_ids":      encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
        }
        if "token_type_ids" in encoding:
            item["token_type_ids"] = encoding["token_type_ids"].squeeze(0)

        return item, labels


# ─── Training loop ────────────────────────────────────────────────────────────

def train(args):
    set_seed(42)

    # 1. Load dataset
    logger.info(f"Loading dataset from {args.dataset}…")
    with open(args.dataset, "r") as f:
        records = json.load(f)
    logger.info(f"Total records: {len(records)}")

    # 2. Tokenizer
    logger.info("Loading tokenizer…")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, use_fast=True)

    # 3. Datasets / dataloaders
    full_ds = InterviewDataset(records, tokenizer, max_len=args.max_len)
    val_size  = max(1, int(len(full_ds) * 0.2))
    train_size = len(full_ds) - val_size
    train_ds, val_ds = random_split(full_ds, [train_size, val_size])

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=2)
    val_loader   = DataLoader(val_ds,   batch_size=args.batch, shuffle=False, num_workers=2)
    logger.info(f"Train: {train_size} | Val: {val_size}")

    # 4. Model
    logger.info("Initialising DeBERTa multi-head scorer…")
    model = DeBERTaMultiHeadScorer(base_model_name=BASE_MODEL_NAME, dropout=args.dropout)
    model.to(DEVICE)

    # 5. Optimizer + Scheduler
    no_decay = ["bias", "LayerNorm.weight"]
    params = [
        {"params": [p for n, p in model.named_parameters() if not any(nd in n for nd in no_decay)], "weight_decay": 0.01},
        {"params": [p for n, p in model.named_parameters() if any(nd in n for nd in no_decay)],      "weight_decay": 0.0},
    ]
    optimizer  = AdamW(params, lr=args.lr)
    total_steps = len(train_loader) * args.epochs
    scheduler   = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps,
    )

    # 6. Loss: MSE over each head, summed
    criterion = nn.MSELoss()

    best_val_loss = float("inf")
    os.makedirs(args.output, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        # ── Train ──────────────────────────────────────────────────────────
        model.train()
        total_train_loss = 0.0

        for step, (inputs, labels) in enumerate(train_loader, 1):
            input_ids      = inputs["input_ids"].to(DEVICE)
            attention_mask = inputs["attention_mask"].to(DEVICE)
            token_type_ids = inputs.get("token_type_ids")
            if token_type_ids is not None:
                token_type_ids = token_type_ids.to(DEVICE)

            preds = model(input_ids, attention_mask, token_type_ids)

            loss = sum(
                criterion(preds[dim], labels[dim].to(DEVICE)) for dim in DIMENSIONS
            )
            loss = loss / len(DIMENSIONS)  # Average across heads

            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            total_train_loss += loss.item()

            if step % 20 == 0:
                logger.info(f"Epoch {epoch}/{args.epochs} | Step {step}/{len(train_loader)} | Loss {loss.item():.4f}")

        avg_train = total_train_loss / len(train_loader)

        # ── Validate ───────────────────────────────────────────────────────
        val_loss, val_metrics = evaluate(model, val_loader, criterion)
        logger.info(
            f"── Epoch {epoch} ── Train Loss: {avg_train:.4f} | Val Loss: {val_loss:.4f} | "
            + " | ".join(f"{d}: {val_metrics[d]:.2f}" for d in DIMENSIONS)
        )

        # ── Save best ──────────────────────────────────────────────────────
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), os.path.join(args.output, "pytorch_model.bin"))
            tokenizer.save_pretrained(args.output)
            logger.info(f"✅ New best model saved (val_loss={val_loss:.4f})")

    logger.info(f"Training complete. Best val_loss: {best_val_loss:.4f}")


@torch.no_grad()
def evaluate(model, loader, criterion) -> Tuple[float, Dict[str, float]]:
    model.eval()
    total_loss  = 0.0
    dim_errors  = {dim: 0.0 for dim in DIMENSIONS}
    n_batches   = 0

    for inputs, labels in loader:
        input_ids      = inputs["input_ids"].to(DEVICE)
        attention_mask = inputs["attention_mask"].to(DEVICE)
        token_type_ids = inputs.get("token_type_ids")
        if token_type_ids is not None:
            token_type_ids = token_type_ids.to(DEVICE)

        preds = model(input_ids, attention_mask, token_type_ids)
        loss  = sum(criterion(preds[dim], labels[dim].to(DEVICE)) for dim in DIMENSIONS) / len(DIMENSIONS)
        total_loss += loss.item()

        # MAE per dimension (in score units 0-100)
        for dim in DIMENSIONS:
            mae = torch.abs(preds[dim] * 100 - labels[dim].to(DEVICE) * 100).mean().item()
            dim_errors[dim] += mae

        n_batches += 1

    avg_loss    = total_loss / max(n_batches, 1)
    avg_metrics = {dim: round(dim_errors[dim] / max(n_batches, 1), 2) for dim in DIMENSIONS}
    return avg_loss, avg_metrics


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune DeBERTa for interview scoring")
    parser.add_argument("--dataset", type=str, default="training/dataset.json")
    parser.add_argument("--output",  type=str, default=SAVED_MODEL_DIR)
    parser.add_argument("--epochs",  type=int, default=10)
    parser.add_argument("--batch",   type=int, default=8)
    parser.add_argument("--lr",      type=float, default=2e-5)
    parser.add_argument("--max-len", type=int, default=MAX_SEQ_LEN)
    parser.add_argument("--dropout", type=float, default=0.1)
    args = parser.parse_args()

    logger.info(f"Training config: {vars(args)}")
    logger.info(f"Device: {DEVICE}")

    train(args)