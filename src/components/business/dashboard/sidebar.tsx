import React, { useState } from "react";

type Chat = {
  id: string;
  name: string;
  history: { role: string; text: string }[];
  createdAt: import("firebase/firestore").Timestamp | Date;
};

export default function Sidebar({
  chats,
  selectedChatId,
  setSelectedChatId,
  onNewChat,
  onEditName,
  onDeleteChat,
  loading,
}: {
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChatId: string | null;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string | null>>;
  onNewChat: () => void;
  onEditName: (chatId: string, newName: string) => void;
  onDeleteChat: (chatId: string) => void;
  loading: boolean;
}) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <aside className="w-64 bg-gray-200 dark:bg-gray-900 border-r h-screen p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Chats</h2>
      <button className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer" 
              onClick={onNewChat}>+ New Chat</button>
      <ul className="flex-1 overflow-y-auto mb-4">
        {loading ? (
          <li>Loading...</li>
        ) : (
          chats.map(chat => (
            <li
              key={chat.id}
              className={`mb-2 p-2 rounded cursor-pointer flex items-center justify-between group ${selectedChatId === chat.id ? "dark:bg-gray-700 bg-gray-300" : "bg-white dark:bg-gray-800"}`}
              onClick={() => setSelectedChatId(chat.id)}
              onMouseLeave={() => setMenuOpenId(null)}
            >
              {editingId === chat.id ? (
                <input
                  className="flex-1 mr-2 rounded px-2 py-1 border"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => {
                    if (e.key === "Enter") { onEditName(chat.id, editName); setEditingId(null); }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate">{chat.name}</span>
              )}
              <div className="relative flex items-center">
                <button
                  className="opacity-0 group-hover:opacity-100 ml-2 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={e => { e.stopPropagation(); setMenuOpenId(chat.id === menuOpenId ? null : chat.id); }}
                >
                  ...
                </button>
                {menuOpenId === chat.id && (
                  <div className="absolute right-0 top-6 z-10 bg-white dark:bg-gray-800 border rounded shadow p-2 flex flex-col min-w-[120px]">
                    <button
                      className="text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      onClick={e => { e.stopPropagation(); setEditingId(chat.id); setEditName(chat.name); setMenuOpenId(null); }}
                    >
                      Edit name
                    </button>
                    <button
                      className="text-left px-2 py-1 hover:bg-red-100 dark:hover:bg-red-700 rounded text-red-600 dark:text-red-300"
                      onClick={e => { e.stopPropagation(); onDeleteChat(chat.id); }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
} 