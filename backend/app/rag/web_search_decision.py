from __future__ import annotations

import re
from typing import Any

from app.config import Settings
from app.rag.suggested_action_intent import all_suggested_action_phrases
from app.rag.text_utils import normalize_text

DOMAIN_KEYWORDS = (
    "carthage",
    "tunisie",
    "tunisien",
    "tunisienne",
    "patrimoine",
    "monument",
    "monuments",
    "site historique",
    "archéologie",
    "archeologie",
    "fouille",
    "fouilles",
    "tourisme",
    "culture",
    "circuit",
    "circuits",
    "musée",
    "musee",
    "byrsa",
    "tophet",
    "baal",
    "hammon",
    "tanit",
    "thermes",
    "amphitheatre",
    "amphithéâtre",
    "cothon",
    "punique",
    "romain",
    "romaine",
)

WEB_SEARCH_META_PHRASES = (
    "faites une recherche web",
    "faire une recherche web",
    "faite une recherche web",
    "fait une recherche web",
    "fais une recherche web",
    "fait une recherche web",
    "faire une recherche sur",
    "faite une recherche sur",
    "faites une recherche sur",
    "fais une recherche sur",
    "fait une recherche sur",
    "fais une recherche",
    "fait une recherche",
    "faire une recherche",
    "faite une recherche",
    "cherche en ligne",
    "chercher en ligne",
    "cherche sur le web",
    "chercher sur le web",
    "cherche sur web",
    "chercher sur web",
    "recherche en ligne",
    "recherche sur internet",
    "recherche internet",
    "une recherche web",
    "recherche web",
    "sur internet",
    "sur le web",
    "en ligne",
)

SUGGESTED_ACTION_PHRASES_TO_STRIP = all_suggested_action_phrases()

NEWS_OR_RECENT_HINTS = (
    "informations récentes",
    "informations recentes",
    "actualités",
    "actualites",
    "dernieres nouvelles",
    "dernières nouvelles",
)

EVENT_OR_SCHEDULE_HINTS = (
    "2024",
    "2025",
    "2026",
    "2027",
    "festival",
    "journees cinematographiques",
    "journées cinématographiques",
    "journee cinematographique",
    "journée cinématographique",
    "jcc",
    "cinema",
    "cinematographique",
    "cinématographique",
    "programme",
    "debut",
    "début",
    "dates",
    "calendrier",
)

HISTORICAL_FIGURE_MARKERS = (
    "baal",
    "hammon",
    "tanit",
    "didon",
    "hannibal",
    "hamilcar",
)

LOOKUP_INTENT_PREFIXES = (
    "chercher ",
    "cherche ",
    "trouver ",
    "retrouver ",
)

EXPLICIT_WEB_SEARCH_HINTS = WEB_SEARCH_META_PHRASES + NEWS_OR_RECENT_HINTS

BLOCKED_WEB_DOMAINS = (
    "pscp.tv",
    "periscope.tv",
    "twitter.com",
    "x.com",
    "facebook.com",
    "tiktok.com",
    "instagram.com",
    "atelierdeschefs.fr",
    "iletaitunefoislapatisserie.com",
    "lacuisinedemamere.fr",
    "marmiton.org",
)

BLOCKED_WEB_TITLE_MARKERS = (
    "periscope",
    "venez parler",
    "live stream",
    "livestream",
)

ART_CULTURE_QUERY_MARKERS = (
    "oeuvre",
    "oeuvres",
    "artistique",
    "artistiques",
    "sculpture",
    "peinture",
    "exposition",
    "salammbo",
    "salammbô",
    "salambo",
    "flaubert",
    "gussier",
    "gussiere",
    "bastien",
    "baston",
)

RECIPE_WEB_MARKERS = (
    "recette",
    "patisserie",
    "pâtisserie",
    "dessert",
    "glands",
    "cuisine",
    "chef",
)

CONVERSATIONAL_TOPIC_STOPWORDS = frozenset(
    {
        "parler",
        "parlez",
        "parle",
        "venez",
        "venir",
        "comprends",
        "comprend",
        "maintenant",
        "artistique",
        "artistiques",
        "oeuvre",
        "oeuvres",
        "liee",
        "liees",
        "lies",
        "question",
        "desole",
        "desolé",
    }
)

HISTORICAL_CONTENT_HINTS = (
    "siècle",
    "siecle",
    "époque",
    "epoque",
    "histoire",
    "historique",
    "fouille",
    "archéologie",
    "archeologie",
    "monument",
    "empire",
    "civilisation",
    "civilization",
    "daté",
    "date",
    "construit",
    "ruines",
    "site",
)

