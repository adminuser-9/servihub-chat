// src/components/Layout.tsx
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    navigate('/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', m: 0 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary">
            ChatHub
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => navigate('/')} startIcon={<MessageIcon />} color="inherit">
              Conversations
            </Button>
            <Button onClick={() => navigate('/businesses')} color="inherit">
              Businesses
            </Button>
            <Button onClick={() => navigate('/settings')} startIcon={<SettingsIcon />} color="inherit">
              Settings
            </Button>
            <Button onClick={handleLogout} color="error">
              Logout
            </Button>
          </Box>
          <AccountCircleIcon color="action" />
        </Toolbar>
      </AppBar>

      {/* Content below navbar */}
      <Box sx={{ flexGrow: 1, m: 0, p: 0 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
