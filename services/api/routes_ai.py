"""
services/api/routes_ai.py
Generative AI Analyst endpoints for natural language interpretation of verified VAYU statistical and ML data.
"""

from __future__ import annotations

import os
from fastapi import APIRouter
from core.schemas import AIAnalysisRequest, AIAnalysisResponse
from services.engine.ai.analyst import process_ai_analyst_query

router = APIRouter(prefix="/api/v1/ai", tags=["Generative AI Analyst"])


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_with_ai(payload: AIAnalysisRequest) -> AIAnalysisResponse:
    """
    Executes grounded AI analysis on structured VAYU macroeconomic context, ML forecasts, or passenger route queries.
    Cascades automatically: Groq ➔ Gemini ➔ OpenRouter ➔ Deterministic Grounded Fallback Engine.
    """
    return process_ai_analyst_query(payload)


@router.get("/status")
def get_ai_status() -> dict:
    """
    Returns configured AI provider availability and active fallback hierarchy.
    """
    active_providers = []
    if os.getenv("GROQ_API_KEY"):
        active_providers.append("Groq (Llama-3.3-70B)")
    if os.getenv("GEMINI_API_KEY"):
        active_providers.append("Gemini (1.5-Flash)")
    if os.getenv("OPENROUTER_API_KEY"):
        active_providers.append("OpenRouter (Llama-3.3-70B)")
    active_providers.append("Deterministic Grounded Fallback Engine")

    return {
        "status": "ONLINE",
        "active_providers": active_providers,
        "primary_provider": active_providers[0] if active_providers else "Deterministic Grounded Engine",
        "grounding_policy": "STRICT_NUMERICAL_GROUNDING_ONLY",
        "hallucination_prevention": "ENABLED",
    }
