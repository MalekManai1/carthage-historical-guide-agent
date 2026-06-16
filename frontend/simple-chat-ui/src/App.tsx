import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import { useChats } from "./hooks/useChats";
import "./App.css";

export default function App() {
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

  return (
    <div className="layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={startNewChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
      />
      <ChatWindow
        chat={activeChat}
        onEnsureChat={ensureActiveChat}
        onAppendMessage={appendMessage}
      />
    </div>
  );
}
