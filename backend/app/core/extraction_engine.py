"""
Extraction Engine — Uses free/local AI (Ollama, Groq, OpenRouter, HuggingFace).
Zero dependency on any paid API.
"""
import asyncio
from typing import List, Dict
from app.core.ai_client import call_ai, parse_json_response
from app.core.text_processor import TextChunk


# ── Prompts ────────────────────────────────────────────────────────────────

PRINCIPLE_PROMPT = """You are an expert analyst of philosophy, strategy, and behavioral psychology.

Analyze this text excerpt from "{title}" by {author} and extract ALL principles, laws, rules, and behavioral patterns you find.

TEXT:
{text}

Return a JSON array. Each item must have EXACTLY these fields:
[
  {{
    "principle_name": "Short memorable name (3-8 words)",
    "category": "one of: power_dynamics | strategy | psychology | philosophy | ethics | tactics | leadership | relationships",
    "description": "2-3 sentence explanation",
    "core_insight": "Single sentence capturing the essential truth",
    "when_to_apply": ["situation 1", "situation 2", "situation 3"],
    "when_not_to_apply": ["counter-situation 1", "counter-situation 2"],
    "example_scenarios": [
      {{
        "situation": "Real-world scenario",
        "application": "How to apply here",
        "expected_outcome": "What result to expect"
      }}
    ],
    "risk_level": "low or medium or high or critical",
    "related_principles": ["other principle name"],
    "keywords": ["word1", "word2", "word3"]
  }}
]

IMPORTANT: Return ONLY a valid JSON array. No explanation. No preamble. Start with [ and end with ]."""


PHILOSOPHY_PROMPT = """Analyze this book excerpt and extract the core philosophical framework.

Book: "{title}" by {author}
Text: {text_sample}

Return a JSON object with EXACTLY these fields:
{{
  "worldview": "2-3 sentence description of how this book views the world and human nature",
  "core_assumptions": ["assumption 1", "assumption 2", "assumption 3", "assumption 4"],
  "value_system": "What does this philosophy value most? (1-2 sentences)",
  "decision_making_model": "How does this philosophy recommend making decisions? (1-2 sentences)"
}}

Return ONLY valid JSON. Start with {{ and end with }}."""


GUIDELINES_PROMPT = """Based on these extracted principles from the book "{title}":

{principles_summary}

Generate practical guidelines for an AI using this framework.

Return a JSON object:
{{
  "behavioral_guidelines": [
    "Actionable guideline 1",
    "Actionable guideline 2",
    "Actionable guideline 3",
    "Actionable guideline 4",
    "Actionable guideline 5"
  ],
  "cautions": [
    "Important caution 1",
    "Important caution 2",
    "Important caution 3"
  ],
  "summary": "Two sentence summary of the book's core message."
}}

Return ONLY valid JSON."""


RESPOND_PROMPT = """You are {persona}, reasoning through the lens of "{book_title}".

ACTIVE PRINCIPLES:
{principles_block}

BEHAVIORAL GUIDELINES:
{guidelines}

REASONING PROCESS:
Before answering, silently work through:
1. What is the true nature of this situation?
2. Which principle applies most directly?
3. What are the power dynamics and stakes?
4. What response best serves long-term interests?

USER QUESTION: {query}

Respond as {persona}. Be practical and grounded in the principles above.

Return a JSON object:
{{
  "response": "Your full principled response here",
  "principle_applied": "Name of the most relevant principle",
  "reasoning_trace": ["step 1 of your reasoning", "step 2", "step 3"],
  "confidence": 0.85,
  "alternative_approaches": ["alternative 1", "alternative 2"]
}}

Return ONLY valid JSON."""


# ── Engine ─────────────────────────────────────────────────────────────────

