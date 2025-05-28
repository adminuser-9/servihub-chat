import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface ChatMessage {
  senderId: string;
  conversationId: string;
  body: string;
  createdAt?: string;
}

interface ChatWidgetProps {
  conversationId: string;
  senderId: string;
}

export default function ChatWidget({ conversationId, senderId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const jwt = localStorage.getItem('jwt') || 'PASTE_YOUR_JWT_HERE';
    const socket = new WebSocket(`ws://localhost:3000/ws`, jwt);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.body) {
        setMessages((prev) => [...prev, data]);
      }
    };

    return () => {
      socket.close();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 const sendMessage = () => {
  if (socketRef.current && input.trim()) {
    const msg: ChatMessage = {
      senderId,
      conversationId,
      body: input.trim(),
    };
    socketRef.current.send(JSON.stringify(msg));

    // Append locally (for optimistic UI)
    setMessages((prev) => [...prev, { ...msg, createdAt: new Date().toISOString() }]);

    setInput('');
  }
};


  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Live Chat
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, px: 1 }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {msg.senderId === senderId ? 'You' : `User ${msg.senderId}`}
            </Typography>
            <Paper
              sx={{
                p: 1.2,
                maxWidth: '80%',
                backgroundColor: msg.senderId === senderId ? '#e3f2fd' : '#f1f1f1',
                alignSelf: msg.senderId === senderId ? 'flex-end' : 'flex-start',
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
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <IconButton
  color="primary"
  onClick={sendMessage}
  sx={{
    '&:focus': {
      outline: 'none',
    },
  }}
>
  <SendIcon />
</IconButton>

      </Stack>
    </Paper>
  );
}
