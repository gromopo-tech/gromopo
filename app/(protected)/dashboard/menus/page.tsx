export default async function DashboardPage() {
  return (
      <div className="flex flex-col w-full h-full p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-white rounded shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Menus</h2>
          <p className="text-gray-600">Add/edit menus here.</p>
          </div>
      </div>
      </div>
  );
  }