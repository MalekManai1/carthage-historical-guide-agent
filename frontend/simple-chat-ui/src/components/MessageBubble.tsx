import { useState } from "react";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  onSuggestedActionClick?: (text: string) => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatLatencyStep(value: number | null | undefined): string {
  if (value == null) {
    return "n/a";
  }
  return formatDuration(value);
}

function formatSourceMeta(source: NonNullable<Message["sources"]>[number]): string {
  if (source.source_type === "web") {
    return "web";
  }
  if (source.score != null) {
    return `${source.source_type} · score ${source.score.toFixed(2)}`;
  }
  return source.source_type;
}

export default function MessageBubble({
  message,
  onSuggestedActionClick,
}: MessageBubbleProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isUser = message.role === "user";
  const hasSources = Boolean(message.sources && message.sources.length > 0);
  const hasMemory = Boolean(message.memory);
  const hasLatencyDebug = Boolean(message.latencyDebug);
  const showDetailsToggle = !isUser && (hasSources || hasMemory || hasLatencyDebug);
  const responseTimeMs = message.latencyMs ?? message.elapsedMs;

  return (
    <article className={`message-row ${isUser ? "user" : "assistant"}`}>
      <div className="message-avatar">{isUser ? "Vous" : "Guide"}</div>
      <div className="message-body">
        <div className="message-content">
          {message.content.split("\n").map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>

        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="message-actions">
            {message.actions.map((action) => (
              <button
                key={action}
                type="button"
                className="action-chip"
                onClick={() => onSuggestedActionClick?.(action)}
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {!isUser && responseTimeMs != null && (
          <p className="message-timing">
            Répondu en {formatDuration(responseTimeMs)}
            {message.elapsedMs != null &&
              message.latencyMs != null &&
              message.elapsedMs > message.latencyMs + 200 && (
                <span className="message-timing-detail">
                  {" "}
                  (total navigateur {formatDuration(message.elapsedMs)})
                </span>
              )}
          </p>
        )}

        {showDetailsToggle && (
          <div className="message-details">
            <button
              type="button"
              className="details-toggle"
              onClick={() => setShowDetails((value) => !value)}
            >
              {showDetails ? "Masquer sources & mémoire" : "Sources & mémoire"}
            </button>
            {showDetails && (
              <div className="details-panel">
                {hasSources && (
                  <section>
                    <h4>Sources</h4>
                    <ul className="source-list">
                      {message.sources!.map((source, index) => (
                        <li key={`${source.source_type}-${source.title ?? index}`}>
                          <strong>{source.title ?? "Sans titre"}</strong>
                          <span>{formatSourceMeta(source)}</span>
                          {source.source_type === "web" && source.url && (
                            <a
                              className="source-link"
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {source.url}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {hasLatencyDebug && (
                  <section
                    className={
                      hasSources || hasMemory ? "details-section-spaced" : undefined
                    }
                  >
                    <h4>Latence (debug)</h4>
                    <dl className="memory-grid latency-grid">
                      <dt>Mémoire (lecture)</dt>
                      <dd>
                        {formatLatencyStep(message.latencyDebug!.memory_retrieval_ms)}
                      </dd>
                      <dt>Retrieval</dt>
                      <dd>{formatLatencyStep(message.latencyDebug!.retrieval_ms)}</dd>
                      <dt>Prompt</dt>
                      <dd>
                        {formatLatencyStep(message.latencyDebug!.prompt_construction_ms)}
                      </dd>
                      <dt>LLM</dt>
                      <dd>
                        {formatLatencyStep(message.latencyDebug!.llm_generation_ms)}
                      </dd>
                      <dt>Mémoire (écriture)</dt>
                      <dd>
                        {formatLatencyStep(message.latencyDebug!.memory_update_ms)}
                      </dd>
                      <dt>Web search</dt>
                      <dd>{formatLatencyStep(message.latencyDebug!.web_search_ms)}</dd>
                    </dl>
                  </section>
                )}
                {hasMemory && (
                  <section
                    className={
                      hasSources || hasLatencyDebug ? "details-section-spaced" : undefined
                    }
                  >
                    <h4>Mémoire de session</h4>
                    <dl className="memory-grid">
                      <dt>Langue</dt>
                      <dd>{message.memory!.preferred_language}</dd>
                      {message.memory!.interests.length > 0 && (
                        <>
                          <dt>Intérêts</dt>
                          <dd>{message.memory!.interests.join(", ")}</dd>
                        </>
                      )}
                      {message.memory!.available_time_minutes != null && (
                        <>
                          <dt>Temps disponible</dt>
                          <dd>{message.memory!.available_time_minutes} min</dd>
                        </>
                      )}
                      {message.memory!.mobility_mode && (
                        <>
                          <dt>Mobilité</dt>
                          <dd>{message.memory!.mobility_mode}</dd>
                        </>
                      )}
                      {message.memory!.last_mentioned_monuments.length > 0 && (
                        <>
                          <dt>Monuments cités</dt>
                          <dd>{message.memory!.last_mentioned_monuments.join(", ")}</dd>
                        </>
                      )}
                    </dl>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