MIN_TOTAL_CHUNK_CHARS = 120
MIN_SINGLE_CHUNK_CHARS = 40

WEB_SEARCH_FILLER_TOKENS = frozenset(
    {
        "a",
        "au",
        "aux",
        "de",
        "des",
        "du",
        "en",
        "la",
        "le",
        "les",
        "sur",
        "un",
        "une",
        "donner",
        "donnez",
        "donne",
        "donnes",
        "faites",
        "faite",
        "fait",
        "presentez",
        "presente",
        "presenter",
        "montrez",
        "montrer",
        "moi",
        "svp",
        "stp",
    }
)

TOPIC_STOPWORDS = WEB_SEARCH_FILLER_TOKENS | {
    "carthage",
    "tunisie",
    "tunisia",
    "tunis",
    "recherche",
    "web",
    "ligne",
    "internet",
    "question",
    "informations",
    "information",
    "recentes",
    "recente",
    "actualites",
    "actualités",
}


NEWS_RESULT_MARKERS = (
    "2024",
    "2025",
    "2026",
    "2027",
    "news",
    "actualit",
    "recent",
    "aujourd",
    "ce mois",
    "this month",
    "annonce",
    "communique",
    "découverte",
    "decouverte",
    "excavation",
    "fouille",
)

ANCIENT_HISTORY_ONLY_MARKERS = (
    "fondee en",
    "fondée en",
    "founded",
    "814",
    "avant j-c",
    "avant jc",
    "before christ",
    "phoenician",
    "encyclopedia",
    "encyclopedie",
    "wikipedia",
    "britannica",
    "ancient city",
    "ancienne cite",
)


def _strip_web_meta_phrases(user_query: str) -> str:
    working = normalize_text(user_query)
    for hint in sorted(
        WEB_SEARCH_META_PHRASES + SUGGESTED_ACTION_PHRASES_TO_STRIP,
        key=len,
        reverse=True,
    ):
        hint_norm = normalize_text(hint)
        if hint_norm:
            working = working.replace(hint_norm, " ")
    return re.sub(r"\s+", " ", working).strip()


def _looks_like_recent_news_result(blob: str) -> bool:
    if any(marker in blob for marker in NEWS_RESULT_MARKERS):
        return True
    if any(marker in blob for marker in ANCIENT_HISTORY_ONLY_MARKERS):
        return False
    return False


