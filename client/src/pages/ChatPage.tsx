import ChatWidget from '../widgets/ChatWidget';

export default function ChatPage() {
  return (
    <div style={{ height: '100vh', padding: 24 }}>
      <ChatWidget conversationId="123" senderId="1" />
    </div>
  );
}
