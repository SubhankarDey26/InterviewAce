from models.deberta_model import InterviewScorer

# Load trained model
scorer = InterviewScorer()
scorer.load()

# Input
question = "Why do you want to leave your current job?"

answer = "no company hate that don't know."

job_description = "Software Engineer role requiring problem-solving, teamwork, and growth mindset."

# Combine input (same format as training)
text = f"Question: {question} Answer: {answer} Job: {job_description}"

# Predict
scores = scorer.predict(text)

# Output
print("\nPredicted Scores:")
for k, v in scores.items():
    print(f"{k}: {v:.2f}")