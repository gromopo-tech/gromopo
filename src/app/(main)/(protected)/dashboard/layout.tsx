import ChatWidget from '@/components/protected/chat-widget';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {children}
      <ChatWidget />
    </div>
  );
}
