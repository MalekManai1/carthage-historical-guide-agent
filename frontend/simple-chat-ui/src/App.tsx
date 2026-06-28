import { useState } from "react";
import ChatLauncher from "./components/ChatLauncher";
import ChatWidget from "./components/ChatWidget";
import SitePages from "./components/SitePages";
import TopNav from "./components/TopNav";
import type { SiteView } from "./content/siteContent";
import { SITE_CONTACT } from "./content/siteContent";
import { useChats } from "./hooks/useChats";
import "./App.css";

export default function App() {
  const [activeView, setActiveView] = useState<SiteView>("home");
  const [widgetOpen, setWidgetOpen] = useState(false);
  const {
    chats,
    activeChat,
    activeChatId,
    startNewChat,
    selectChat,
    deleteChat,
    appendMessage,
    ensureActiveChat,
  } = useChats();

  function handleNewChat() {
    startNewChat();
    setWidgetOpen(true);
    setActiveView("home");
  }

  function handleOpenChat() {
    setWidgetOpen(true);
  }

  function handleScrollToFeatures() {
    if (activeView !== "home" && activeView !== "tours") {
      setActiveView("home");
      window.setTimeout(() => {
        document.getElementById("agent-capabilities")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return;
    }
    document.getElementById("agent-capabilities")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="app-shell">
      <TopNav
        activeView={activeView}
        onNavigate={setActiveView}
        onNewChat={handleNewChat}
      />
      <div className="main-stage">
        <SitePages
          view={activeView}
          onOpenChat={handleOpenChat}
          onScrollToFeatures={handleScrollToFeatures}
        />
      </div>
      <footer className="site-footer">
        <img src="/dourbia-icon.png" alt="" className="footer-icon" />
        <span>
          © Dourbia — {SITE_CONTACT.taglineFr} ·{" "}
          <a href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
        </span>
      </footer>

      <ChatLauncher open={widgetOpen} onToggle={handleOpenChat} />
      {widgetOpen && (
        <ChatWidget
          chat={activeChat}
          chats={chats}
          activeChatId={activeChatId}
          onClose={() => setWidgetOpen(false)}
          onNewChat={startNewChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onEnsureChat={ensureActiveChat}
          onAppendMessage={appendMessage}
        />
      )}
    </div>
  );
}
