"""
mlservice/utils/preprocess.py
================================
Input construction for DeBERTa.

Strategy: Pack Question + Answer + JD into a single string with
special separator tokens so the model sees full context.

Format:
  [QUESTION] <question_text> [ANSWER] <answer_text> [JD] <jd_snippet> [TYPE] <type>

Why not use token_type_ids for segments?
  DeBERTa-v3 uses a disentangled attention mechanism — it doesn't use
  traditional segment IDs the same way BERT does. Injecting semantic
  markers as plain text is cleaner and well-supported.
"""

import re
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)

# Maximum characters to include from job description (avoid token overflow)
JD_MAX_CHARS = 400

# Special tokens that frame each component
QUESTION_TOKEN = "[QUESTION]"
ANSWER_TOKEN   = "[ANSWER]"
JD_TOKEN       = "[JD]"
TYPE_TOKEN     = "[TYPE]"


def build_input_text(
    question:        str,
    answer:          str,
    job_description: Optional[str] = None,
    question_type:   Optional[str] = None,
) -> str:
    """
    Assemble the full input string passed to the tokenizer.

    Args:
        question:        The interview question text
        answer:          Candidate's answer
        job_description: Optional JD; truncated to JD_MAX_CHARS to save tokens
        question_type:   e.g. 'technical', 'behavioral', 'situational', 'hr'

    Returns:
        A single formatted string for tokenizer input.
    """
    question = _clean_text(question)
    answer   = _clean_text(answer)

    parts = [
        f"{QUESTION_TOKEN} {question}",
        f"{ANSWER_TOKEN} {answer}",
    ]

    if job_description:
        jd_snippet = _clean_text(job_description)[:JD_MAX_CHARS]
        parts.append(f"{JD_TOKEN} {jd_snippet}")

    if question_type:
        parts.append(f"{TYPE_TOKEN} {question_type.lower()}")

    return " ".join(parts)


def _clean_text(text: str) -> str:
    """
    Light cleaning:
    - Strip leading/trailing whitespace
    - Collapse multiple spaces/newlines to single space
    - Remove non-printable characters
    """
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x20-\x7E\u0900-\u097F]", "", text)  # Keep ASCII + Devanagari
    return text


def validate_inputs(question: str, answer: str) -> List[str]:
    """
    Return a list of validation error messages, or [] if all good.

    Designed to be called BEFORE expensive model inference.
    """
    errors = []

    if not question or len(question.strip()) < 5:
        errors.append("Question must be at least 5 characters long.")

    if not answer:
        errors.append("Answer cannot be empty.")
        return errors  # Can't do further answer checks

    if len(answer.strip()) < 10:
        errors.append("Answer is too short (min 10 characters). Provide a substantive response.")

    if len(answer) > 8000:
        errors.append("Answer is too long (max 8000 characters).")

    if len(answer.split()) < 3:
        errors.append("Answer must contain at least 3 words.")

    return errors


def truncate_to_tokens(text: str, max_words: int = 300) -> str:
    """
    Rough word-level truncation when the tokenizer is unavailable.
    Actual token truncation happens inside the tokenizer.
    """
    words = text.split()
    if len(words) > max_words:
        logger.warning(f"Text truncated from {len(words)} to {max_words} words.")
        return " ".join(words[:max_words]) + "…"
    return text


def extract_jd_keywords(job_description: str, top_n: int = 15) -> List[str]:
    """
    Simple keyword extractor for JD — used to compute relevance signal.
    Returns top N meaningful words (filters stop words).
    """
    stop_words = {
        "and", "or", "the", "a", "an", "in", "on", "at", "to", "for",
        "of", "with", "is", "are", "will", "be", "have", "has", "we",
        "you", "our", "your", "this", "that", "as", "by", "from",
    }
    words = re.findall(r"\b[a-zA-Z]{3,}\b", job_description.lower())
    freq = {}
    for w in words:
        if w not in stop_words:
            freq[w] = freq.get(w, 0) + 1
    sorted_words = sorted(freq, key=freq.get, reverse=True)
    return sorted_words[:top_n]


def compute_jd_overlap(answer: str, jd_keywords: List[str]) -> float:
    """
    Fraction of JD keywords mentioned in the answer.
    Used as a quick relevance signal in rule-based fallback.
    """
    if not jd_keywords:
        return 0.0
    answer_lower = answer.lower()
    hits = sum(1 for kw in jd_keywords if kw in answer_lower)
    return round(hits / len(jd_keywords), 4)