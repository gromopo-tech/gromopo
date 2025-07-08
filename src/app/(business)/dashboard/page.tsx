import { RagChat } from "./ragChat"
import Sidebar from "@/components/business/dashboard/sidebar";

export default function DashboardPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">GMPchat</h1>
        <RagChat placeId="ChIJuVyExGENK4cRooPhJIUgnxk" />
      </div>
    </div>
  )
}