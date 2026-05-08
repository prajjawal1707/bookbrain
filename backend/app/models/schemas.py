from __future__ import annotations
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class AnalyzeBookRequest(BaseModel):
    title: str
    author: Optional[str] = None
    text: str = Field(..., min_length=300)
    extraction_depth: Literal["shallow", "standard", "deep"] = "standard"
    focus_areas: Optional[List[str]] = None

    class Config:
        json_schema_extra = {"example": {
            "title": "The 48 Laws of Power",
            "author": "Robert Greene",
            "text": "LAW 1: NEVER OUTSHINE THE MASTER...",
            "extraction_depth": "standard"
        }}


class GeneratePromptRequest(BaseModel):
    behavior_package_id: Optional[str] = None
    raw_package: Optional[dict] = None
    persona: str = "strategic advisor"
    tone: Literal["formal", "conversational", "socratic", "direct"] = "direct"
    include_reasoning_steps: bool = True
    selected_principles: Optional[List[str]] = None


class RespondRequest(BaseModel):
    user_query: str = Field(..., min_length=3)
    behavior_package_id: Optional[str] = None
    behavior_package: Optional[dict] = None
    system_prompt: Optional[str] = None
    persona: str = "strategic advisor"
    response_style: Literal["concise", "detailed", "tactical", "advisory"] = "advisory"
