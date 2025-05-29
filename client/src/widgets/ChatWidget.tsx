import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatMessage {
  senderId: string;
  conversationId: string;
  body: string;
  createdAt?: string;
  id?: string;
}

interface ChatWidgetProps {
  conversationId: string;
  senderId: string;
  businessName: string;
  initialMessages?: ChatMessage[];
}

export default function ChatWidget({
  conversationId,
  senderId,
  businessName,
  initialMessages = [],
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'online' | 'offline' | 'typing' | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set dummy JWT (only for demo; replace in production)
  useEffect(() => {
    localStorage.setItem(
      'jwt',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlRlc3QgQWdlbnQiLCJyb2xlIjoiQUdFTlQiLCJpYXQiOjE3NDg1MTA0MjEsImV4cCI6MTc0OTExNTIyMX0.6W1HyX-xlRg1mUxVKGLXYQdAnjLxMNKToXMVQUjjNnA'
    );
  }, []);

  const safeSend = (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not open. Message not sent.', data);
    }
  };

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      console.warn('JWT missing — WebSocket connection aborted.');
      return;
    }

    const socket = new WebSocket(`ws://localhost:3000/ws?conversationId=${conversationId}`, jwt);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      setStatus('online');
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    socket.onclose = (event) => {
      console.warn(`⚠️ WebSocket closed: code=${event.code}, reason=${event.reason}`);
      setStatus('offline');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Incoming WebSocket message:', data);

      if (data.type === 'message' && data.body) {
        const isDuplicate = messages.some(
          (msg) =>
            msg.body === data.body &&
            msg.senderId === data.senderId &&
            Math.abs(new Date(msg.createdAt || '').getTime() - new Date(data.createdAt || '').getTime()) < 1000
        );

        if (!isDuplicate) {
          setMessages((prev) => [...prev, data]);
        }
      }

      if (data.type === 'typing' && data.conversationId === conversationId) {
        setStatus('typing');
        setTimeout(() => setStatus('online'), 3000);
      }

      if (data.type === 'status' && data.conversationId === conversationId) {
        setStatus(data.status);
      }
    };

    return () => socket.close();
  }, [conversationId, messages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const msg: ChatMessage = {
      senderId,
      conversationId,
      body: input.trim(),
      createdAt: new Date().toISOString(),
      id: `temp-${Date.now()}`,
    };

    safeSend({ type: 'message', ...msg });
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  const handleTyping = () => {
    safeSend({ type: 'typing', conversationId });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{businessName}</Typography>
        {status && (
          <Chip
            size="small"
            label={status === 'typing' ? 'Typing...' : status === 'online' ? 'Online' : 'Offline'}
            color={status === 'typing' ? 'secondary' : status === 'online' ? 'success' : 'default'}
          />
        )}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, px: 1 }}>
        {messages.map((msg, i) => (
          <Box key={msg.id || i} sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {String(msg.senderId) === String(senderId) ? 'You' : `User ${msg.senderId}`}
            </Typography>
            <Paper
              sx={{
                p: 1.2,
                maxWidth: '80%',
                backgroundColor: String(msg.senderId) === String(senderId) ? '#e3f2fd' : '#f1f1f1',
                alignSelf: String(msg.senderId) === String(senderId) ? 'flex-end' : 'flex-start',
                borderRadius: 2,
                mt: 0.5,
              }}
            >
              <Typography variant="body2">{msg.body}</Typography>
            </Paper>
          </Box>
        ))}
        <div ref={scrollRef} />
      </Box>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
            else handleTyping();
          }}
        />
        <IconButton color="primary" onClick={sendMessage} sx={{ '&:focus': { outline: 'none' } }}>
          <SendIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
}
