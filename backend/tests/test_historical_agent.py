from __future__ import annotations

from unittest.mock import MagicMock

from app.agents.historical_agent import HistoricalAgent
from app.config import Settings
from app.llm.llm_client import MockLLMClient
from app.rag.prompts import NO_RELEVANT_WEB_RESULTS_ANSWER
from app.rag.retriever import RetrievalFilters
from app.tools.web_search_tool import BaseWebSearchTool, WebSearchResult


class TrackingRetriever:
    def __init__(self) -> None:
        self.calls: list[tuple[str, int, RetrievalFilters | None]] = []

    def retrieve(
        self,
        query: str,
        *,
        top_k: int = 5,
        filters: RetrievalFilters | None = None,
    ) -> list[dict]:
        self.calls.append((query, top_k, filters))
        return [
            {
                "source_type": "monument",
                "source_id": 3.9,
                "title": "Thermes d'Antonin",
                "score": 0.91,
                "chunk_text": "Les Thermes d'Antonin sont un complexe thermal romain.",
                "metadata": {
                    "site_id": 3,
                    "site_name": "Parc des thermes d'Antonin",
                },
            }
        ]


def test_historical_agent_returns_sources_and_calls_retriever() -> None:
    retriever = TrackingRetriever()
    settings = Settings(llm_provider="mock", rag_min_score=0.65)
    agent = HistoricalAgent(
        MagicMock(),
        retriever=retriever,
        llm=MockLLMClient(response="Réponse historique de test."),
        settings=settings,
    )

    result = agent.answer(
        user_message="Explique-moi les Thermes d'Antonin",
        memory_context={"preferred_language": "fr"},
        language="fr",
    )

    assert len(retriever.calls) == 1
    assert retriever.calls[0][1] == 3
    assert result.answer == "Réponse historique de test."
    assert len(result.sources) == 1
    assert result.sources[0].title == "Thermes d'Antonin"
    assert result.sources[0].source_id == 3.9
    assert result.memory_updates["last_mentioned_monuments"] == ["Thermes d'Antonin"]
    assert result.memory_updates["primary_site_id"] == 3


def test_historical_agent_insufficient_context_skips_llm() -> None:
    class LowScoreRetriever:
        def retrieve(
            self,
            query: str,
            *,
            top_k: int = 5,
            filters: RetrievalFilters | None = None,
        ) -> list[dict]:
            return [
                {
                    "source_type": "monument",
                    "source_id": 1.0,
                    "title": "Monument",
                    "score": 0.10,
                    "chunk_text": "low score",
                    "metadata": {},
                }
            ]

    llm = MockLLMClient(response="Ne doit pas être utilisé.")
    agent = HistoricalAgent(
        MagicMock(),
        retriever=LowScoreRetriever(),
        llm=llm,
        settings=Settings(llm_provider="mock", rag_min_score=0.65),
    )

    result = agent.answer(user_message="Question sans contexte")

    assert "informations suffisantes" in result.answer.lower()
    assert len(result.sources) == 1


class MockWebSearchTool(BaseWebSearchTool):
    def __init__(self) -> None:
        self.calls: list[tuple[str, int]] = []

    def search(
        self,
        query: str,
        max_results: int = 3,
        *,
        region: str | None = None,
    ) -> list[WebSearchResult]:
        self.calls.append((query, max_results))
        return [
            WebSearchResult(
                title="Patrimoine de Carthage",
                url="https://example.com/carthage",
                snippet=(
                    "Informations sur les Thermes d'Antonin et la colline de Byrsa "
                    "à Carthage, Tunisie."
                ),
            )
        ]


class LowScoreRetriever:
    def retrieve(
        self,
        query: str,
        *,
        top_k: int = 5,
        filters: RetrievalFilters | None = None,
    ) -> list[dict]:
        return [
            {
                "source_type": "monument",
                "source_id": 1.0,
                "title": "Monument",
                "score": 0.10,
                "chunk_text": "court",
                "metadata": {},
            }
        ]


def test_historical_agent_does_not_call_web_search_when_local_context_sufficient() -> None:
    web_tool = MockWebSearchTool()
    agent = HistoricalAgent(
        MagicMock(),
        retriever=TrackingRetriever(),
        llm=MockLLMClient(response="Réponse locale."),
        settings=Settings(llm_provider="mock", web_search_enabled=True),
        web_search_tool=web_tool,
    )

    agent.answer(
        user_message="Explique-moi les Thermes d'Antonin",
        memory_context={"preferred_language": "fr"},
        language="fr",
    )

    assert web_tool.calls == []


def test_historical_agent_calls_web_search_when_local_context_insufficient_and_enabled() -> None:
    web_tool = MockWebSearchTool()
    llm = MockLLMClient(response="Réponse enrichie par le web.")
    agent = HistoricalAgent(
        MagicMock(),
        retriever=LowScoreRetriever(),
        llm=llm,
        settings=Settings(
            llm_provider="mock",
            rag_min_score=0.65,
            web_search_enabled=True,
        ),
        web_search_tool=web_tool,
    )

    result = agent.answer(
        user_message="Donne-moi plus de détails historiques sur Byrsa",
    )

    assert len(web_tool.calls) == 1
    assert result.answer == "Réponse enrichie par le web."
    assert any(source.source_type == "web" for source in result.sources)


