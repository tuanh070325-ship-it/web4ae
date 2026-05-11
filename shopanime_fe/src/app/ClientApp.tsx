'use client';

import { BrowserRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import App from '../App';
import { AuthProvider } from '../components/auth/AuthProvider';

export function ClientApp() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}
