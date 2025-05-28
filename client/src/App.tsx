// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import BusinessListPage from './pages/BusinessListPage';
import ChatPage from './pages/ChatPage';
// import ChatPage from './pages/ChatPage'; // ← create this later
// import LoginPage from './pages/LoginPage'; // ← optional for auth flow

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<HomePage />} />
        <Route path="/businesses" element={<BusinessListPage />} />
        <Route path="/chat/start/:businessId" element={<ChatPage />} />

        {/* <Route path="/chat/:conversationId" element={<ChatPage />} /> */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