def requests_news_or_recent(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    return any(hint in normalized for hint in NEWS_OR_RECENT_HINTS)


def requests_event_or_schedule(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    if "journ" in normalized and "cinematograph" in normalized:
        return True
    has_year = any(year in normalized for year in ("2024", "2025", "2026", "2027"))
    has_event = any(hint in normalized for hint in EVENT_OR_SCHEDULE_HINTS)
    return has_year and has_event


def user_requests_lookup(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    return any(normalized.startswith(prefix) for prefix in LOOKUP_INTENT_PREFIXES)


def is_historical_figure_query(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    return any(marker in normalized for marker in HISTORICAL_FIGURE_MARKERS)


def _requests_news_or_recent(user_query: str) -> bool:
    return requests_news_or_recent(user_query)


def _extract_topic_terms(user_query: str) -> tuple[str, ...]:
    working = _strip_web_meta_phrases(user_query)
    tokens = [token for token in working.split() if token and token not in TOPIC_STOPWORDS]
    return tuple(tokens[:6])


def _extract_subject_from_query(
    user_query: str,
    memory_context: dict[str, Any] | None = None,
) -> str:
    working = _strip_web_meta_phrases(user_query)
    match = re.search(
        r"\b(?:sur|du|de la|de l|des|d)\s+(.+)$",
        working,
        flags=re.IGNORECASE,
    )
    if match:
        subject = re.sub(r"\s+", " ", match.group(1)).strip()
        if subject:
            return subject

    context = memory_context or {}
    last_monuments = context.get("last_mentioned_monuments") or []
    if last_monuments:
        return normalize_text(str(last_monuments[0]))

    terms = _extract_topic_terms(user_query)
    return " ".join(terms)


def is_art_or_culture_query(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    return any(marker in normalized for marker in ART_CULTURE_QUERY_MARKERS)


def is_salammbo_query(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    return any(token in normalized for token in ("salamm", "salambo"))


def _is_blocked_web_url(url: str) -> bool:
    normalized = normalize_text(url)
    return any(domain in normalized for domain in BLOCKED_WEB_DOMAINS)


def _is_blocked_web_result(title: str, url: str, snippet: str) -> bool:
    if _is_blocked_web_url(url):
        return True
    blob = normalize_text(f"{title} {snippet}")
    return any(marker in blob for marker in BLOCKED_WEB_TITLE_MARKERS)


def _is_salammbo_related(text: str) -> bool:
    return "salamm" in text or "salambo" in text


def _term_matches_blob(term: str, blob: str) -> bool:
    if term in blob:
        return True
    if _is_salammbo_related(term) and _is_salammbo_related(blob):
        return True
    return False


def _focus_topic_terms(topic_terms: tuple[str, ...]) -> tuple[str, ...]:
    focused = tuple(
        term
        for term in topic_terms
        if term not in CONVERSATIONAL_TOPIC_STOPWORDS and len(term) > 3
    )
    if focused:
        return focused
    return tuple(term for term in topic_terms if len(term) > 3)


def _is_recipe_or_cooking_result(blob: str) -> bool:
    return any(marker in blob for marker in RECIPE_WEB_MARKERS)


def _build_salammbo_web_queries(user_query: str) -> list[str]:
    normalized = normalize_text(user_query)
    queries = [
        "Salammbo Flaubert Carthage roman",
        "Salammbo art Carthage Tunisie",
    ]
    if any(name in normalized for name in ("gussier", "gussiere", "bastien", "baston")):
        queries.insert(0, "Bastien Gussier artiste Salammbo")
    return queries


def _requires_strict_topic_match(topic_terms: tuple[str, ...]) -> bool:
    if not topic_terms:
        return False
    archaeology_markers = ("fouill", "archeolog", "excavat")
    return not all(
        any(marker in term for marker in archaeology_markers) for term in topic_terms
    )


def build_web_search_query(
    user_query: str,
    memory_context: dict[str, Any] | None = None,
) -> str:
    """Build a focused DuckDuckGo query by removing online-search meta phrasing."""
    context = memory_context or {}
    normalized_query = normalize_text(user_query)

    working = _strip_web_meta_phrases(user_query)
    tokens = working.split()
    while tokens and tokens[0] in WEB_SEARCH_FILLER_TOKENS:
        tokens.pop(0)
    working = " ".join(tokens).strip()

    if not working:
        working = _extract_subject_from_query(user_query, context) or normalized_query
    if "carthage" in normalized_query and (
        "fouill" in normalized_query or "archeolog" in normalized_query
    ):
        parts = ["fouilles archeologiques Carthage Tunisie"]
        if any(
            token in normalized_query
            for token in ("recent", "recente", "recentes", "actualite", "actualites")
        ):
            parts.append("actualites")
        return " ".join(parts)

    if is_salammbo_query(user_query):
        salammbo_queries = _build_salammbo_web_queries(user_query)
        return salammbo_queries[0]

    if requests_event_or_schedule(user_query):
        if "cinematograph" in normalized_query or "jcc" in normalized_query:
            return "Journees Cinematographiques Carthage 2026 dates"
        return f"{working or 'evenements Carthage'} Carthage Tunisie 2026"

    if _requests_news_or_recent(user_query):
        if "carthage" in normalized_query:
            return "Carthage Tunisie actualites recentes"
        subject = _extract_subject_from_query(user_query, context)
        if subject:
            return f"{subject} Carthage actualites recentes"

    if is_art_or_culture_query(user_query):
        subject = _extract_subject_from_query(user_query, context) or working
        if subject:
            return f"{subject} art Carthage Tunisie"

    parts = [working]
    last_monuments = context.get("last_mentioned_monuments") or []
    if last_monuments:
        monument = normalize_text(str(last_monuments[0]))
        if monument and monument not in working:
            parts.append(monument)

    return " ".join(part for part in parts if part).strip()


def build_web_search_queries(
    user_query: str,
    memory_context: dict[str, Any] | None = None,
) -> list[str]:
    """Return ordered DuckDuckGo queries, with optional English fallback."""
    queries: list[str] = []
    primary = build_web_search_query(user_query, memory_context)
    if primary:
        queries.append(primary)

    normalized_query = normalize_text(user_query)
    if "carthage" in normalized_query and (
        "fouill" in normalized_query or "archeolog" in normalized_query
    ):
        queries.append("Carthage archaeological excavation Tunisia")
        if any(
            token in normalized_query
            for token in ("recent", "recente", "recentes", "actualite", "actualites")
        ):
            queries.append("Carthage archaeology news excavation")

    normalized_query = normalize_text(user_query)
    if _requests_news_or_recent(user_query):
        queries.append("Carthage Tunisia archaeology news")
        queries.append("Carthage Tunisie actualites patrimoine")
    if is_salammbo_query(user_query):
        queries.extend(_build_salammbo_web_queries(user_query))
    if "tophet" in normalized_query:
        queries.append("Tophet Carthage Tunisia sanctuary")
    if user_requests_web_search(user_query) and "carthage" not in normalized_query:
        subject = _strip_web_meta_phrases(user_query)
        primary_key = normalize_text(primary)
        subject_key = normalize_text(subject)
        if (
            subject_key
            and subject_key != primary_key
            and subject_key not in primary_key
            and primary_key not in subject_key
        ):
            queries.append(subject)

    deduplicated: list[str] = []
    seen: set[str] = set()
    for query in queries:
        key = normalize_text(query)
        if not key or key in seen:
            continue
        seen.add(key)
        deduplicated.append(query)
    return deduplicated


def build_emergency_web_queries(user_query: str) -> list[str]:
    normalized_query = normalize_text(user_query)
    if "carthage" not in normalized_query:
        return []

    queries = [
        "Carthage Tunisia archaeology excavation news",
        "Carthage fouilles archeologiques actualites",
    ]
    if any(
        token in normalized_query
        for token in ("recent", "recente", "recentes", "actualite", "actualites")
    ):
        queries.insert(0, "Carthage archaeological discovery recent news")

    deduplicated: list[str] = []
    seen: set[str] = set()
    for query in queries:
        key = normalize_text(query)
        if key in seen:
            continue
        seen.add(key)
        deduplicated.append(query)
    return deduplicated


def region_for_web_query(query: str, default_region: str) -> str:
    normalized_query = normalize_text(query)
    english_markers = (
        "archaeological",
        "archaeology",
        "excavation",
        "discovery",
        "news",
        "recent",
    )
    if any(marker in normalized_query for marker in english_markers):
        return "wt-wt"
    return default_region


def _extract_web_relevance_anchors(query_norm: str) -> tuple[str, ...]:
    if "carthage" in query_norm:
        return ("carthage", "tunisie", "tunisia", "tunis")
    if any(token in query_norm for token in ("tunisie", "tunisien", "tunisienne")):
        return ("tunisie", "tunisia", "carthage", "tunis")
    if any(keyword in query_norm for keyword in DOMAIN_KEYWORDS):
        return ("carthage", "tunisie", "tunisia", "tunis")
    return ()


def _collect_topic_terms(
    user_query: str,
    memory_context: dict[str, Any] | None = None,
) -> tuple[str, ...]:
    terms: list[str] = list(_extract_topic_terms(user_query))
    subject = _extract_subject_from_query(user_query, memory_context)
    if subject:
        terms.extend(token for token in subject.split() if token not in TOPIC_STOPWORDS)

    context = memory_context or {}
    for monument in context.get("last_mentioned_monuments") or []:
        terms.extend(
            token
            for token in normalize_text(str(monument)).split()
            if token not in TOPIC_STOPWORDS
        )

    deduplicated: list[str] = []
    seen: set[str] = set()
    for term in terms:
        if not term or term in seen:
            continue
        seen.add(term)
        deduplicated.append(term)
    return tuple(deduplicated[:8])


def filter_relevant_web_results(
    results: list[Any],
    user_query: str,
    memory_context: dict[str, Any] | None = None,
) -> list[Any]:
    """Keep only web results that mention Carthage/Tunisia and the requested topic."""
    if not results:
        return []

    normalized_query = normalize_text(user_query)
    explicit_request = user_requests_web_search(user_query)
    anchors = _extract_web_relevance_anchors(normalized_query)
    topic_terms = _focus_topic_terms(_collect_topic_terms(user_query, memory_context))
    art_query = is_art_or_culture_query(user_query)
    filtered: list[Any] = []
    for result in results:
        title = getattr(result, "title", "") or ""
        snippet = getattr(result, "snippet", "") or ""
        url = getattr(result, "url", "") or ""
        if _is_blocked_web_result(title, url, snippet):
            continue

        blob = normalize_text(f"{title} {snippet} {url}")
        if art_query and _is_recipe_or_cooking_result(blob):
            continue
        if anchors:
            if not any(anchor in blob for anchor in anchors):
                continue
        elif not explicit_request and not art_query:
            continue
        if (
            _requires_strict_topic_match(topic_terms)
            and not _requests_news_or_recent(user_query)
            and not any(_term_matches_blob(term, blob) for term in topic_terms)
        ):
            continue
        if _requests_news_or_recent(user_query) and not _looks_like_recent_news_result(
            blob
        ):
            continue
        filtered.append(result)
    return filtered


LOCAL_TOPIC_HINTS = (
    "fouill",
    "excavation",
    "chantier",
    "decouverte",
    "découverte",
    "recent",
    "recente",
    "actualite",
    "actualités",
)


def local_chunks_relevant_to_query(
    user_query: str,
    retrieved_chunks: list[dict[str, Any]],
) -> bool:
    query_norm = normalize_text(user_query)
    if not retrieved_chunks:
        return False

    query_terms = tuple(
        term
        for term in _collect_topic_terms(user_query, None)
        if len(term) > 3 and term not in {"circuit", "circuits", "romain", "romaine"}
    )
    if query_terms:
        for chunk in retrieved_chunks:
            blob = normalize_text(
                f"{chunk.get('title', '')} {chunk.get('chunk_text', '')}"
            )
            if any(term in blob for term in query_terms):
                return True
        return False

    asks_specific_topic = any(hint in query_norm for hint in LOCAL_TOPIC_HINTS)
    if not asks_specific_topic:
        return True

    for chunk in retrieved_chunks:
        blob = normalize_text(
            f"{chunk.get('title', '')} {chunk.get('chunk_text', '')}"
        )
        if any(hint in blob for hint in LOCAL_TOPIC_HINTS):
            return True
    return False


def user_requests_web_search(user_query: str) -> bool:
    normalized = normalize_text(user_query)
    return any(hint in normalized for hint in WEB_SEARCH_META_PHRASES) or any(
        hint in normalized for hint in NEWS_OR_RECENT_HINTS
    )


def is_domain_related_query(
    user_query: str,
    memory_context: dict[str, Any] | None = None,
) -> bool:
    context = memory_context or {}
    parts = [user_query]
    parts.extend(str(item) for item in (context.get("last_mentioned_monuments") or []))
    parts.extend(str(item) for item in (context.get("interests") or []))
    if context.get("primary_site_name"):
        parts.append(str(context["primary_site_name"]))

    normalized_blob = normalize_text(" ".join(parts))
    return any(keyword in normalized_blob for keyword in DOMAIN_KEYWORDS)


def _chunks_are_too_short(retrieved_chunks: list[dict[str, Any]]) -> bool:
    if not retrieved_chunks:
        return True

    total_chars = sum(len(str(chunk.get("chunk_text") or "")) for chunk in retrieved_chunks)
    if total_chars < MIN_TOTAL_CHUNK_CHARS:
        return True

    return any(
        len(str(chunk.get("chunk_text") or "")) < MIN_SINGLE_CHUNK_CHARS
        for chunk in retrieved_chunks
    )


def _chunks_have_weak_descriptive_content(retrieved_chunks: list[dict[str, Any]]) -> bool:
    if not retrieved_chunks:
        return True

    for chunk in retrieved_chunks:
        normalized_text = normalize_text(str(chunk.get("chunk_text") or ""))
        if not normalized_text:
            return True
        if any(hint in normalized_text for hint in HISTORICAL_CONTENT_HINTS):
            return False
    return True


def is_local_context_insufficient(
    retrieved_chunks: list[dict[str, Any]],
    best_score: float | None,
    *,
    min_relevance_score: float,
) -> bool:
    if not retrieved_chunks:
        return True
    if best_score is None or best_score < min_relevance_score:
        return True
    if _chunks_are_too_short(retrieved_chunks):
        return True
    if _chunks_have_weak_descriptive_content(retrieved_chunks):
        return True
    return False


def should_use_web_search(
    user_query: str,
    retrieved_chunks: list[dict[str, Any]],
    best_score: float | None,
    memory_context: dict[str, Any],
    *,
    settings: Settings,
) -> bool:
    explicit_request = user_requests_web_search(user_query)
    if explicit_request:
        return True

    if not is_domain_related_query(user_query, memory_context):
        return False

    if not settings.web_search_enabled:
        return False

    if is_art_or_culture_query(user_query) and not local_chunks_relevant_to_query(
        user_query, retrieved_chunks
    ):
        return True

    if is_historical_figure_query(user_query) and not local_chunks_relevant_to_query(
        user_query, retrieved_chunks
    ):
        return True

    if requests_event_or_schedule(user_query) or (
        user_requests_lookup(user_query) and is_domain_related_query(user_query, memory_context)
    ):
        return True

    insufficient = is_local_context_insufficient(
        retrieved_chunks,
        best_score,
        min_relevance_score=settings.rag_min_score,
    )
    return insufficient
