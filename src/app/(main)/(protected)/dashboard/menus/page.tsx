"use client";

import MenusHandler from "./menusHandler";

export default function MenusPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Menus</h1>
      <MenusHandler />
    </div>
  );
}