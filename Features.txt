TOTAL FOLDER STRUCTURE

ai-mock-interview/
├── client/              # React Frontend (MERN ka R)
├── server/              # Node.js/Express Backend (MERN ka E+N)
├── mlservice/           # Python FastAPI ML Service (AI Model)
├── .env                 # Common env vars (DB_URL, JWT_SECRET)
├── .gitignore
├── docker-compose.yml   # Optional: Run all services together
└── README.md



CLIENT FOLDER STRUCTURE

client/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── InterviewChat.jsx     # Live chat UI
│   │   ├── ScoreRadar.jsx        # Feedback charts
│   │   └── JDInput.jsx           # Job Description form
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── Dashboard.jsx
│   ├── services/
│   │   └── api.js                # Axios calls to backend (/api/interview/start)
│   ├── context/
│   │   └── InterviewContext.jsx
│   ├── utils/
│   └── App.jsx
├── package.json
└── tailwind.config.js            # Styling (tumhare projects me use karte ho)


BACKEND FOLDER STRUCTURE 

server/
├── config/
│   └── db.js                    # MongoDB connection
├── controllers/
│   ├── authController.js        # User login/register
│   └── interviewController.js   # Core: start, answer, feedback
├── middleware/
│   └── auth.js                  # JWT protection
├── models/
│   ├── User.js                  # User schema
│   └── Session.js               # Interview data
├── routes/
│   ├── authRoutes.js            # /api/auth/*
│   └── interviewRoutes.js       # /api/interview/*
├── services/
│   ├── mlService.js             # Python ML HTTP calls (KEY FILE)
│   └── llmService.js            # OpenAI/Claude API
├── utils/
│   └── errorHandler.js          # Global error middleware
├── app.js                       # Middleware + routers config
├── server.js                    # DB connect + listen
├── .env                         # MONGO_URI, OPENAI_KEY, ML_URL=http://localhost:8000
├── package.json
└── .gitignore


ML FOLDER STRUCTURE 

mlservice/
├── app/
│   └── main.py                  # FastAPI: @app.post("/score")
├── models/
│   └── deberta_model.py         # Load fine-tuned DeBERTa (multi-head regression)
├── utils/
│   ├── preprocess.py            # Tokenize Q+A+JD
│   └── spacy_pipeline.py        # Rule-based: fillers, STAR structure
├── training/
│   ├── train.py                 # Fine-tune script
│   └── dataset.json             # Synthetic data (LLM generated)
├── requirements.txt
├── saved_models/
│   └── deberta/                 # .bin, config.json
└── run.py                       # uvicorn app.main:app --port 8000
