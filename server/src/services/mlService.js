const axios = require("axios")

const ML_URL = process.env.ML_URL || "http://localhost:8000"
const USE_HEURISTIC_FALLBACK = process.env.ML_FALLBACK !== "false" // set ML_FALLBACK=false to enforce model-only scoring

async function scoreAnswer({ question, answer, job_description, question_type }) {
  try {
    const response = await axios.post(
      `${ML_URL}/score`,
      {
        question,
        answer,
        job_description: job_description || "",
        question_type: (question_type || "mixed").toLowerCase(),
      },
      { timeout: 30000 }
    )
    return { success: true, data: response.data }
  } catch (err) {
    if (!USE_HEURISTIC_FALLBACK) {
      console.error("[mlService] ML endpoint unavailable and fallback disabled:", err.message)
      throw new Error("ML model unavailable; fallback disabled")
    }
    console.warn("[mlService] ML endpoint unavailable, using heuristic fallback:", err.message)
    return { success: false, data: heuristicScore(question, answer) }
  }
}

async function batchScoreAnswers(payloads) {
  return Promise.all(payloads.map(p => scoreAnswer(p)))
}

function heuristicScore(question, answer) {
  const words = (answer || "").split(/\s+/).filter(Boolean)
  const sentences = (answer || "").split(/[.!?]+/).filter(s => s.trim().length > 3)
  const wordCount = words.length
  const sentenceCount = Math.max(sentences.length, 1)
  const avgLen = wordCount / sentenceCount

  const STRONG = new Set(["achieved","built","led","delivered","designed","solved","improved","managed","created","implemented","reduced","increased","deployed"])
  const FILLER = new Set(["um","uh","like","basically","literally","kind","sort","maybe","probably","honestly"])
  const TECH   = new Set(["algorithm","api","database","react","python","node","sql","nosql","aws","docker","kubernetes","microservice","cache","queue","rest","architecture","scalable"])

  const lower = (answer || "").toLowerCase()
  const strongCount = words.filter(w => STRONG.has(w.toLowerCase())).length
  const fillerCount = words.filter(w => FILLER.has(w.toLowerCase())).length
  const techCount   = [...TECH].filter(t => lower.includes(t)).length

  const base        = Math.min(85, Math.max(35, 45 + wordCount * 0.4))
  const relevance   = clamp(base + techCount * 3 + strongCount * 2)
  const depth       = clamp(base + Math.min(wordCount * 0.3, 20))
  const clarity     = clamp(base - fillerCount * 4 - Math.abs(avgLen - 16) * 1.2)
  const confidence  = clamp(base + strongCount * 5 - fillerCount * 6)
  const structure   = clamp(40 + sentenceCount * 4)
  const sentiment   = clamp(base + strongCount * 3 - fillerCount * 2)
  const overall     = Math.round((relevance * 0.25 + depth * 0.20 + clarity * 0.20 + confidence * 0.15 + structure * 0.15 + sentiment * 0.05))

  const hints = []
  if (relevance < 60)   hints.push("Try to address the question more directly.")
  if (depth < 55)       hints.push("Add more depth — explain the why and how behind your answer.")
  if (fillerCount > 4)  hints.push("Reduce filler words for a more confident delivery.")
  if (structure < 55)   hints.push("Structure your answer using the STAR method: Situation → Task → Action → Result.")
  if (hints.length === 0) hints.push("Strong answer — clear and well-structured.")

  return {
    overall_score: overall,
    dimension_scores: { relevance, depth, clarity, confidence, structure, sentiment },
    feedback_hints: hints.slice(0, 3),
    model_used: "heuristic-fallback",
  }
}

function clamp(v) { return Math.round(Math.min(100, Math.max(20, v))) }

module.exports = { scoreAnswer, batchScoreAnswers }