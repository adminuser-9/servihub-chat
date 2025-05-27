import { useEffect, useState, useRef } from 'react';

interface ChatMessage {
  senderId: string;
  conversationId: string;
  body: string;
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const jwt = 'PASTE_YOUR_JWT_HERE';
    const socket = new WebSocket('ws://localhost:3000/ws', jwt);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.body) {
        setMessages((prev) => [...prev, data]);
      } else {
        console.log('Other message:', data);
      }
    };

    socket.onopen = () => console.log('✅ Connected to chat');
    socket.onerror = (err) => console.error('❌ WebSocket error:', err);
    socket.onclose = () => console.log('🔒 Disconnected');

    return () => socket.close();
  }, []);

  const sendMessage = () => {
    if (socketRef.current && input.trim()) {
      const msg: ChatMessage = {
        senderId: '1', // TODO: dynamically set this
        conversationId: '123', // TODO: set from props or state
        body: input.trim(),
      };
      socketRef.current.send(JSON.stringify(msg));
      setInput('');
    }
  };

  return (
    <div style={{ padding: 12, border: '1px solid #ccc', width: 300 }}>
      <h3>💬 Chat</h3>
      <div style={{ height: 200, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((msg, i) => (
          <div key={i}><b>{msg.senderId}:</b> {msg.body}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message"
        style={{ width: '100%', marginBottom: 4 }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
