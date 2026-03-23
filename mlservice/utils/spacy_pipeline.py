"""
mlservice/utils/spacy_pipeline.py
====================================
Rule-based NLP analysis using spaCy.
Runs FAST (CPU, no GPU needed) and provides structural metrics
that complement the DeBERTa neural scores.

Analyses performed:
  1. Filler word detection
  2. STAR method component detection (behavioral Qs)
  3. Action verb count
  4. Tech keyword density
  5. Sentence/word statistics
  6. Topic tagging
"""

import re
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# ─── Attempt to load spaCy ────────────────────────────────────────────────────
try:
    import spacy
    # Try to load medium English model; fallback to small
    try:
        nlp = spacy.load("en_core_web_md")
        SPACY_MODEL = "en_core_web_md"
    except OSError:
        try:
            nlp = spacy.load("en_core_web_sm")
            SPACY_MODEL = "en_core_web_sm"
        except OSError:
            nlp = None
            SPACY_MODEL = "none"
    logger.info(f"spaCy loaded: {SPACY_MODEL}")
except ImportError:
    nlp = None
    SPACY_MODEL = "not_installed"
    logger.warning("spaCy not installed — using regex-only fallback.")


# ─── Lexicons ────────────────────────────────────────────────────────────────

FILLER_WORDS = {
    "um", "uh", "er", "ah", "like", "you know", "kind of", "sort of",
    "basically", "literally", "honestly", "actually", "right", "okay so",
    "i mean", "at the end of the day", "to be honest", "you know what i mean",
    "obviously", "clearly", "well", "so basically",
}

# STAR keyword banks
STAR_KEYWORDS = {
    "situation": [
        "when i was", "at my previous", "in my last", "during my time",
        "while working", "at the company", "in the project", "the context was",
        "the situation was", "we were", "our team was", "i was working on",
        "background", "the scenario", "at that time",
    ],
    "task": [
        "my responsibility", "my role was", "i was responsible", "i had to",
        "the challenge was", "my goal was", "i needed to", "the objective was",
        "i was tasked", "the requirement", "my job was", "i was asked",
        "the task was", "my assignment",
    ],
    "action": [
        "i decided", "i implemented", "i built", "i created", "i designed",
        "i developed", "i led", "i coordinated", "i collaborated", "i refactored",
        "i optimized", "i fixed", "i resolved", "i proposed", "i introduced",
        "i took", "i wrote", "i deployed", "i managed", "i communicated",
        "my approach was", "what i did", "the steps i took",
    ],
    "result": [
        "as a result", "this resulted in", "we achieved", "we reduced",
        "we improved", "we increased", "the outcome was", "which led to",
        "this helped", "we saved", "performance improved", "the impact was",
        "successfully", "in the end", "ultimately", "the team was able",
        "we delivered", "i was able to", "the result was",
    ],
}

ACTION_VERBS = {
    "achieved", "built", "created", "designed", "developed", "drove",
    "executed", "generated", "implemented", "improved", "increased",
    "led", "launched", "managed", "optimized", "produced", "reduced",
    "resolved", "saved", "scaled", "shipped", "streamlined", "transformed",
    "delivered", "coordinated", "facilitated", "mentored", "negotiated",
    "automated", "architected", "refactored", "deployed", "integrated",
}

TECH_KEYWORDS = {
    # Languages
    "python", "javascript", "typescript", "java", "golang", "rust", "c++", "sql",
    # Frameworks
    "react", "angular", "vue", "node", "django", "fastapi", "flask", "spring",
    # DB
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch", "dynamodb",
    # Cloud / Infra
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "jenkins",
    "ci/cd", "devops", "microservice", "serverless", "lambda",
    # CS concepts
    "algorithm", "data structure", "system design", "api", "rest", "graphql",
    "cache", "queue", "pubsub", "grpc", "authentication", "oauth",
    "load balancer", "sharding", "replication", "indexing", "latency",
    "throughput", "scalable", "distributed", "concurrency", "async",
    # ML
    "machine learning", "neural network", "bert", "transformer", "embedding",
    "fine-tuning", "inference", "model", "training", "dataset",
}

TOPIC_PATTERNS = {
    "Problem Solving":    ["solved", "solution", "debug", "fix", "approach", "algorithm", "root cause"],
    "Leadership":         ["led", "managed", "mentored", "team", "stakeholder", "vision", "strategy"],
    "Communication":      ["communicated", "presented", "explained", "articulated", "aligned", "feedback"],
    "Collaboration":      ["collaborated", "worked with", "cross-functional", "partnered", "together"],
    "Adaptability":       ["adapted", "changed", "pivot", "new", "learned quickly", "flexible"],
    "Conflict Resolution":["conflict", "disagreement", "resolved", "negotiated", "compromise", "tension"],
    "Time Management":    ["deadline", "priority", "sprint", "schedule", "on time", "managed time"],
    "Innovation":         ["innovative", "new approach", "creative", "improved process", "automation"],
    "Technical Depth":    ["architecture", "design pattern", "tradeoff", "complexity", "scale", "performance"],
    "Ownership":          ["owned", "took ownership", "accountability", "responsible", "drove"],
}