def test_historical_agent_calls_web_search_for_explicit_request_even_when_local_sufficient() -> None:
    web_tool = MockWebSearchTool()
    agent = HistoricalAgent(
        MagicMock(),
        retriever=TrackingRetriever(),
        llm=MockLLMClient(response="Réponse avec complément web."),
        settings=Settings(llm_provider="mock", web_search_enabled=True),
        web_search_tool=web_tool,
    )

    result = agent.answer(
        user_message="Cherche en ligne des informations sur les Thermes d'Antonin",
    )

    assert len(web_tool.calls) >= 1
    assert any(source.source_type == "web" for source in result.sources)


def test_historical_agent_calls_web_search_for_explicit_request_when_disabled() -> None:
    web_tool = MockWebSearchTool()
    agent = HistoricalAgent(
        MagicMock(),
        retriever=TrackingRetriever(),
        llm=MockLLMClient(response="Réponse web explicite."),
        settings=Settings(llm_provider="mock", web_search_enabled=False),
        web_search_tool=web_tool,
    )

    agent.answer(
        user_message="Chercher sur le web les fouilles à Carthage",
        memory_context={"preferred_language": "fr"},
        language="fr",
    )

    assert len(web_tool.calls) >= 1


def test_historical_agent_does_not_call_web_search_when_disabled() -> None:
    web_tool = MockWebSearchTool()
    llm = MockLLMClient(response="Ne doit pas être utilisé.")
    agent = HistoricalAgent(
        MagicMock(),
        retriever=LowScoreRetriever(),
        llm=llm,
        settings=Settings(
            llm_provider="mock",
            rag_min_score=0.65,
            web_search_enabled=False,
        ),
        web_search_tool=web_tool,
    )

    result = agent.answer(
        user_message="Donne-moi plus de détails historiques sur Byrsa",
    )

    assert web_tool.calls == []
    assert "informations suffisantes" in result.answer.lower()


def test_historical_agent_web_search_failure_does_not_crash() -> None:
    class FailingWebSearchTool(BaseWebSearchTool):
        def search(
            self,
            query: str,
            max_results: int = 3,
            *,
            region: str | None = None,
        ) -> list[WebSearchResult]:
            raise RuntimeError("ddg down")

    llm = MockLLMClient(response="Réponse locale de secours.")
    agent = HistoricalAgent(
        MagicMock(),
        retriever=LowScoreRetriever(),
        llm=llm,
        settings=Settings(
            llm_provider="mock",
            rag_min_score=0.65,
            web_search_enabled=True,
        ),
        web_search_tool=FailingWebSearchTool(),
    )

    result = agent.answer(
        user_message="Donne-moi plus de détails historiques sur Byrsa",
    )

    assert result.answer == "Réponse locale de secours."
    assert len(result.sources) == 1
    assert result.sources[0].source_type == "monument"


def test_historical_agent_explicit_web_request_falls_back_to_local_when_web_empty() -> None:
    class PortPuniqueRetriever:
        def retrieve(
            self,
            query: str,
            *,
            top_k: int = 5,
            filters: RetrievalFilters | None = None,
        ) -> list[dict]:
            return [
                {
                    "source_type": "monument",
                    "source_id": 12.0,
                    "title": "Ports puniques",
                    "score": 0.91,
                    "chunk_text": (
                        "Les ports puniques de Carthage comprenaient le port militaire "
                        "et le port commercial, reliés par un canal."
                    ),
                    "metadata": {"site_id": 12, "site_name": "Ports puniques"},
                }
            ]

    class EmptyWebSearchTool(BaseWebSearchTool):
        def search(
            self,
            query: str,
            max_results: int = 3,
            *,
            region: str | None = None,
        ) -> list[WebSearchResult]:
            return [
                WebSearchResult(
                    title="Port — Wikipédia",
                    url="https://fr.wikipedia.org/wiki/Port",
                    snippet="Un port est une infrastructure maritime.",
                )
            ]

    llm = MockLLMClient(response="Réponse locale sur les ports puniques.")
    agent = HistoricalAgent(
        MagicMock(),
        retriever=PortPuniqueRetriever(),
        llm=llm,
        settings=Settings(llm_provider="mock", web_search_enabled=False),
        web_search_tool=EmptyWebSearchTool(),
    )

    result = agent.answer(
        user_message="Faite une recherche sur le port punique de carthage",
        memory_context={"preferred_language": "fr"},
        language="fr",
    )

    assert result.answer == "Réponse locale sur les ports puniques."
    assert any(source.source_type == "monument" for source in result.sources)
    assert not any(source.source_type == "web" for source in result.sources)


def test_historical_agent_explicit_web_request_without_relevant_results_skips_llm() -> None:
    class EmptyWebSearchTool(BaseWebSearchTool):
        def search(
            self,
            query: str,
            max_results: int = 3,
            *,
            region: str | None = None,
        ) -> list[WebSearchResult]:
            return [
                WebSearchResult(
                    title="Fouille — Wikipédia",
                    url="https://fr.wikipedia.org/wiki/Fouille",
                    snippet="En France, on distingue deux catégories de fouilles archéologiques.",
                )
            ]

    llm = MockLLMClient(response="Ne doit pas être utilisé.")
    agent = HistoricalAgent(
        MagicMock(),
        retriever=LowScoreRetriever(),
        llm=llm,
        settings=Settings(llm_provider="mock", web_search_enabled=True),
        web_search_tool=EmptyWebSearchTool(),
    )

    result = agent.answer(
        user_message=(
            "Recherche sur internet des informations récentes sur les fouilles "
            "archéologiques à Carthage"
        ),
    )

    assert result.answer == NO_RELEVANT_WEB_RESULTS_ANSWER
    assert not any(source.source_type == "web" for source in result.sources)
