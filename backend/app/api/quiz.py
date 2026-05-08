import json, re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.ai_client import call_ai

router = APIRouter()

class QuizRequest(BaseModel):
    book_title: str
    principles: list
    num_questions: int = 5
    difficulty: Optional[str] = "medium"

def extract_json(text):
    if not isinstance(text, str):
        return None
    t = text.strip()
    # strip markdown fences
    if "```" in t:
        t = re.sub(r"```[a-z]*", "", t).replace("```", "").strip()
    # try direct parse
    try:
        r = json.loads(t)
        if isinstance(r, list) and len(r) > 0:
            return r
    except:
        pass
    # find array in text
    m = re.search(r'\[[\s\S]+\]', t)
    if m:
        try:
            r = json.loads(m.group())
            if isinstance(r, list) and len(r) > 0:
                return r
        except:
            pass
    return None

def validate_q(items):
    out = []
    for q in items:
        if not isinstance(q, dict):
            continue
        question = str(q.get("question","")).strip()
        options = q.get("options", [])
        if not question or not isinstance(options, list) or len(options) < 2:
            continue
        options = [str(o).strip() for o in options]
        while len(options) < 4:
            options.append("None of the above")
        options = options[:4]
        try:
            ci = int(q.get("correct_index", 0))
        except:
            ci = 0
        if ci < 0 or ci >= len(options):
            ci = 0
        out.append({
            "question": question,
            "options": options,
            "correct_index": ci,
            "explanation": str(q.get("explanation","This is the correct answer based on the principle.")).strip(),
            "principle_name": str(q.get("principle_name","")).strip()
        })
    return out

@router.post("/")
async def generate_quiz(req: QuizRequest):
    if not req.principles:
        raise HTTPException(400, "No principles provided.")
    pts = "\n".join(
        f"- {p.get('principle_name','')}: {p.get('core_insight', p.get('description',''))}"
        for p in req.principles[:10]
    )
    prompt = f"""You are a quiz generator. Create exactly {req.num_questions} multiple choice questions about these principles from "{req.book_title}".

PRINCIPLES:
{pts}

IMPORTANT: Return ONLY a raw JSON array. No markdown. No explanation. No text before or after. Just the JSON array starting with [ and ending with ].

Format:
[
  {{
    "question": "Your question here?",
    "options": ["Answer A", "Answer B", "Answer C", "Answer D"],
    "correct_index": 0,
    "explanation": "Why this answer is correct.",
    "principle_name": "Relevant principle"
  }}
]

Difficulty: {req.difficulty}. Test real understanding, not just memorization. Generate exactly {req.num_questions} questions."""

    last = ""
    for attempt in range(3):
        try:
            raw = await call_ai(prompt, max_tokens=3000)
            items = extract_json(raw)
            if not items:
                last = f"Attempt {attempt+1}: no JSON found in: {raw[:200]}"
                continue
            questions = validate_q(items)
            if not questions:
                last = f"Attempt {attempt+1}: no valid questions"
                continue
            return {"status": "success", "questions": questions, "total": len(questions), "book_title": req.book_title}
        except Exception as e:
            last = f"Attempt {attempt+1}: {e}"
    raise HTTPException(500, f"Failed after 3 attempts. {last}")