# ─── SpacyAnalyzer ────────────────────────────────────────────────────────────

class SpacyAnalyzer:
    """
    Encapsulates all rule-based NLP analysis.
    If spaCy is unavailable, falls back to pure regex.
    """

    def __init__(self):
        self.nlp = nlp
        self.model_name = SPACY_MODEL
        logger.info(f"SpacyAnalyzer initialized (model={SPACY_MODEL})")

    def analyze(self, answer: str, question_type: str = "mixed") -> Dict[str, Any]:
        """
        Main analysis entry point.

        Returns a dict matching the SpacyMetrics schema in main.py.
        """
        answer_lower = answer.lower()

        # --- Filler words ---
        fillers_found = self._detect_fillers(answer_lower)

        # --- STAR components ---
        star_components, star_score = self._detect_star(answer_lower, question_type)

        # --- Token/sentence stats ---
        sentences = self._split_sentences(answer)
        words     = re.findall(r"\b\w+\b", answer)
        n_words   = len(words)
        n_sents   = max(len(sentences), 1)
        unique_ratio = round(len(set(w.lower() for w in words)) / max(n_words, 1), 4)
        avg_sent_len = round(n_words / n_sents, 2)

        # --- Action verbs ---
        action_count = self._count_action_verbs(answer_lower, words)

        # --- Tech keywords ---
        tech_count = self._count_tech_keywords(answer_lower)

        # --- Topics ---
        topics = self._detect_topics(answer_lower)

        return {
            "filler_word_count":   len(fillers_found),
            "filler_words_found":  list(set(fillers_found))[:10],
            "star_components":     star_components,
            "star_score":          star_score,
            "sentence_count":      n_sents,
            "word_count":          n_words,
            "unique_word_ratio":   unique_ratio,
            "avg_sentence_length": avg_sent_len,
            "action_verb_count":   action_count,
            "tech_keyword_count":  tech_count,
            "topics_detected":     topics,
            "question_type":       question_type,
        }

    # ── Filler detection ─────────────────────────────────────────────────────

    def _detect_fillers(self, text_lower: str) -> List[str]:
        found = []
        for filler in FILLER_WORDS:
            # Use word boundary for single words, substring for phrases
            if " " in filler:
                if filler in text_lower:
                    count = text_lower.count(filler)
                    found.extend([filler] * count)
            else:
                matches = re.findall(rf"\b{re.escape(filler)}\b", text_lower)
                found.extend(matches)
        return found

    # ── STAR detection ───────────────────────────────────────────────────────

    def _detect_star(self, text_lower: str, question_type: str) -> tuple:
        """
        Check for presence of each STAR component.
        Returns (component_dict, score_0_to_100).
        STAR matters most for behavioral; less so for technical.
        """
        components = {}
        for component, keywords in STAR_KEYWORDS.items():
            components[component] = any(kw in text_lower for kw in keywords)

        present = sum(components.values())

        # Weight: behavioral/situational care most about STAR
        if question_type in ("behavioral", "situational"):
            star_score = (present / 4) * 100
        elif question_type == "technical":
            # Technical: partial credit — action + result are most important
            key_present = sum([components.get("action", False), components.get("result", False)])
            star_score = 50 + (key_present / 2) * 50  # Range 50–100
        else:
            star_score = 40 + (present / 4) * 60  # Range 40–100

        return components, round(star_score, 1)

    # ── Action verbs ─────────────────────────────────────────────────────────

    def _count_action_verbs(self, text_lower: str, words: List[str]) -> int:
        if self.nlp:
            # Use spaCy lemmatization for better coverage
            try:
                doc = self.nlp(text_lower[:2000])  # Cap for performance
                return sum(
                    1 for token in doc
                    if token.lemma_ in ACTION_VERBS and token.pos_ == "VERB"
                )
            except Exception:
                pass
        # Regex fallback
        return sum(1 for w in words if w.lower() in ACTION_VERBS)

    # ── Tech keywords ────────────────────────────────────────────────────────

    def _count_tech_keywords(self, text_lower: str) -> int:
        count = 0
        for kw in TECH_KEYWORDS:
            if kw in text_lower:
                count += 1
        return count

    # ── Topic detection ──────────────────────────────────────────────────────

    def _detect_topics(self, text_lower: str) -> List[str]:
        detected = []
        for topic, signals in TOPIC_PATTERNS.items():
            if any(s in text_lower for s in signals):
                detected.append(topic)
        return detected[:6]  # Return max 6 topics

    # ── Sentence splitting ───────────────────────────────────────────────────

    def _split_sentences(self, text: str) -> List[str]:
        if self.nlp:
            try:
                doc = self.nlp(text[:3000])
                return [str(sent).strip() for sent in doc.sents if len(str(sent).strip()) > 3]
            except Exception:
                pass
        # Regex fallback
        sents = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sents if len(s.strip()) > 3]