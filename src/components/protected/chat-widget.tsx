"use client";

import React, { useState, useRef, useEffect, useContext, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { auth, db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, query, orderBy, getDocs } from "firebase/firestore";
import { BusinessIdContext } from "@/components/protected/business-id-provider";
import { RoleContext } from "@/components/protected/role-provider";
import { Spinner } from "@/components/ui/spinner";

type Chat = {
  id: string;
  name: string;
  history: { role: string; text: string }[];
  createdAt: import("firebase/firestore").Timestamp | Date;
};

export default function ChatWidget() {
  // Ref for chat history menu
  const chatHistoryMenuRef = useRef<HTMLDivElement>(null);
  const businessId = useContext(BusinessIdContext);
  const role = useContext(RoleContext);
  const [isOpen, setIsOpen] = useState(true); // Changed to true - open by default
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [editingHeaderName, setEditingHeaderName] = useState(false); // New state for header name editing
  const [headerEditName, setHeaderEditName] = useState(""); // New state for header edit input
  const [loading, setLoading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  
  // Resize functionality
  const [isResizing, setIsResizing] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 384, height: 384 }); // Default: w-96 h-96
  const chatRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Fetch chats on mount
  useEffect(() => {
    // Only fetch chats when we have a businessId AND the user is an owner.
    // This avoids permission denied errors while auth/claims are still initializing.
    if (!businessId || role !== 'owner') {
      setChats([]);
      setSelectedChatId(null);
      setIsLoadingChats(false);
      return;
    }

    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        const chatsRef = collection(db, `businesses/${businessId}/chats`);
        const q = query(chatsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const chatDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Chat[];
        
        setChats(chatDocs);
        
        if (chatDocs.length > 0 && !selectedChatId) {
          setSelectedChatId(chatDocs[0].id);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };
    
    fetchChats();
  }, [businessId, role, selectedChatId]);

  // Cleanup event source on unmount
  useEffect(() => {
    const currentEventSource = eventSourceRef.current;
    
    return () => {
      if (currentEventSource) {
        currentEventSource.close();
      }
    };
  }, []);

  // Get the history for the selected chat
  const selectedChatHistory = useMemo(() => {
    return chats.find(c => c.id === selectedChatId)?.history || [];
  }, [chats, selectedChatId]);

  // Update history for selected chat
  const updateSelectedChatHistory = async (newHistory: { role: string; text: string }[]) => {
    if (!selectedChatId || !businessId || role !== 'owner') return;
    await updateDoc(doc(db, `businesses/${businessId}/chats/${selectedChatId}`), { history: newHistory });
    setChats(chats => chats.map(c => c.id === selectedChatId ? { ...c, history: newHistory } : c));
  };

  const handleNewChat = async () => {
    if (!businessId || role !== 'owner') {
      // silently ignore or show a toast if you prefer
      return;
    }

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
    setShowHistory(false); // Close history after creating new chat
    setLoading(false);
  };

  const handleEditName = async (chatId: string, newName: string) => {
    if (!businessId || role !== 'owner') return;
    await updateDoc(doc(db, `businesses/${businessId}/chats/${chatId}`), { name: newName });
    setChats((chats) => chats.map((c) => ({
      ...c,
      name: c.id === chatId ? newName : c.name,
    })));
  };

  const handleHeaderNameClick = () => {
    if (selectedChatId && !showHistory) { // Don't allow editing if dropdown is open
      const currentName = chats.find(c => c.id === selectedChatId)?.name || "ChatGMP";
      setEditingHeaderName(true);
      setHeaderEditName(currentName);
    }
  };

  const handleHeaderNameSave = async () => {
    if (selectedChatId && headerEditName.trim()) {
      await handleEditName(selectedChatId, headerEditName.trim());
      setEditingHeaderName(false);
      setHeaderEditName("");
    }
  };

  const handleHeaderNameCancel = () => {
    setEditingHeaderName(false);
    setHeaderEditName("");
  };

  const handleDeleteChat = async (chatId: string) => {
    // Add confirmation dialog
    const chatName = chats.find(c => c.id === chatId)?.name || "this chat";
    if (!confirm(`Are you sure you want to delete "${chatName}"?`)) {
      return;
    }
    
    if (!businessId || role !== 'owner') return;
    await deleteDoc(doc(db, `businesses/${businessId}/chats/${chatId}`));
    setChats((prevChats) => {
      const filtered = prevChats.filter((c: Chat) => c.id !== chatId);
      if (selectedChatId === chatId && filtered.length > 0) {
        setSelectedChatId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleStreamingResponse = async (query: string) => {
    if (!userQuery.trim()) return;
    
    const newHistory = [...selectedChatHistory, { role: "user", text: query }];
    await updateSelectedChatHistory(newHistory);
    setUserQuery("");
    
    setLoading(true);
    setIsStreaming(true);
    setStreamingAnswer("");
    
    const user = auth.currentUser;
    if (!user) {
      await updateSelectedChatHistory([...newHistory, { role: "assistant", text: "You must be signed in to use chat." }]);
      setLoading(false);
      setIsStreaming(false);
      return;
    }
    
    const idToken = await user.getIdToken();
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    let tempAnswer = "";
    
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
              
              if (data.type === 'token' && data.text) {
                setLoading(false);
                tempAnswer += data.text;
                setStreamingAnswer(tempAnswer);
              }
              else if (data.type === 'answer' && data.text) {
                tempAnswer = data.text;
                setStreamingAnswer(tempAnswer);
              }
              else if (data.type === 'end') {
                const finalAnswer = data.text || tempAnswer;
                updateSelectedChatHistory([...newHistory, { role: "assistant", text: finalAnswer }]);
                setLoading(false);
                setIsStreaming(false);
                setStreamingAnswer("");
                break;
              }
              else if (data.type === 'error') {
                updateSelectedChatHistory([...newHistory, { role: "assistant", text: `Error: ${data.message || "Unknown error"}` }]);
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
      updateSelectedChatHistory([...newHistory, { role: "assistant", text: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }]);
      setIsStreaming(false);
      setStreamingAnswer("");
    }
  };

  async function handleSend() {
    if (!userQuery.trim()) return;
    
    try {
      await handleStreamingResponse(userQuery);
    } catch (error) {
      console.error("Streaming error, falling back to non-streaming:", error);
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedChatHistory, loading, streamingAnswer]);

  useEffect(() => {
    const currentEventSource = eventSourceRef.current;
    
    return () => {
      setIsStreaming(false);
      setStreamingAnswer("");
      setEditingHeaderName(false); // Close header editing when chat changes
      setHeaderEditName("");
      if (currentEventSource) {
        currentEventSource.close();
      }
    };
  }, [selectedChatId]);

  const selectedChatName = chats.find(c => c.id === selectedChatId)?.name || "ChatGMP";

  // Resize event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: chatSize.width,
      height: chatSize.height,
    };
  }, [chatSize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;

    // Calculate new size (resize from top-left corner)
    const newWidth = Math.max(300, startPosRef.current.width - deltaX); // Min width: 300px
    const newHeight = Math.max(250, startPosRef.current.height - deltaY); // Min height: 250px
    
    setChatSize({ width: newWidth, height: newHeight });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Only show chat widget for owners - check this after all hooks
  if (role !== 'owner') {
    return null;
  }

  return (
    <>
      {/* Chat Widget Button */}
      <div className="fixed bottom-4 right-4 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            aria-label="Open Chat"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </button>
        )}
        
        {/* Chat Window */}
        {isOpen && (
          <div 
            ref={chatRef}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl flex flex-col relative"
            style={{ 
              width: `${chatSize.width}px`, 
              height: `${chatSize.height}px`,
              minWidth: '300px',
              minHeight: '250px'
            }}
            onMouseDown={e => {
              if (showHistory && chatHistoryMenuRef.current && !chatHistoryMenuRef.current.contains(e.target as Node)) {
                setShowHistory(false);
              }
            }}
          >
            {/* Resize Handle - Top Left Corner */}
            <div
              className="absolute -top-1 -left-1 w-4 h-4 cursor-nw-resize hover:bg-blue-200 dark:hover:bg-blue-700 rounded-tl-lg opacity-70 hover:opacity-100 transition-all duration-200 z-10 flex items-center justify-center"
              onMouseDown={handleMouseDown}
              title="Drag to resize"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <path d="M0 8L8 0M2 8L8 2M4 8L8 4" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {editingHeaderName ? (
                  <input
                    className="flex-1 text-base font-semibold border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={headerEditName}
                    onChange={e => setHeaderEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleHeaderNameSave();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        handleHeaderNameCancel();
                      }
                    }}
                    onBlur={handleHeaderNameSave}
                    autoFocus
                  />
                ) : (
                  <h3 
                    className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                    onClick={handleHeaderNameClick}
                    title="Click to rename chat"
                  >
                    {selectedChatName}
                  </h3>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {/* Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setEditingHeaderName(false); // Close header editing when opening dropdown
                      setHeaderEditName("");
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    aria-label="Chat options"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                  {showHistory && (
                    <div ref={chatHistoryMenuRef} className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1 w-48 z-10">
                      <button
                        onClick={handleNewChat}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        + New Chat
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      <div className="max-h-48 overflow-y-auto">
                        {isLoadingChats ? (
                          <div className="flex justify-center p-2">
                            <Spinner size="sm" />
                          </div>
                        ) : (
                          chats.map(chat => (
                            <div key={chat.id} className="relative group">
                              <button
                                onClick={() => {
                                  setSelectedChatId(chat.id);
                                  setShowHistory(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 truncate pr-8 ${
                                  selectedChatId === chat.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                                }`}
                              >
                                <span className="text-gray-700 dark:text-gray-300">{chat.name}</span>
                              </button>
                              <button
                                onClick={e => { 
                                  e.stopPropagation(); 
                                  handleDeleteChat(chat.id);
                                }}
                                className="absolute right-2 top-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-700 rounded text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                title="Delete chat"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setEditingHeaderName(false); // Close header editing when closing chat
                    setHeaderEditName("");
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  aria-label="Close Chat"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3" ref={chatContainerRef}>
              {selectedChatHistory.map((m, i) => (
                <div key={i} className={`mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}>
                  {m.role === "assistant" ? (
                    <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-left max-w-[85%] break-words text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="inline-block px-3 py-2 rounded-lg bg-blue-600 text-white max-w-[85%] break-words text-sm">
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Streaming answer */}
              {isStreaming && (
                <div className="mb-2 text-left">
                  <div className="inline-block px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-left max-w-[85%] break-words text-sm border-l-4 border-blue-500 prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {streamingAnswer}
                    </ReactMarkdown>
                    {loading && (
                      <div className="text-sm mt-1">
                        <Spinner size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ask me anything..."
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || !userQuery.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Backdrop to close menu when clicking outside the chat widget */}
      {showHistory && !isResizing && (
        <div
          className="fixed inset-0 z-30"
          onMouseDown={e => {
            if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
              setShowHistory(false);
            }
          }}
        />
      )}
    </>
  );
}
