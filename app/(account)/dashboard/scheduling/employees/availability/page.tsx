"use client";

export default function AvailabilityPage() {
    return (
        <div className="flex flex-col w-full h-full p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            {/* Scheduling Content */}
            <div className="p-4 bg-white rounded shadow-md">
            <h2 className="text-lg font-semibold text-gray-600">Availability</h2>
            <p className="text-gray-600">Manage your employees' availability here.</p>
            </div>
        </div>
        </div>
    );
    }