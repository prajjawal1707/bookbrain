"""
Universal AI Client
Supports: Ollama (local) | Groq | OpenRouter | HuggingFace
All options are completely FREE.
"""
import os, json, re
import httpx
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

PROVIDER        = os.getenv("AI_PROVIDER", "ollama").lower()
OLLAMA_URL      = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2")
GROQ_KEY        = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OPENROUTER_KEY  = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL= os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
HF_KEY          = os.getenv("HF_API_KEY", "")
HF_MODEL        = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")


async def call_ai(prompt: str, max_tokens: int = 2000, system: str = "") -> str:
    """Route to the configured AI provider. All are free."""
    if PROVIDER == "ollama":
        return await _call_ollama(prompt, system, max_tokens)
    elif PROVIDER == "groq":
        return await _call_groq(prompt, system, max_tokens)
    elif PROVIDER == "openrouter":
        return await _call_openrouter(prompt, system, max_tokens)
    elif PROVIDER == "huggingface":
        return await _call_huggingface(prompt, system, max_tokens)
    else:
        raise ValueError(f"Unknown AI_PROVIDER='{PROVIDER}'. Choose: ollama, groq, openrouter, huggingface")


async def _call_ollama(prompt: str, system: str, max_tokens: int) -> str:
    """Ollama — 100% local, zero cost, zero data sent anywhere."""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False,
                  "options": {"num_predict": max_tokens}},
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]


async def _call_groq(prompt: str, system: str, max_tokens: int) -> str:
    """Groq — Free tier: 14,400 req/day. Extremely fast."""
    if not GROQ_KEY:
        raise ValueError("GROQ_API_KEY not set. Get a free key at console.groq.com")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"},
            json={"model": GROQ_MODEL, "messages": messages, "max_tokens": max_tokens},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_openrouter(prompt: str, system: str, max_tokens: int) -> str:
    """OpenRouter — Free models available (llama, mistral, etc.)"""
    if not OPENROUTER_KEY:
        raise ValueError("OPENROUTER_API_KEY not set. Get free credits at openrouter.ai")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENROUTER_KEY}", "Content-Type": "application/json",
                     "HTTP-Referer": "http://localhost:3000"},
            json={"model": OPENROUTER_MODEL, "messages": messages, "max_tokens": max_tokens},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def _call_huggingface(prompt: str, system: str, max_tokens: int) -> str:
    """HuggingFace Inference API — Free tier available."""
    if not HF_KEY:
        raise ValueError("HF_API_KEY not set. Get a free token at huggingface.co/settings/tokens")
    full_prompt = f"{system}\n\n{prompt}" if system else prompt

    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(
            f"https://api-inference.huggingface.co/models/{HF_MODEL}",
            headers={"Authorization": f"Bearer {HF_KEY}"},
            json={"inputs": full_prompt, "parameters": {"max_new_tokens": max_tokens, "return_full_text": False}},
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list):
            return data[0].get("generated_text", "")
        return str(data)


def parse_json_response(raw: str):
    """Safely extract JSON from an LLM response (handles markdown fences)."""
    text = raw.strip()
    # Strip markdown code fences
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last ``` if present
        inner = lines[1:]
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        text = "\n".join(inner).strip()
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try to find JSON array or object within text
    for pattern in [r'\[.*\]', r'\{.*\}']:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return None


async def get_provider_info() -> dict:
    """Return info about the currently configured AI provider."""
    return {
        "provider": PROVIDER,
        "model": {
            "ollama": OLLAMA_MODEL,
            "groq": GROQ_MODEL,
            "openrouter": OPENROUTER_MODEL,
            "huggingface": HF_MODEL,
        }.get(PROVIDER, "unknown"),
        "free": True,
        "local": PROVIDER == "ollama",
    }
