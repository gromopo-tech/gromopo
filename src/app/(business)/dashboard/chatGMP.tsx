"use client";

import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { auth, db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, query, orderBy, getDocs } from "firebase/firestore";
import { BusinessIdContext } from "@/components/business/business-id-provider";
import ChatHistory from "./chatHistory";
import { Spinner } from "@/components/ui/spinner";

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
  const [isLoadingChats, setIsLoadingChats] = useState(false); // New state for tracking chat history loading
  const [userQuery, setUserQuery] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      if (!businessId) return;
      
      setIsLoadingChats(true); // Set loading state for chat history
      try {
        const chatsRef = collection(db, `businesses/${businessId}/chats`);
        const q = query(chatsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const chatDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[];
        
        setChats(chatDocs);
        
        // Only set selected chat if none is selected
        if (chatDocs.length > 0 && !selectedChatId) {
          setSelectedChatId(chatDocs[0].id);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoadingChats(false); // Clear loading state
      }
    };
    
    fetchChats();
  }, [businessId]); // Remove selectedChatId from dependencies

  // Cleanup event source on unmount
  useEffect(() => {
    // Store the current eventSource in a variable to avoid stale references in cleanup
    const eventSource = eventSourceRef.current;
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

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

  // Handle streaming response
  const handleStreamingResponse = async (query: string) => {
    if (!userQuery.trim()) return;
    
    // Add user message to history immediately
    const newHistory = [...selectedChatHistory, { role: "user", text: query }];
    await updateSelectedChatHistory(newHistory);
    setUserQuery("");
    
    // Show loading state and prepare for streaming
    setLoading(true);
    setIsStreaming(true);
    setStreamingAnswer("");
    
    // Get Firebase ID token
    const user = auth.currentUser;
    if (!user) {
      await updateSelectedChatHistory([...newHistory, { role: "assistant", text: "You must be signed in to use chat." }]);
      setLoading(false);
      setIsStreaming(false);
      return;
    }
    
    const idToken = await user.getIdToken();
    
    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    let tempAnswer = "";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let parsed_filter: Record<string, unknown> = {};
    
    try {
      const response = await fetch('/api/rag-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ query, streaming: true })
      });
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';
        
        for (const message of messages) {
          if (message.startsWith('data: ')) {
            try {
              const jsonStr = message.slice(6);
              const data = JSON.parse(jsonStr);
              
              if (data.type === 'metadata' && data.data) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                parsed_filter = data.data.parsed_filter || {};
              }
              else if (data.type === 'token' && data.text) {
                setLoading(false);
                tempAnswer += data.text;
                setStreamingAnswer(tempAnswer); // Only update UI state, not Firestore
              }
              else if (data.type === 'answer' && data.text) {
                tempAnswer = data.text;
                setStreamingAnswer(tempAnswer);
              }
              else if (data.type === 'end') {
                // Final update to Firestore only once at the end
                const finalAnswer = data.text || tempAnswer;
                await updateSelectedChatHistory([...newHistory, { role: "assistant", text: finalAnswer }]);
                setLoading(false);
                setIsStreaming(false);
                setStreamingAnswer(""); // Clear streaming state
                break;
              }
              else if (data.type === 'error') {
                await updateSelectedChatHistory([...newHistory, { role: "assistant", text: `Error: ${data.message || "Unknown error"}` }]);
                setLoading(false);
                setIsStreaming(false);
                setStreamingAnswer("");
                break;
              }
            } catch (error) {
              console.error("Error parsing SSE message:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error with streaming:", error);
      await updateSelectedChatHistory([...newHistory, { role: "assistant", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }]);
      setIsStreaming(false);
      setStreamingAnswer("");
    }
  };

  // Original non-streaming function (as fallback)
  async function handleSendNonStreaming() {
    if (!userQuery.trim()) return;
    const newHistory = [...selectedChatHistory, { role: "user", text: userQuery }];
    await updateSelectedChatHistory(newHistory);
    setUserQuery("");
    setLoading(true);

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
      body: JSON.stringify({ query: userQuery, streaming: true })
    });

    const { answer, error } = await res.json();
    let updatedHistory;
    if (error) {
      updatedHistory = [...newHistory, { role: "assistant", text: error }];
    } else {
      updatedHistory = [...newHistory, { role: "assistant", text: answer }];
    }
    await updateSelectedChatHistory(updatedHistory);
    setLoading(false);
  }

  // Combined send function that uses streaming by default
  async function handleSend() {
    if (!userQuery.trim()) return;
    
    try {
      // Use streaming approach
      await handleStreamingResponse(userQuery);
    } catch (error) {
      console.error("Streaming error, falling back to non-streaming:", error);
      // Fall back to non-streaming if there's an error
      await handleSendNonStreaming();
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedChatHistory, loading, streamingAnswer]);

  // Add cleanup when component unmounts or chat changes
  useEffect(() => {
    return () => {
      setIsStreaming(false);
      setStreamingAnswer("");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [selectedChatId]); // Reset streaming state when chat changes

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
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
        isLoadingChats={isLoadingChats} // Pass the new state for chat history loading
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
          
          {/* Show streaming answer as a separate message */}
          {isStreaming && (
            <div className="mb-2 text-left">
              <span className="inline-block px-3 py-2 rounded text-left max-w-full break-words border-l-4 border-blue-500">
                <ReactMarkdown>{streamingAnswer}</ReactMarkdown>
                {loading && (
                  <div className="text-sm">
                    <Spinner size="sm" />
                  </div>
          )}
              </span>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 left-0 w-full p-6 flex gap-2 z-10 bg-white dark:bg-black">
          <input
            type="text"
            className="flex-grow shadow shadow-gray-900 dark:shadow-gray-100 bg-gray-100 dark:bg-gray-600 rounded px-3 py-2"
            placeholder="Ask me about customer ratings/reviews or how to improve business."
            value={userQuery}
            onChange={e => setUserQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
            disabled={loading}
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