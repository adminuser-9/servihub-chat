// src/components/RequireAuth.tsx
import type { ReactNode} from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface Props {
  children: ReactNode;
}

interface DecodedToken {
  exp: number; // UNIX timestamp
}

export default function RequireAuth({ children }: Props) {
  const token = localStorage.getItem('jwt');

  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem('jwt');
      return <Navigate to="/login" />;
    }
  } catch {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
