import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-green-900 text-white h-screen p-4">
      <nav className="space-y-4">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard/ordering" className="block hover:text-orange-400">
              Ordering
            </Link>
          </li>
          <li>
            <Link href="/dashboard/scheduling" className="block hover:text-orange-400">
              Scheduling
            </Link>
          </li>
          <li>
            <Link href="/dashboard/settings" className="block hover:text-orange-400">
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}