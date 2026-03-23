"""
mlservice/app/main.py
=====================
FastAPI application — exposes /score and supporting endpoints.
Called by Node.js mlService.js via HTTP POST.

Flow:
  Node.js  ──POST /score──►  FastAPI  ──►  preprocess  ──►  DeBERTa model
                                       ──►  spaCy pipeline
                                       ──►  merged scores  ──►  JSON response
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import time
import logging
import sys
import os

# Add parent dir so we can import siblings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.deberta_model import InterviewScorer
from utils.preprocess import build_input_text, validate_inputs
from utils.spacy_pipeline import SpacyAnalyzer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ─── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="InterviewAI ML Service",
    description="DeBERTa-based multi-dimensional interview answer scoring API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global model instances (loaded once at startup) ───────────────────────────
scorer: InterviewScorer = None
spacy_analyzer: SpacyAnalyzer = None


@app.on_event("startup")
async def startup_event():
    global scorer, spacy_analyzer
    logger.info("Loading DeBERTa model…")
    scorer = InterviewScorer()
    scorer.load()
    logger.info("Loading spaCy pipeline…")
    spacy_analyzer = SpacyAnalyzer()
    logger.info("✅ All models ready.")


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ScoreRequest(BaseModel):
    question: str = Field(..., min_length=5, description="Interview question")
    answer: str   = Field(..., min_length=1, description="Candidate's answer")
    job_description: Optional[str] = Field(None, description="JD for relevance scoring")
    job_role: Optional[str] = Field(None, description="e.g. Software Engineer")
    question_type: Optional[str] = Field("mixed", description="technical|behavioral|situational|hr")


class DimensionScores(BaseModel):
    relevance:   float   # 0-100: Does answer address the question?
    depth:       float   # 0-100: Depth of explanation
    clarity:     float   # 0-100: Communication clarity
    confidence:  float   # 0-100: Tone & assertiveness
    structure:   float   # 0-100: STAR / logical flow
    sentiment:   float   # 0-100: Positive vs negative tone


class SpacyMetrics(BaseModel):
    filler_word_count:  int
    filler_words_found: List[str]
    star_components:    dict      # {situation, task, action, result} present?
    star_score:         float     # 0-100
    sentence_count:     int
    word_count:         int
    unique_word_ratio:  float
    avg_sentence_length: float
    action_verb_count:  int
    tech_keyword_count: int
    topics_detected:    List[str]


class ScoreResponse(BaseModel):
    overall_score:    float
    dimension_scores: DimensionScores
    spacy_metrics:    SpacyMetrics
    feedback_hints:   List[str]
    processing_time_ms: float
    model_used:       str


class BatchScoreRequest(BaseModel):
    items: List[ScoreRequest]


class BatchScoreResponse(BaseModel):
    results: List[ScoreResponse]
    total_processing_time_ms: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    spacy_loaded: bool
    version: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health():
    return {
        "status": "healthy",
        "model_loaded": scorer is not None and scorer.is_loaded,
        "spacy_loaded": spacy_analyzer is not None,
        "version": "1.0.0",
    }


@app.post("/score", response_model=ScoreResponse, tags=["Scoring"])
def score_answer(req: ScoreRequest):
    """
    Main scoring endpoint.
    Combines DeBERTa neural scores with spaCy rule-based analysis.
    """
    t0 = time.time()

    # 1. Validate
    errors = validate_inputs(req.question, req.answer)
    if errors:
        raise HTTPException(status_code=422, detail=errors)

    # 2. Build combined input string for DeBERTa
    input_text = build_input_text(
        question=req.question,
        answer=req.answer,
        job_description=req.job_description,
        question_type=req.question_type,
    )

    # 3. DeBERTa multi-head scores
    neural_scores = scorer.predict(input_text)

    # 4. spaCy rule-based analysis
    spacy_result = spacy_analyzer.analyze(
        answer=req.answer,
        question_type=req.question_type or "mixed",
    )

    # 5. Merge: neural takes 70%, spaCy structural takes 30%
    structure_score = (
        neural_scores["structure"] * 0.7 +
        spacy_result["star_score"] * 0.3
    )
    clarity_score = (
        neural_scores["clarity"] * 0.75 +
        (100 - min(spacy_result["filler_word_count"] * 5, 40)) * 0.25
    )

    dim_scores = DimensionScores(
        relevance=round(neural_scores["relevance"], 1),
        depth=round(neural_scores["depth"], 1),
        clarity=round(clarity_score, 1),
        confidence=round(neural_scores["confidence"], 1),
        structure=round(structure_score, 1),
        sentiment=round(neural_scores["sentiment"], 1),
    )

    # 6. Weighted overall score
    weights = {"relevance": 0.25, "depth": 0.20, "clarity": 0.20,
               "confidence": 0.15, "structure": 0.15, "sentiment": 0.05}
    overall = sum(getattr(dim_scores, k) * w for k, w in weights.items())

    # 7. Generate feedback hints
    hints = _generate_hints(dim_scores, spacy_result)

    elapsed = (time.time() - t0) * 1000

    return ScoreResponse(
        overall_score=round(overall, 1),
        dimension_scores=dim_scores,
        spacy_metrics=SpacyMetrics(**spacy_result),
        feedback_hints=hints,
        processing_time_ms=round(elapsed, 2),
        model_used=scorer.model_name,
    )


@app.post("/score/batch", response_model=BatchScoreResponse, tags=["Scoring"])
def batch_score(req: BatchScoreRequest):
    """Score multiple answers in one call (e.g. end-of-interview bulk evaluation)."""
    t0 = time.time()
    if len(req.items) > 15:
        raise HTTPException(status_code=400, detail="Max 15 items per batch")

    results = []
    for item in req.items:
        try:
            results.append(score_answer(item))
        except HTTPException as e:
            # Return zeroed-out score for invalid items instead of failing whole batch
            results.append(_zero_score(str(e.detail)))

    return BatchScoreResponse(
        results=results,
        total_processing_time_ms=round((time.time() - t0) * 1000, 2),
    )


@app.post("/analyze/spacy", tags=["Analysis"])
def spacy_only(question_type: str, answer: str):
    """Run only spaCy rule-based analysis (fast, no GPU needed)."""
    result = spacy_analyzer.analyze(answer=answer, question_type=question_type)
    return result


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _generate_hints(dim: DimensionScores, spacy: dict) -> List[str]:
    hints = []
    if dim.relevance < 60:
        hints.append("Your answer seems off-topic — try to directly address what was asked.")
    if dim.depth < 55:
        hints.append("Add more depth: explain *why* or *how* behind your points.")
    if dim.clarity < 60:
        hints.append("Work on clarity — shorter sentences and concrete examples help.")
    if dim.confidence < 55:
        hints.append("Sound more confident: replace hedging words like 'maybe' or 'I think' with assertive language.")
    if dim.structure < 55:
        hints.append("Structure your answer better — try the STAR method: Situation → Task → Action → Result.")
    if spacy["filler_word_count"] > 5:
        hints.append(f"Reduce filler words ({', '.join(spacy['filler_words_found'][:3])}) for a more polished delivery.")
    if spacy["star_score"] < 40 and "behavioral" in (spacy.get("question_type", "")):
        hints.append("Behavioral questions benefit greatly from the STAR format — include all four components.")
    if not hints:
        hints.append("Great answer! Keep up the strong performance.")
    return hints[:4]  # Max 4 hints per answer


def _zero_score(reason: str) -> ScoreResponse:
    zero_dim = DimensionScores(relevance=0, depth=0, clarity=0, confidence=0, structure=0, sentiment=0)
    zero_spacy = SpacyMetrics(
        filler_word_count=0, filler_words_found=[], star_components={},
        star_score=0, sentence_count=0, word_count=0, unique_word_ratio=0,
        avg_sentence_length=0, action_verb_count=0, tech_keyword_count=0, topics_detected=[],
    )
    return ScoreResponse(
        overall_score=0, dimension_scores=zero_dim, spacy_metrics=zero_spacy,
        feedback_hints=[f"Could not evaluate: {reason}"],
        processing_time_ms=0, model_used="none",
    )