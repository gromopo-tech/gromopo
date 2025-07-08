import React from "react";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r h-screen p-4 flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Chats</h2>
      <button className="bg-blue-600 mb-2 text-white px-4 py-2 rounded">+ New Chat</button>
      <ul className="flex-1 overflow-y-auto mb-4">
        {/* Placeholder chat list */}
        <li className="mb-2 p-2 rounded bg-white dark:bg-gray-800 cursor-pointer">Chat 1</li>
        <li className="mb-2 p-2 rounded bg-white dark:bg-gray-800 cursor-pointer">Chat 2</li>
      </ul>
    </aside>
  );
} 