"use client";

import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { auth, db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, query, orderBy, getDocs } from "firebase/firestore";
import { BusinessIdContext } from "@/components/business/business-id-provider";
import ChatHistory from "./chatHistory";

type Chat = {
  id: string;
  name: string;
  history: { role: string; text: string }[];
  createdAt: import("firebase/firestore").Timestamp | Date;
};

export default function ChatGMP() {
  const businessId = useContext(BusinessIdContext);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      if (!businessId) return;
      const chatsRef = collection(db, `businesses/${businessId}/chats`);
      const q = query(chatsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const chatList: Chat[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Chat, 'id'>) }));
      setChats(chatList);
      setSelectedChatId(chatList[0]?.id || null);
    };
    fetchChats();
  }, [businessId]);

  // Get the history for the selected chat (memoized to prevent unnecessary re-renders)
  const selectedChatHistory = useMemo(() => {
    return chats.find(c => c.id === selectedChatId)?.history || [];
  }, [chats, selectedChatId]);

  // Callback to update history for selected chat only
  const updateSelectedChatHistory = async (newHistory: { role: string; text: string }[]) => {
    if (!selectedChatId || !businessId) return;
    await updateDoc(doc(db, `businesses/${businessId}/chats/${selectedChatId}`), { history: newHistory });
    setChats(chats => chats.map(c => c.id === selectedChatId ? { ...c, history: newHistory } : c));
  };

  // Handlers for sidebar actions
  const handleNewChat = async () => {
    setLoading(true);
    const chatsRef = collection(db, `businesses/${businessId}/chats`);
    const newChat = {
      name: "New chat",
      history: [],
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(chatsRef, newChat);
    const newDocSnap = await getDoc(doc(db, `businesses/${businessId}/chats/${docRef.id}`));
    let newDocData: Chat;
    if (newDocSnap.exists()) {
      const data = newDocSnap.data();
      newDocData = {
        id: docRef.id,
        name: data.name ?? "New chat",
        history: data.history ?? [],
        createdAt: data.createdAt ?? new Date(),
      };
    } else {
      newDocData = { id: docRef.id, name: "New chat", history: [], createdAt: new Date() };
    }
    setChats((chats) => [newDocData, ...chats]);
    setSelectedChatId(docRef.id);
    setLoading(false);
  };

  const handleEditName = async (chatId: string, newName: string) => {
    await updateDoc(doc(db, `businesses/${businessId}/chats/${chatId}`), { name: newName });
    setChats((chats) => chats.map((c) => ({
      ...c,
      name: c.id === chatId ? newName : c.name,
    })));
  };

  const handleDeleteChat = async (chatId: string) => {
    await deleteDoc(doc(db, `businesses/${businessId}/chats/${chatId}`));
    setChats((prevChats) => {
      const filtered = prevChats.filter((c: Chat) => c.id !== chatId);
      if (selectedChatId === chatId && filtered.length > 0) {
        setSelectedChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  async function handleSend() {
    if (!userQuery.trim()) return;
    const newHistory = [...selectedChatHistory, { role: "user", text: userQuery }];
    await updateSelectedChatHistory(newHistory);
    setUserQuery("");
    setLoading(true);

    // Get Firebase ID token
    const user = auth.currentUser;
    if (!user) {
      await updateSelectedChatHistory([...selectedChatHistory, { role: "assistant", text: "You must be signed in to use chat." }]);
      setLoading(false);
      return;
    }
    const idToken = await user.getIdToken();

    const res = await fetch("/api/rag-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ query: userQuery })
    });

    const { answer, error } = await res.json();
    let updatedHistory;
    if (error) {
      updatedHistory = [...newHistory, { role: "assistant", text: error }];
    } else {
      updatedHistory = [...newHistory, { role: "assistant", text: answer }];
    }
    await updateSelectedChatHistory(updatedHistory);
    setUserQuery("");
    setLoading(false);
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedChatHistory, loading]);

  return (
    <div className="flex h-screen">
      <ChatHistory
        chats={chats}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        menuOpenId={menuOpenId}
        setMenuOpenId={setMenuOpenId}
        editingId={editingId}
        setEditingId={setEditingId}
        editName={editName}
        setEditName={setEditName}
        loading={loading}
        handleNewChat={handleNewChat}
        handleEditName={handleEditName}
        handleDeleteChat={handleDeleteChat}
      />
      <div className="flex-1 flex flex-col bg-white dark:bg-black">
        <div className="flex-1 overflow-y-auto p-6" ref={chatContainerRef}>
          {selectedChatHistory.map((m, i) => (
            <div key={i} className={`mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}>
              {m.role === "assistant" ? (
                <span className="inline-block px-3 py-2 rounded text-left max-w-full break-words">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </span>
              ) : (
                <span className="inline-block px-3 py-2 rounded dark:bg-gray-700 bg-gray-300">
                  {m.text}
                </span>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 left-0 w-full p-6 bg-white dark:bg-black border-t flex gap-2 z-10">
          <input
            type="text"
            className="flex-grow shadow dark:shadow-gray-300 rounded px-3 py-2"
            placeholder="Ask me about your reviews"
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
