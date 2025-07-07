import { RagChat } from "./ragChat"

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ChatGMP</h1>
      <RagChat placeId="ChIJuVyExGENK4cRooPhJIUgnxk" />
    </div>
  )
}