from __future__ import annotations

from app.config import Settings
from app.rag.web_search_decision import (
    build_web_search_queries,
    build_web_search_query,
    filter_relevant_web_results,
    is_domain_related_query,
    local_chunks_relevant_to_query,
    requests_event_or_schedule,
    should_use_web_search,
    user_requests_web_search,
)
from app.tools.web_search_tool import WebSearchResult


def _settings(*, enabled: bool = True) -> Settings:
    return Settings(web_search_enabled=enabled, rag_min_score=0.65)


def test_should_use_web_search_when_local_context_insufficient_and_enabled() -> None:
    chunks = [
        {
            "chunk_text": "court",
            "score": 0.10,
        }
    ]
    assert should_use_web_search(
        "Donne-moi plus de détails historiques sur Byrsa",
        chunks,
        0.10,
        {},
        settings=_settings(enabled=True),
    )


def test_should_not_use_web_search_when_disabled() -> None:
    chunks = [{"chunk_text": "court", "score": 0.10}]
    assert not should_use_web_search(
        "Donne-moi plus de détails historiques sur Byrsa",
        chunks,
        0.10,
        {},
        settings=_settings(enabled=False),
    )


def test_should_use_web_search_for_explicit_request_even_when_off_domain() -> None:
    chunks = [{"chunk_text": "court", "score": 0.91}]
    assert should_use_web_search(
        "parler moi de l'oeuvre salammbo de baston gussiere (fais une recherche)",
        chunks,
        0.91,
        {},
        settings=_settings(enabled=False),
    )


def test_user_requests_web_search_detects_fais_une_recherche() -> None:
    assert user_requests_web_search(
        "parler moi de salammbo (fais une recherche)"
    )
    assert user_requests_web_search("recherche internet sur le tophet")


def test_build_web_search_query_for_carthage_news() -> None:
    query = build_web_search_query("les actualités de carthage ce mois")
    assert "carthage" in query.lower()
    assert "actualites" in query.lower()


def test_filter_relevant_web_results_blocks_periscope_even_when_query_contains_parler() -> None:
    results = [
        WebSearchResult(
            title="Maelle: Venez parler",
            url="https://www.pscp.tv/maelle1000/1MnxnvMlMBExO",
            snippet="Rejoignez le live Periscope.",
        )
    ]
    filtered = filter_relevant_web_results(
        results,
        "parler moi de l'oeuvre artistique salammbo de baston gussiere (fais une recherche)",
    )
    assert filtered == []


def test_filter_relevant_web_results_blocks_pastry_results_for_salammbo_art_query() -> None:
    results = [
        WebSearchResult(
            title="Recette Le salambô - L'atelier des Chefs",
            url="https://www.atelierdeschefs.fr/recettes/32632/le-salambo/",
            snippet="Un dessert traditionnel.",
        ),
        WebSearchResult(
            title="Salammbô — Wikipédia",
            url="https://fr.wikipedia.org/wiki/Salammbô",
            snippet="Salammbô est un roman historique de Gustave Flaubert sur Carthage.",
        ),
    ]
    filtered = filter_relevant_web_results(
        results,
        "fais une recherche sur salambo",
    )
    assert len(filtered) == 1
    assert "Wikipédia" in (filtered[0].title or "")


def test_requests_event_or_schedule_detects_jcc_2026_query() -> None:
    query = (
        "chercher le debut des journées cinématographiques de carthage en 2026"
    )
    assert requests_event_or_schedule(query)


def test_should_use_web_search_for_event_schedule_query() -> None:
    assert should_use_web_search(
        "chercher le debut des journées cinématographiques de carthage en 2026",
        retrieved_chunks=[
            {
                "title": "Circuit Carthage_pédestre",
                "score": 0.69,
                "chunk_text": "Circuit touristique à Carthage.",
            }
        ],
        best_score=0.69,
        memory_context={"preferred_language": "fr"},
        settings=_settings(enabled=True),
    )


def test_build_web_search_query_for_jcc_2026() -> None:
    query = build_web_search_query(
        "chercher le debut des journées cinématographiques de carthage en 2026"
    )
    assert "cinematograph" in query.lower() or "journee" in query.lower()


def test_build_web_search_query_for_salammbo_art_request() -> None:
    query = build_web_search_query(
        "parler moi de l'oeuvre artistique salammbo de baston gussiere",
    )
    assert "salammbo" in query.lower() or "flaubert" in query.lower()


def test_filter_relevant_web_results_rejects_encyclopedia_history_for_news_query() -> None:
    results = [
        WebSearchResult(
            title="Carthage | History, Location, & Facts | Britannica",
            url="https://www.britannica.com/place/Carthage-ancient-city-Tunisia",
            snippet="Carthage was founded by Phoenicians from Tyre in the 9th century BCE.",
        ),
        WebSearchResult(
            title="New excavation announced at Carthage archaeological site in 2025",
            url="https://example.com/carthage-news",
            snippet="Archaeologists announced a recent discovery at Carthage in 2025.",
        ),
    ]
    filtered = filter_relevant_web_results(
        results,
        "les actualités de carthage ce mois",
    )
    assert len(filtered) == 1
    assert "2025" in (filtered[0].snippet or "")


