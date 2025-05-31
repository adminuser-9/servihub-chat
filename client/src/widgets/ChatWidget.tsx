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
import {jwtDecode} from 'jwt-decode';
interface DecodedToken {
  id: string;
  email: string;
  name: string;
}
interface ChatMessage {
  senderId: string;
  conversationId: string;
  body: string;
  createdAt?: string;
  id?: string;
}

interface ChatWidgetProps {
  conversationId: string;
  senderId:string;
  businessName: string;
  initialMessages?: ChatMessage[];
}

export default function ChatWidget({
  conversationId,
  businessName,
  initialMessages = [],
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'online' | 'offline' | 'typing' | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [senderId, setSenderId] = useState<string>('');
  const senderIdRef = useRef<string>('');


useEffect(() => {
  const token = localStorage.getItem('jwt');
  if (!token) {
    console.warn('JWT missing — cannot determine user identity');
    return;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    setSenderId(decoded.id);
    senderIdRef.current = decoded.id;
    
  } catch (err) {
    console.error('Failed to decode JWT', err);
  }
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

 const socket = new WebSocket(`ws://localhost:3000/ws?conversationId=${conversationId}&token=${jwt}`);

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
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.body === data.body &&
            msg.senderId === data.senderId &&
            Math.abs(new Date(msg.createdAt || '').getTime() - new Date(data.createdAt || '').getTime()) < 1000
        );
        return isDuplicate ? prev : [...prev, data];
      });
    }

    if (
  data.type === 'typing' &&
  data.conversationId === conversationId &&
  data.senderId !== senderIdRef.current
) {
  setStatus('typing');
  setTimeout(() => setStatus('online'), 3000);
}


    if (data.type === 'status' && data.conversationId === conversationId) {
      setStatus(data.status);
    }
  };

  return () => socket.close();
}, [conversationId]); // <-- ✅ remove messages from dependency
useEffect(() => {
  const fetchMessages = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) throw new Error('JWT missing');

      const res = await fetch(`http://localhost:3000/api/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  fetchMessages();
}, [conversationId]);


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
