"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export function RagChat({ placeId }: { placeId: string }) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    if (!query.trim()) return;

    setHistory(h => [...h, { role: "user", text: query }]);
    setQuery("")
    setLoading(true);

    const res = await fetch("/api/rag-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place_id: placeId, query })
    });

    const { answer } = await res.json();

    setHistory(h => [...h, { role: "assistant", text: answer }]);
    setQuery("");
    setLoading(false);
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history, loading]);

  return (
    <div>
      <div ref={chatContainerRef} className="shadow dark:shadow-gray-300 border rounded p-4 h-96 overflow-y-auto mb-2">
        {history.map((m, i) => (
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
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
