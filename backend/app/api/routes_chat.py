from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.local_orchestrator import LocalOrchestrator
from app.database import get_db
from app.llm.llm_client import LLMClientError
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


def _llm_error_detail(exc: LLMClientError) -> str:
    message = str(exc).lower()
    if "api key" in message:
        return (
            "Clé API LLM manquante ou invalide. "
            "Ajoutez LLM_API_KEY dans votre fichier .env à la racine du projet, "
            "puis redémarrez le serveur."
        )
    return "Le service de génération de réponse est temporairement indisponible."


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    logger.info(
        "Chat request session=%s language=%s message_length=%s",
        request.session_id,
        request.language,
        len(request.message),
    )
    try:
        orchestrator = LocalOrchestrator(db)
        response = orchestrator.handle_chat(request)
        logger.info(
            "Chat response session=%s sources=%s suggested_actions=%s",
            request.session_id,
            len(response.sources),
            len(response.suggested_actions),
        )
        return response
    except LLMClientError as exc:
        db.rollback()
        logger.exception("LLM provider error during chat")
        raise HTTPException(
            status_code=503,
            detail=_llm_error_detail(exc),
        ) from exc
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected chat error")
        raise HTTPException(
            status_code=500,
            detail="Une erreur interne est survenue.",
        ) from exc
