import { FormEvent, useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../api/chat";
import type { ChatLanguage, ChatSession } from "../types";
import MessageList from "./MessageList";
import SessionList from "./SessionList";

interface ChatWidgetProps {
  chat: ChatSession | null;
  chats: ChatSession[];
  activeChatId: string | null;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
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

const LANGUAGES: { value: ChatLanguage; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
  { value: "ar", label: "AR" },
];

export default function ChatWidget({
  chat,
  chats,
  activeChatId,
  onClose,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onEnsureChat,
  onAppendMessage,
}: ChatWidgetProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<ChatLanguage>("fr");
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const widgetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSuggestedAction(action: string) {
    void sendUserMessage(action);
  }

  async function sendUserMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const chatId = chat?.id ?? onEnsureChat();
    setInput("");
    setError(null);
    setLoading(true);
    onAppendMessage(chatId, { role: "user", content: trimmed });

    try {
      const data = await sendChatMessage(chatId, trimmed, language);
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
    } catch {
      setError("Impossible d'obtenir une réponse. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  async function submitMessage() {
    await sendUserMessage(input);
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

  function handleNewChat() {
    onNewChat();
    setSessionsOpen(false);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <section
      ref={widgetRef}
      className="chat-widget"
      role="dialog"
      aria-modal="true"
      aria-label="Dourbia Guide"
    >
      <header className="chat-widget-header">
        <img src="/dourbia-icon.png" alt="" className="chat-header-icon" />
        <div className="chat-widget-header-text">
          <h2>Dourbia Guide</h2>
          <p>Guide historique intelligent</p>
        </div>
        <button
          type="button"
          className="chat-widget-close"
          onClick={onClose}
          aria-label="Fermer le guide"
        >
          ×
        </button>
      </header>

      <div className="chat-widget-toolbar">
        <button type="button" className="chat-widget-new" onClick={handleNewChat}>
          + Nouveau chat
        </button>
        {chats.length > 0 && (
          <button
            type="button"
            className="chat-widget-sessions-toggle"
            onClick={() => setSessionsOpen((value) => !value)}
            aria-expanded={sessionsOpen}
            aria-label="Afficher les conversations"
          >
            {sessionsOpen ? "Masquer" : "Sessions"}
          </button>
        )}
      </div>

      <SessionList
        chats={chats}
        activeChatId={activeChatId}
        open={sessionsOpen}
        onSelect={(id) => {
          onSelectChat(id);
          setSessionsOpen(false);
        }}
        onDelete={onDeleteChat}
      />

      <MessageList
        chat={chat}
        loading={loading}
        error={error}
        onSuggestedAction={handleSuggestedAction}
      />

      <form className="composer chat-widget-composer" onSubmit={handleSubmit}>
        <div className="composer-lang" role="group" aria-label="Langue">
          {LANGUAGES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`lang-btn${language === item.value ? " active" : ""}`}
              onClick={() => setLanguage(item.value)}
              aria-pressed={language === item.value}
              aria-label={`Langue ${item.label}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="composer-box">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Demandez quelque chose sur Carthage…"
            rows={1}
            disabled={loading}
            aria-label="Votre message"
          />
          <button
            type="submit"
            className="composer-send"
            disabled={loading || !input.trim()}
            aria-label="Envoyer le message"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3.4 20.6 22 12 3.4 3.4l2.8 7.2L17 12l-10.8 1.4-2.8 7.2z"
              />
            </svg>
          </button>
        </div>
        <p className="composer-hint">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
      </form>
    </section>
  );
}
