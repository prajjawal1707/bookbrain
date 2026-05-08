# BookBrain — Student Edition 📚🧠
> Free AI-powered study tool. Works with Ollama (local), Groq, OpenRouter, or HuggingFace. No paid APIs.

---

## What It Does

Paste any book chapter → AI extracts principles → Study with:
- **⚡ Flashcards** — flip through principles, mark what you know
- **🧠 Quiz Mode** — AI generates multiple-choice questions on your text
- **💬 AI Advisor** — chat tutor that reasons through the book's framework
- **📝 Notes** — personal notes linked to books
- **⭐ Bookmarks** — save key principles for review
- **📊 Dashboard** — streaks, achievements, quiz history

---

## Quick Start (5 Minutes)

### Step 1 — Install Requirements
- **Python 3.9+** → https://python.org/downloads
- **Node.js 18+** → https://nodejs.org

### Step 2 — Choose a FREE AI Provider (pick one)

| Provider | How to get | Speed | Internet needed? |
|---|---|---|---|
| **Ollama** (recommended) | Install from ollama.com, run `ollama pull llama3.2` | Fast | ❌ No — fully local |
| **Groq** | Free key at console.groq.com | Very fast | ✅ Yes |
| **OpenRouter** | Free key at openrouter.ai | Fast | ✅ Yes |
| **HuggingFace** | Free token at huggingface.co/settings/tokens | Slower | ✅ Yes |

### Step 3 — Configure
```bash
cd backend
cp .env.example .env
```
Open `backend/.env` and set your provider:
```
# For Ollama (local, no key needed):
AI_PROVIDER=ollama

# For Groq (free key):
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

### Step 4 — Start the App

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
Double-click `start.bat`

**Manual (two terminals):**
```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### Step 5 — Open Browser
```
http://localhost:3000
```

---

## How to Use for College

### Analyzing a Textbook Chapter
1. Go to **Analyze Books**
2. Enter the book title and author
3. Paste the chapter text (Ctrl+A, Ctrl+C from a PDF)
4. Choose **Standard** depth
5. Click **Run Analysis**

### Studying for an Exam
1. **Analyze** your chapter first
2. Go to **Flashcards** — flip through all principles
3. Mark what you know (✅) vs still learning (😅)
4. Go to **Quiz** — generate 5-10 questions
5. Review wrong answers with the **AI Advisor**

### Writing an Essay or Assignment
1. Analyze the relevant chapters
2. Open **AI Advisor** and ask:
   - "How does this principle connect to [your topic]?"
   - "Give me 3 examples of this principle in modern business"
   - "What would the author say about [your argument]?"
3. Save useful answers as **Notes**

---

## Project File Structure

```
bookbrain-free/
├── start.sh / start.bat          ← Run this to start everything
├── backend/
│   ├── .env                      ← YOUR CONFIG (copy from .env.example)
│   ├── requirements.txt
│   └── app/
│       ├── main.py               ← FastAPI app
│       ├── api/                  ← API routes
│       │   ├── analyze.py        ← POST /analyze-book/
│       │   ├── prompt.py         ← POST /generate-prompt/
│       │   ├── respond.py        ← POST /respond/
│       │   └── health.py         ← GET /health
│       ├── core/
│       │   ├── ai_client.py      ← Ollama/Groq/OpenRouter/HuggingFace
│       │   ├── extraction_engine.py
│       │   └── text_processor.py
│       └── services/
│           ├── package_store.py
│           └── prompt_builder.py
└── frontend/
    └── src/
        ├── pages/
        │   ├── AnalyzePage.jsx   ← Main analysis page
        │   ├── FlashcardsPage.jsx← Flashcard study mode
        │   ├── QuizPage.jsx      ← AI quiz generator
        │   ├── AdvisorPage.jsx   ← AI chat tutor
        │   ├── NotesPage.jsx     ← Personal notes
        │   ├── DashboardPage.jsx ← Progress & achievements
        │   ├── BookmarksPage.jsx ← Saved principles
        │   ├── PackagesPage.jsx  ← Book library
        │   └── PromptsPage.jsx   ← System prompt builder
        ├── components/
        │   ├── Layout.jsx        ← Sidebar + topbar
        │   └── Toast.jsx         ← Notifications
        └── lib/
            ├── AppContext.jsx    ← Global state + localStorage
            └── api.js            ← API calls
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "API offline" in sidebar | Start backend: `uvicorn app.main:app --reload --port 8000` |
| "Cannot connect to Ollama" | Run `ollama serve` in a separate terminal |
| Quiz questions look wrong | Try again — LLMs sometimes return unexpected formats |
| Text too short error | Paste more text (minimum 300 characters) |
| Blank page on frontend | Run `npm install` inside the `frontend/` folder |
| Port already in use | Change port: `uvicorn app.main:app --port 8001` and update `vite.config.js` |
