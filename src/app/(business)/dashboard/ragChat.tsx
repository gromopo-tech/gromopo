"use client";

import { useState, useRef, useEffect, useContext } from "react";
import ReactMarkdown from "react-markdown";
import { auth, db } from "@/lib/firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { BusinessIdContext } from "@/components/business/business-id-provider";

export function RagChat({
  placeId,
  selectedChatId,
  chatHistory,
  setChatHistory,
}: {
  placeId: string;
  selectedChatId: string | null;
  chatHistory: { role: string; text: string }[];
  setChatHistory: (h: { role: string; text: string }[]) => void;
}) {
  const businessId = useContext(BusinessIdContext);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    if (!query.trim()) return;

    const newHistory = [...chatHistory, { role: "user", text: query }];
    setChatHistory(newHistory);
    setQuery("");
    setLoading(true);

    // Get Firebase ID token
    const user = auth.currentUser;
    if (!user) {
      setChatHistory([...chatHistory, { role: "assistant", text: "You must be signed in to use chat." }]);
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
      body: JSON.stringify({ place_id: placeId, query })
    });

    const { answer, error } = await res.json();
    let updatedHistory;
    if (error) {
      updatedHistory = [...newHistory, { role: "assistant", text: error }];
    } else {
      updatedHistory = [...newHistory, { role: "assistant", text: answer }];
    }
    setChatHistory(updatedHistory);
    setQuery("");
    setLoading(false);

    // Auto-save to Firestore
    if (businessId && selectedChatId) {
      await updateDoc(doc(db, `businesses/${businessId}/chats/${selectedChatId}`), {
        history: updatedHistory,
      });
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  return (
    <div>
      <div ref={chatContainerRef} className="shadow dark:shadow-gray-300 border rounded p-4 h-96 overflow-y-auto mb-2">
        {chatHistory.map((m, i) => (
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
        {loading && <div className="text-sm">Thinking…</div>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-grow shadow dark:shadow-gray-300 rounded px-3 py-2"
          placeholder="Hi what can I help you with?"
          value={query}
          onChange={e => setQuery(e.target.value)}
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
  );
}
