import { Box, Card, CardContent, Typography, IconButton, List, ListItem } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: string;
  name: string;
  description: string;
}

const mockBusinesses: Business[] = [
  { id: 'b1', name: 'Acme Corp', description: '24/7 electronics support' },
  { id: 'b2', name: 'Globex', description: 'Enterprise software solutions' },
];

export default function BusinessListPage() {
  const navigate = useNavigate();

  const startChat = (businessId: string) => {
    navigate(`/chat/start/${businessId}`);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Browse Businesses
      </Typography>

      <List disablePadding>
        {mockBusinesses.map((biz) => (
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
                  {biz.description}
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
