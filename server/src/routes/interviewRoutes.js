const express = require("express")
const { getQuestionsController, scoreInterviewController } = require("../controllers/interviewController")

const interviewRouter = express.Router()

interviewRouter.get("/questions", getQuestionsController)
interviewRouter.post("/score",    scoreInterviewController)

module.exports = interviewRouter