class ExtractionEngine:

    async def extract_principles_from_chunk(self, chunk: TextChunk, title: str, author: str) -> List[Dict]:
        prompt = PRINCIPLE_PROMPT.format(
            title=title, author=author or "Unknown", text=chunk.text[:2500]
        )
        try:
            raw = await call_ai(prompt, max_tokens=2500)
            parsed = parse_json_response(raw)
            if isinstance(parsed, list):
                for i, p in enumerate(parsed):
                    p["id"] = f"p_{chunk.index}_{i:02d}"
                    p.setdefault("when_to_apply", [])
                    p.setdefault("when_not_to_apply", [])
                    p.setdefault("example_scenarios", [])
                    p.setdefault("keywords", [])
                    p.setdefault("related_principles", [])
                    p.setdefault("risk_level", "medium")
                    p.setdefault("category", "strategy")
                return parsed
        except Exception as e:
            print(f"[ExtractionEngine] Chunk {chunk.index} error: {e}")
        return []

    async def extract_philosophical_framework(self, text_sample: str, title: str, author: str) -> Dict:
        prompt = PHILOSOPHY_PROMPT.format(
            title=title, author=author or "Unknown", text_sample=text_sample[:2000]
        )
        try:
            raw = await call_ai(prompt, max_tokens=800)
            parsed = parse_json_response(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception as e:
            print(f"[ExtractionEngine] Philosophy error: {e}")
        return {
            "worldview": "A strategic worldview focused on power, influence, and human nature.",
            "core_assumptions": ["Self-interest drives most behavior", "Power dynamics are omnipresent",
                                  "Knowledge of human nature is leverage", "Long-term thinking beats short-term"],
            "value_system": "Strategic advantage, self-preservation, and mastery over circumstances.",
            "decision_making_model": "Calculate all angles, anticipate reactions, and prioritize long-term positioning.",
        }

    async def generate_guidelines(self, principles: List[Dict], title: str) -> Dict:
        summary_lines = [
            f"- {p.get('principle_name', '')}: {p.get('core_insight', '')}"
            for p in principles[:12]
        ]
        prompt = GUIDELINES_PROMPT.format(
            title=title,
            principles_summary="\n".join(summary_lines)
        )
        try:
            raw = await call_ai(prompt, max_tokens=1000)
            parsed = parse_json_response(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception as e:
            print(f"[ExtractionEngine] Guidelines error: {e}")
        return {
            "behavioral_guidelines": [
                "Always evaluate power dynamics before responding",
                "Consider long-term consequences over short-term gains",
                "Make contributions visible without threatening superiors",
                "Maintain strategic ambiguity when beneficial",
                "Document everything and build lateral alliances",
            ],
            "cautions": [
                "Ethics override strategy in all cases",
                "Do not apply manipulation in genuine trust-based relationships",
                "This framework describes power dynamics — use responsibly",
            ],
            "summary": f"A strategic framework extracted from {title}.",
        }

    async def extract_all(self, chunks: List[TextChunk], title: str, author: str, depth: str = "standard") -> Dict:
        limits = {"shallow": 2, "standard": 4, "deep": len(chunks)}
        selected = chunks[: limits.get(depth, 4)]

        # Sequential to avoid overwhelming local models; parallel for cloud providers
        all_principles = []
        for chunk in selected:
            results = await self.extract_principles_from_chunk(chunk, title, author)
            all_principles.extend(results)

        # Deduplicate by name
        seen, unique = set(), []
        for p in all_principles:
            key = p.get("principle_name", "").lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique.append(p)

        philosophy = await self.extract_philosophical_framework(
            chunks[0].text if chunks else "", title, author
        )
        guidelines_data = await self.generate_guidelines(unique, title)

        return {
            "principles": unique,
            "philosophical_framework": philosophy,
            "behavioral_guidelines": guidelines_data.get("behavioral_guidelines", []),
            "cautions": guidelines_data.get("cautions", []),
            "summary": guidelines_data.get("summary", ""),
        }

    async def generate_response(self, query: str, package: Dict, persona: str, style: str) -> Dict:
        principles = package.get("principles", [])[:10]
        principles_block = "\n".join(
            f"{i+1}. {p.get('principle_name','')}: {p.get('core_insight','')}"
            for i, p in enumerate(principles)
        )
        guidelines = "\n".join(f"• {g}" for g in package.get("behavioral_guidelines", [])[:5])
        style_note = {"concise": " Be brief (3 sentences max).", "detailed": " Be comprehensive.",
                      "tactical": " Give concrete action steps.", "advisory": " Be thoughtful and nuanced."}.get(style, "")

        prompt = RESPOND_PROMPT.format(
            persona=persona,
            book_title=package.get("book_title", "this framework"),
            principles_block=principles_block,
            guidelines=guidelines,
            query=query + style_note,
        )
        try:
            raw = await call_ai(prompt, max_tokens=1000)
            parsed = parse_json_response(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception as e:
            print(f"[ExtractionEngine] Respond error: {e}")
        return {
            "response": "I was unable to generate a structured response. Please check your AI provider configuration.",
            "principle_applied": None,
            "reasoning_trace": ["AI provider returned unexpected output"],
            "confidence": 0.0,
            "alternative_approaches": [],
        }
