export default function DashboardPage() {
  return (
      <div className="flex flex-col w-full h-full p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-white rounded shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Dashboard Home</h2>
          <p className="text-gray-600">Overview of orders.</p>
          </div>
      </div>
      </div>
  );
  }