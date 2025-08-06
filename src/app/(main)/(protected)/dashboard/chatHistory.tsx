"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

type Chat = {
  id: string;
  name: string;
  history: { role: string; text: string }[];
  createdAt: import("firebase/firestore").Timestamp | Date;
};

type Props = {
  chats: Chat[];
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editName: string;
  setEditName: (name: string) => void;
  loading: boolean;
  isLoadingChats: boolean; // New prop specifically for chat history loading
  handleNewChat: () => void;
  handleEditName: (chatId: string, newName: string) => void;
  handleDeleteChat: (chatId: string) => void;
};

export default function ChatHistory(props: Props) {
  const {
    chats,
    selectedChatId,
    setSelectedChatId,
    menuOpenId,
    setMenuOpenId,
    editingId,
    setEditingId,
    editName,
    setEditName,
    isLoadingChats,
    handleNewChat,
    handleEditName,
    handleDeleteChat,
  } = props;

  const [collapsed, setCollapsed] = useState(false);

  // Collapse sidebar on mobile/tablet
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <>
      {/* Toggle button for mobile/tablet, always visible on mobile */}
      {collapsed && (
        <button
          className="md:hidden fixed top-14 left-2 shadow-lg font-bold text-lg flex items-center justify-center cursor-pointer"
          onClick={() => setCollapsed(false)}
          aria-label="Open chat sidebar"
        >
          <span className="text-2xl">☰</span>
        </button>
      )}
      <aside
        className={`w-64 bg-gray-200 dark:bg-gray-900 border-r h-full p-4 flex flex-col transition-transform duration-300 z-20
          ${collapsed ? "-translate-x-full fixed top-0 left-0" : "translate-x-0 md:static"}`}
        style={{ boxShadow: collapsed ? "0 0 0 rgba(0,0,0,0)" : "2px 0 8px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ChatGMP</h2>
          {/* X button always visible on mobile/tablet when sidebar is open */}
          <button
            className="md:hidden ml-2 font-bold text-lg shadow-lg cursor-pointer"
            onClick={() => setCollapsed(true)}
            aria-label="Close chat sidebar"
            style={{ minWidth: 40 }}
          >
            ✕
          </button>
        </div>
        <button 
          className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer" 
          onClick={handleNewChat}
        >
          + New Chat
        </button>
        <ul className="flex-1 overflow-y-auto mb-4">
          {isLoadingChats ? ( // Changed from loading to isLoadingChats
            <li className="flex justify-center p-2">
              <Spinner size="sm" />
            </li>
          ) : (
            chats.map(chat => (
              <li
                key={chat.id}
                className={`mb-2 p-2 rounded cursor-pointer flex items-center justify-between group ${selectedChatId === chat.id ? "dark:bg-gray-700 bg-gray-300" : "bg-white dark:bg-gray-800"}`}
                onClick={() => { setSelectedChatId(chat.id); if (collapsed) setCollapsed(true); }}
                onMouseLeave={() => setMenuOpenId(null)}
              >
                {editingId === chat.id ? (
                  <input
                    className="flex-1 mr-2 rounded px-2 py-1 border"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => {
                      if (e.key === "Enter") { handleEditName(chat.id, editName); setEditingId(null); }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onBlur={() => { handleEditName(chat.id, editName); setEditingId(null); }}
                    autoFocus
                  />
                ) : (
                  <span className="flex-1 truncate">{chat.name}</span>
                )}
                <div className="relative flex items-center">
                  <button
                    className="ml-2 px-2 py-1 rounded bg-gray-200 dark:bg-gray-500 cursor-pointer"
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
                        onClick={e => { e.stopPropagation(); handleDeleteChat(chat.id); }}
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
    </>
  );


}