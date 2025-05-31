// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
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

    const res = await fetch('http://localhost:3000/api/my-conversations', {
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
      {/* Navigation Bar */}
      <AppBar position="static" color="default" elevation={1}>
  <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="h6" color="primary">
      ChatHub
    </Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Button component={Link} to="/" startIcon={<MessageIcon />} color="inherit">
        Conversations
      </Button>
      <Button component={Link} to="/businesses" color="inherit">
        Businesses
      </Button>
      <Button component={Link} to="/settings" startIcon={<SettingsIcon />} color="inherit">
        Settings
      </Button>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccountCircleIcon color="action" />
      <Box>
        <Typography variant="body2">{user?.name}</Typography>
        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
      </Box>
    </Box>
  </Toolbar>
</AppBar>


      {/* Main content */}
      <Box sx={{ flex: 1, p: 4, backgroundColor: '#f9fafb', overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight={600}>Conversations</Typography>
          <Button variant="contained" color="primary">
            + New Chat
          </Button>
        </Box>

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