def test_should_use_web_search_for_explicit_request_when_disabled() -> None:
    chunks = [{"chunk_text": "court", "score": 0.91}]
    assert should_use_web_search(
        "Chercher sur le web les fouilles à Carthage",
        chunks,
        0.91,
        {},
        settings=_settings(enabled=False),
    )


def test_should_not_use_web_search_for_unrelated_query() -> None:
    chunks = [{"chunk_text": "court", "score": 0.10}]
    assert not should_use_web_search(
        "Donne-moi une recette de pizza",
        chunks,
        0.10,
        {},
        settings=_settings(enabled=True),
    )


def test_should_use_web_search_for_explicit_online_request() -> None:
    chunks = [
        {
            "chunk_text": (
                "Les Thermes d'Antonin sont un grand complexe thermal romain "
                "situé à Carthage, datant du IIe siècle."
            ),
            "score": 0.91,
        }
    ]
    assert should_use_web_search(
        "Cherche en ligne des informations sur les Thermes d'Antonin",
        chunks,
        0.91,
        {},
        settings=_settings(enabled=True),
    )


def test_user_requests_web_search_detects_french_phrases() -> None:
    assert user_requests_web_search("Recherche sur internet l'histoire du Tophet")
    assert user_requests_web_search("Donne-moi une recherche web sur le port punique")
    assert user_requests_web_search("Faire une recherche web sur ça")
    assert user_requests_web_search("Chercher sur le web les fouillons")
    assert user_requests_web_search("chercher sur web La Nécropole punique")
    assert user_requests_web_search("Faite une recherche sur le port punique de carthage")
    assert user_requests_web_search("faites une recherche web sur le tophet de carthage")
    assert user_requests_web_search("donner les actualités sur le musée oceanographique")
    assert not user_requests_web_search("Explique-moi les Thermes d'Antonin")


def test_is_domain_related_query_uses_memory_context() -> None:
    assert is_domain_related_query(
        "Et les horaires ?",
        {"last_mentioned_monuments": ["Thermes d'Antonin"]},
    )


def test_build_web_search_query_strips_online_search_phrases() -> None:
    query = build_web_search_query(
        "Recherche sur internet des informations récentes sur les fouilles archéologiques à Carthage"
    )
    assert "recherche sur internet" not in query
    assert "fouilles" in query.lower()
    assert "carthage" in query.lower()


def test_build_web_search_query_strips_recherche_web_phrases() -> None:
    query = build_web_search_query("Donne-moi une recherche web sur le port punique")
    assert "recherche web" not in query
    assert "port" in query or "punique" in query
    queries = build_web_search_queries(
        "Recherche sur internet des informations récentes sur les fouilles à Carthage"
    )
    assert any("Carthage archaeological excavation Tunisia" in query for query in queries)


def test_build_web_search_query_for_news_request_uses_monument_subject() -> None:
    query = build_web_search_query(
        "donner les actualités sur le musée oceanographique",
        {"last_mentioned_monuments": ["Musee Oceanographique (Dar El Hout)"]},
    )
    assert "oceanographique" in query.lower()
    assert "carthage" in query.lower()
    assert "actualites" in query.lower()


def test_filter_relevant_web_results_blocks_social_media() -> None:
    results = [
        WebSearchResult(
            title="Donner des défis",
            url="https://www.pscp.tv/example/1",
            snippet="Periscope stream",
        ),
        WebSearchResult(
            title="Carthage — Wikipédia",
            url="https://fr.wikipedia.org/wiki/Carthage",
            snippet="Carthage est une ancienne cité punique en Tunisie.",
        ),
    ]
    filtered = filter_relevant_web_results(
        results,
        "donner les actualités sur le musée oceanographique à Carthage",
    )
    assert len(filtered) == 0


def test_filter_relevant_web_results_requires_topic_term_when_specific() -> None:
    results = [
        WebSearchResult(
            title="Carthage - Wikipedia",
            url="https://en.wikipedia.org/wiki/Carthage",
            snippet="Carthage was an ancient city in Tunisia.",
        ),
        WebSearchResult(
            title="Tophet of Carthage",
            url="https://example.com/tophet",
            snippet="The Tophet of Carthage was a sanctuary.",
        ),
    ]
    filtered = filter_relevant_web_results(
        results,
        "faites une recherche web sur le tophet de carthage",
    )
    assert len(filtered) == 1
    assert "Tophet" in filtered[0].title


def test_filter_relevant_web_results_removes_unrelated_french_pages() -> None:
    results = [
        WebSearchResult(
            title="Fouille — Wikipédia",
            url="https://fr.wikipedia.org/wiki/Fouille",
            snippet="En France, on distingue deux catégories de fouilles archéologiques.",
        ),
        WebSearchResult(
            title="Carthage — Wikipédia",
            url="https://fr.wikipedia.org/wiki/Carthage",
            snippet="Carthage est une ancienne cité punique en Tunisie.",
        ),
    ]
    filtered = filter_relevant_web_results(
        results,
        "Recherche sur internet des fouilles archéologiques à Carthage",
    )
    assert len(filtered) == 1
    assert filtered[0].title.startswith("Carthage")


def test_local_chunks_relevant_to_query_detects_missing_excavation_info() -> None:
    chunks = [
        {
            "title": "Temple",
            "chunk_text": "Monument romain avec horaires et tarifs.",
        }
    ]
    assert not local_chunks_relevant_to_query(
        "Recherche sur internet des fouilles récentes à Carthage",
        chunks,
    )
