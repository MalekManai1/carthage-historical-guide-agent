import type { ChatSession } from "../types";

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-icon">🏛️</span>
          <div>
            <strong>Guide Carthage</strong>
            <span className="brand-sub">Agent historique RAG</span>
          </div>
        </div>
        <button type="button" className="new-chat-btn" onClick={onNewChat}>
          + Nouvelle conversation
        </button>
      </div>

      <div className="chat-list">
        {chats.length === 0 && (
          <p className="chat-list-empty">Aucune conversation pour l'instant.</p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
          >
            <button
              type="button"
              className="chat-item-main"
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="chat-item-title">{chat.title}</span>
              <span className="chat-item-date">{formatDate(chat.updatedAt)}</span>
            </button>
            <button
              type="button"
              className="chat-item-delete"
              title="Supprimer"
              onClick={() => onDeleteChat(chat.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
