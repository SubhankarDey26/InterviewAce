# 🤖 InterviewAI — ML Service

FastAPI microservice that powers the AI scoring engine for the InterviewAI platform.

---

## Architecture

```
Node.js Backend
      │
      │ POST /score  (JSON: question, answer, jd, type)
      ▼
┌─────────────────────────────────────────────────────┐
│                  FastAPI (app/main.py)               │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │  DeBERTa Model       │  │  spaCy Pipeline      │ │
│  │  (neural scoring)    │  │  (rule-based NLP)    │ │
│  │                      │  │                      │ │
│  │  • relevance  (25%)  │  │  • filler detection  │ │
│  │  • depth      (20%)  │  │  • STAR structure    │ │
│  │  • clarity    (20%)  │  │  • action verbs      │ │
│  │  • confidence (15%)  │  │  • tech keywords     │ │
│  │  • structure  (15%)  │  │  • topic tagging     │ │
│  │  • sentiment  (5%)   │  │                      │ │
│  └──────────────────────┘  └──────────────────────┘ │
│                    │                │                │
│                    └───── merge ────┘                │
│                           │                         │
│                    overall_score                     │
│                    dimension_scores                  │
│                    spacy_metrics                     │
│                    feedback_hints                    │
└─────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
mlservice/
├── app/
│   ├── __init__.py
│   └── main.py              # FastAPI app, /score endpoint, schemas
├── models/
│   ├── __init__.py
│   └── deberta_model.py     # DeBERTaMultiHeadScorer + InterviewScorer wrapper
├── utils/
│   ├── __init__.py
│   ├── preprocess.py        # Input text builder, validation, JD keyword extraction
│   └── spacy_pipeline.py    # Rule-based NLP: fillers, STAR, action verbs, topics
├── training/
│   ├── __init__.py
│   ├── train.py             # Fine-tuning script (DeBERTa, MSE loss, multi-head)
│   └── dataset.json         # 30+ synthetic Q&A pairs with human-annotated scores
├── saved_models/
│   └── deberta/
│       └── README.md        # Instructions for model weights
├── requirements.txt
├── run.py                   # uvicorn entrypoint
└── .env.example
```

---

## Setup & Run

### 1. Install dependencies

```bash
cd mlservice/
pip install -r requirements.txt

# Download spaCy English model (medium is best; small is lighter)
python -m spacy download en_core_web_md
# or: python -m spacy download en_core_web_sm
```

### 2. Configure

```bash
cp .env.example .env
```

### 3. Start (Development)

```bash
python run.py
# Service starts at http://localhost:8000
```

### 4. Start (Production)

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## API Reference

### `GET /health`

```json
{
  "status": "healthy",
  "model_loaded": true,
  "spacy_loaded": true,
  "version": "1.0.0"
}
```

---

### `POST /score` — Main scoring endpoint

**Request:**
```json
{
  "question":         "Tell me about a time you led a team.",
  "answer":           "At my previous company, I led a 5-person team...",
  "job_description":  "Senior engineer role requiring leadership...",
  "job_role":         "Software Engineer",
  "question_type":    "behavioral"
}
```

**Response:**
```json
{
  "overall_score": 84.3,
  "dimension_scores": {
    "relevance":   91.0,
    "depth":       85.0,
    "clarity":     83.0,
    "confidence":  80.0,
    "structure":   88.0,
    "sentiment":   82.0
  },
  "spacy_metrics": {
    "filler_word_count":   2,
    "filler_words_found":  ["like", "basically"],
    "star_components":     { "situation": true, "task": true, "action": true, "result": true },
    "star_score":          100.0,
    "sentence_count":      8,
    "word_count":          142,
    "unique_word_ratio":   0.71,
    "avg_sentence_length": 17.75,
    "action_verb_count":   6,
    "tech_keyword_count":  3,
    "topics_detected":     ["Leadership", "Problem Solving", "Communication"]
  },
  "feedback_hints": [
    "Strong use of the STAR method — all four components present.",
    "Reduce filler words (like, basically) for a more polished delivery."
  ],
  "processing_time_ms": 124.5,
  "model_used": "deberta-v3-base-finetuned-interview"
}
```

---

### `POST /score/batch` — Batch scoring (max 15 items)

```json
{
  "items": [
    { "question": "...", "answer": "...", "question_type": "technical" },
    { "question": "...", "answer": "...", "question_type": "behavioral" }
  ]
}
```

---

### `POST /analyze/spacy` — Rule-based analysis only (no GPU)

```
POST /analyze/spacy?question_type=behavioral&answer=<your text>
```

---

## Model Training

### Fine-tune on custom dataset

```bash
python training/train.py \
  --dataset training/dataset.json \
  --output  saved_models/deberta \
  --epochs  10 \
  --batch   8 \
  --lr      2e-5
```

### Dataset format (`dataset.json`)

```json
[
  {
    "question":        "Tell me about a time you led a team...",
    "answer":          "At my previous company...",
    "job_description": "Senior engineer role...",
    "question_type":   "behavioral",
    "scores": {
      "relevance":   92.0,
      "depth":       88.0,
      "clarity":     85.0,
      "confidence":  87.0,
      "structure":   95.0,
      "sentiment":   83.0
    }
  }
]
```

The dataset currently has **30 high-quality annotated examples**. For production fine-tuning, aim for **500–2000 examples** across all question types.

---

## Scoring Dimensions

| Dimension   | Weight | Description                                        |
|-------------|--------|----------------------------------------------------|
| Relevance   | 25%    | Does the answer actually address what was asked?   |
| Depth       | 20%    | Level of explanation, technical detail, examples   |
| Clarity     | 20%    | Understandability, concise sentences, no fluff     |
| Confidence  | 15%    | Assertive tone, strong verbs, no excessive hedging |
| Structure   | 15%    | Logical flow, STAR method, transitions             |
| Sentiment   | 5%     | Positive, professional, enthusiastic tone          |

---

## Fallback Chain

The service degrades gracefully if resources are unavailable:

```
Fine-tuned DeBERTa weights found?
  YES → Neural inference (best quality)
  NO  → Pre-trained DeBERTa encoder (good quality)
        Model loading fails?
          YES → Heuristic rule-based scoring (reasonable baseline)
```

spaCy analysis is always available regardless (pure Python rules).
