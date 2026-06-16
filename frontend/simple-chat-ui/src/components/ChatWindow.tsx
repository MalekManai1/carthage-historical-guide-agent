import { FormEvent, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/chat";
import type { ChatSession } from "../types";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  chat: ChatSession | null;
  onEnsureChat: () => string;
  onAppendMessage: (
    chatId: string,
    message: {
      role: "user" | "assistant";
      content: string;
      sources?: ChatSession["messages"][number]["sources"];
      memory?: ChatSession["messages"][number]["memory"];
      actions?: string[];
      elapsedMs?: number;
      latencyMs?: number;
      latencyDebug?: ChatSession["messages"][number]["latencyDebug"];
    },
  ) => void;
}

export default function ChatWindow({
  chat,
  onEnsureChat,
  onAppendMessage,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    const nearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (nearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat?.messages.length, loading]);

  function handleSuggestedAction(action: string) {
    setInput(action);
    inputRef.current?.focus();
  }

  function handleExampleClick(example: string) {
    setInput(example);
    inputRef.current?.focus();
  }

  async function submitMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const chatId = chat?.id ?? onEnsureChat();
    setInput("");
    setError(null);
    setLoading(true);
    onAppendMessage(chatId, { role: "user", content: trimmed });

    try {
      const data = await sendChatMessage(chatId, trimmed);
      onAppendMessage(chatId, {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        memory: data.memory_context,
        actions: data.suggested_actions,
        elapsedMs: data.clientElapsedMs,
        latencyMs: data.latency_ms ?? undefined,
        latencyDebug: data.latency_debug ?? undefined,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Erreur inconnue";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitMessage();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage();
    }
  }

  return (
    <section className="chat-window">
      <header className="chat-window-header">
        <h1>{chat?.title ?? "Guide Historique — Carthage"}</h1>
        <p>Posez vos questions sur les monuments, circuits et l'histoire de Carthage.</p>
      </header>

      <main className="messages" ref={messagesRef}>
        {!chat || chat.messages.length === 0 ? (
          <div className="welcome">
            <h2>Bienvenue</h2>
            <p>Exemples de questions :</p>
            <ul>
              {[
                "Explique-moi les Thermes d'Antonin.",
                "Propose un circuit romain à Carthage.",
                "J'ai 1h30, que peux-tu me conseiller ?",
              ].map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    className="example-btn"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          chat.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestedActionClick={handleSuggestedAction}
            />
          ))
        )}
        {loading && (
          <div className="message-row assistant loading-row">
            <div className="message-avatar">Guide</div>
            <div className="message-body">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {error && <p className="error-banner">{error}</p>}

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer-box">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envoyer un message…"
            rows={1}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            ↑
          </button>
        </div>
        <p className="composer-hint">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </form>
    </section>
  );
}
