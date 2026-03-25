const fs = require("fs")
const path = require("path")
const questions = require("../data/questions.json")
const { batchScoreAnswers } = require("../services/mlService")

const datasetQuestions = (() => {
  try {
    const datasetPath = path.resolve(__dirname, "../../..", "mlservice", "training", "dataset.json")
    const raw = fs.readFileSync(datasetPath, "utf8")
    const examples = JSON.parse(raw)
    const grouped = { technical: [], behavioral: [], hr: [] }
    const seen = new Set()

    for (const item of examples) {
      const typeKey = (item.question_type || "hr").toLowerCase()
      if (!grouped[typeKey]) grouped[typeKey] = []
      if (!seen.has(item.question)) {
        seen.add(item.question)
        grouped[typeKey].push({ id: `${typeKey}-${grouped[typeKey].length + 1}`, question: item.question })
      }
    }

    return grouped
  } catch (err) {
    console.warn("[interviewController] Unable to load dataset.json fallback questions:", err.message)
    return null
  }
})()

async function getQuestionsController(req, res) {
  try {
    const { type = "technical", count = "3" } = req.query
    const typeKey = type.toLowerCase()
    const pool = (questions[typeKey] && questions[typeKey].length > 0)
      ? questions[typeKey]
      : (datasetQuestions && datasetQuestions[typeKey] && datasetQuestions[typeKey].length > 0)
        ? datasetQuestions[typeKey]
        : questions.technical

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, parseInt(count, 10))

    res.status(200).json({ questions: selected, type: typeKey })
  } catch (err) {
    console.error("[interviewController] getQuestions error:", err)
    res.status(500).json({ message: "Failed to fetch questions" })
  }
}

async function scoreInterviewController(req, res) {
  try {
    const { answers, job_description, question_type } = req.body

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "No answers provided" })
    }

    const payloads = answers
      .filter(item => item.question && item.question.trim().length >= 5 && item.answer && item.answer.trim().length >= 1)
      .map(item => ({
        question:        item.question,
        answer:          item.answer,
        job_description: job_description || "",
        question_type:   (question_type || "mixed").toLowerCase(),
      }))

    if (payloads.length === 0) {
      return res.status(400).json({ message: "No valid answers to score" })
    }

    const results = await batchScoreAnswers(payloads)

    const valid = results.filter(r => r.data)
    const n = Math.max(valid.length, 1)

    const avgOverall = valid.reduce((s, r) => s + (r.data.overall_score || 0), 0) / n

    const dims = { relevance: 0, depth: 0, clarity: 0, confidence: 0, structure: 0, sentiment: 0 }
    valid.forEach(r => {
      const d = r.data.dimension_scores || {}
      Object.keys(dims).forEach(k => { dims[k] += (d[k] || 0) / n })
    })

    const allHints = valid.flatMap(r => r.data.feedback_hints || [])
    const uniqueHints = [...new Set(allHints)].slice(0, 4)

    const perQuestion = results.map((r, i) => ({
      question: answers[i].question,
      answer:   answers[i].answer,
      score:    r.data?.overall_score || 0,
      feedback: r.data?.feedback_hints || [],
      model:    r.data?.model_used || "unknown",
    }))

    res.status(200).json({
      overall_score:      Math.round(avgOverall),
      dimension_scores:   Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, Math.round(v)])),
      per_question_scores: perQuestion,
      feedback_hints:     uniqueHints,
      model_used:         results[0]?.data?.model_used || "unknown",
    })
  } catch (err) {
    console.error("[interviewController] scoreInterview error:", err)
    res.status(500).json({ message: "Failed to score interview" })
  }
}

module.exports = { getQuestionsController, scoreInterviewController }