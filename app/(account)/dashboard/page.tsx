import Sidebar from "@/components/dashboard/ui/sidebar";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-grow p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Dashboard metrics */}
        </div>
      </div>
    </div>
  );
}