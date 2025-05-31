import { useEffect, useState } from 'react';
import {
  Box, Card, Typography, IconButton, List, ListItem
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';


interface Business {
  id: string;
  name: string;
  description?: string;
}

export default function BusinessListPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const navigate = useNavigate();
  const jwt = localStorage.getItem('jwt');
const payload = jwt ? JSON.parse(atob(jwt.split('.')[1])) : null;
console.log(`payload is ${JSON.stringify(payload)}`)


  useEffect(() => {
    const fetchBusinesses = async () => {
  try {
    const res = await fetch(`http://localhost:3000/api/businesses`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    const data = await res.json();
    setBusinesses(data);
  } catch (err) {
    console.error('Failed to fetch businesses', err);
  }
};

    fetchBusinesses();
  }, []);

  const startChat = async (businessId: string) => {
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`http://localhost:3000/api/start-chat/${businessId}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${jwt}` },
});


      if (!res.ok) throw new Error('Chat init failed');

      const { conversationId } = await res.json();
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };

  return (
<Box sx={{ maxWidth: 800, mx: 'auto', pt: 4, px: 4 }}>
      <Typography variant="h4" gutterBottom>
        Browse Businesses
      </Typography>

      <List disablePadding>
        {businesses.map((biz) => (
          <ListItem key={biz.id} disablePadding sx={{ mb: 2 }}>
            <Card
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                p: 2,
              }}
            >
              <Box>
                <Typography variant="h6">{biz.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {biz.description || 'No description'}
                </Typography>
              </Box>
              <IconButton color="primary" onClick={() => startChat(biz.id)}>
                <ChatIcon />
              </IconButton>
            </Card>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
