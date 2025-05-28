// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Box, Button } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  unread: boolean;
  participants: string;
}

export default function HomePage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    // Mock fetch conversations
    setConversations([
      {
        id: '1',
        title: 'Acme Corp Support',
        lastMessage: 'Thanks, we’ll get back to you shortly.',
        unread: true,
        participants: 'Business • Alice',
      },
      {
        id: '2',
        title: 'Internal Team Chat',
        lastMessage: 'Updated the deployment script.',
        unread: false,
        participants: 'Dev • Bob, Charlie',
      },
    ]);
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
        <Typography variant="body2">Jane Doe</Typography>
        <Typography variant="caption" color="text.secondary">jane@company.com</Typography>
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
