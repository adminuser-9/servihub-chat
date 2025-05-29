// src/components/RequireAuth.tsx
import React from 'react'; // <-- this is required to access JSX.Element
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }: { children: React.ReactElement }) {
  const jwt = localStorage.getItem('jwt');
  return jwt ? children : <Navigate to="/login" replace />;
}
