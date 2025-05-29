// src/pages/ChatPage.tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ChatWidget from '../widgets/ChatWidget';

interface ConversationDetail {
  conversationId: string;
  businessName: string;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ← Add this state
  const [messages, setMessages] = useState<
    { id: string; senderId: string; body: string; createdAt: string }[]
  >([]);

  // Fetch conversation metadata
  useEffect(() => {
    if (!conversationId) return;

    fetch(`http://localhost:3000/api/conversations/${conversationId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data: ConversationDetail) => setDetail(data))
      .catch((err) => setError(err.message));
  }, [conversationId]);

  // Fetch existing messages
  useEffect(() => {
    if (!conversationId) return;

    fetch(`http://localhost:3000/api/conversations/${conversationId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load messages');
        return res.json();
      })
      .then((msgs) =>  setMessages(
    msgs.map((msg: any) => ({
      ...msg,
      conversationId: conversationId!, // inject required field
    }))
  ))
      .catch((err) => {
        console.error(err);
        setError('Unable to load messages');
      });
  }, [conversationId]);

  if (!conversationId) return <div>Invalid conversation ID.</div>;
  if (error) return <div>{error}</div>;
  if (!detail) return <div>Loading chat…</div>;

  return (
    <div style={{ height: '100vh', padding: 24 }}>
      <ChatWidget
        conversationId={detail.conversationId}
        senderId="1"
        businessName={detail.businessName}
          initialMessages={messages.map((msg) => ({
    ...msg,
    conversationId: detail.conversationId, // ← inject this
  }))}// pass in your loaded messages
      />
    </div>
  );
}
