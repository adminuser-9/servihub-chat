// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {Typography, Box } from '@mui/material';

import {jwtDecode} from 'jwt-decode';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  unread: boolean;
  participants: string;
}
interface DecodedToken {
  id: string;
  email: string;
  name: string;
}
export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [user, setUser] = useState<DecodedToken | null>(null);
  useEffect(() => {
  const token = localStorage.getItem('jwt'); // use 'jwt' here
  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setUser(decoded);
    } catch (err) {
      console.error('Invalid token:', err);
      setUser(null);
    }
  }
}, []);

  useEffect(() => {
  const fetchConversations = async () => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    const res = await fetch('https://servihub-chat.onrender.com/api/my-conversations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const data = await res.json();
    const transformed = data.map((conv: any) => ({
      id: conv.id.toString(),
      title: conv.type === 'DIRECT' ? 'Direct Chat' : conv.type,
      lastMessage: conv.messages[0]?.body ?? '(No messages)',
      unread: false, // you can update this with real logic
      participants: conv.participants.map((p: any) => p.user.name).join(', '),
    }));

    setConversations(transformed);
  };

  fetchConversations();
  const interval = setInterval(fetchConversations, 5000); // poll every 5s
  return () => clearInterval(interval);
}, []);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
    


      {/* Main content */}
      <Box sx={{ flex: 1, p: 4, backgroundColor: '#f9fafb', overflowY: 'auto' }}>
       {/* Greeting */}
{user && (
  <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
    Hello, {user.name}!
  </Typography>
)}


        <Box sx={{ display: 'grid', gap: 2 }}>
          {conversations.map((conv) => (
            <Link
              to={`/chat/${conv.id}`}
              key={conv.id}
              style={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fff',
                  boxShadow: 1,
                  '&:hover': { boxShadow: 2 },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="subtitle1" fontWeight={600}>{conv.title}</Typography>
                  {conv.unread && (
                    <Box
                      component="span"
                      sx={{ fontSize: 12, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'error.main', color: 'white' }}
                    >
                      New
                    </Box>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} noWrap>
                  {conv.lastMessage}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {conv.participants}
                </Typography>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
