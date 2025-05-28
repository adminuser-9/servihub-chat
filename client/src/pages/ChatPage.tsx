// src/pages/ChatPage.tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ChatWidget from '../widgets/ChatWidget';

interface ConversationDetail {
  conversationId: string;
  businessName: string;
  // …other metadata you might need
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);


useEffect(() => {
  if (!conversationId) return;

  fetch(`http://localhost:3000/api/conversations/${conversationId}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    })
    .then((data) => setDetail(data))
    .catch((err) => setError(err.message));
}, [conversationId]);


  if (!conversationId) {
    return <div>Invalid conversation ID.</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!detail) {
    return <div>Loading chat…</div>;
  }

  return (
    <div style={{ height: '100vh', padding: 24 }}>
      <ChatWidget
        conversationId={detail.conversationId}
        senderId="1"                   
        businessName={detail.businessName}
      />
    </div>
  );
}
