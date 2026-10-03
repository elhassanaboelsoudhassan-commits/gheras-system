import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';

const ProtectedRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  const location = useLocation();
  if (!isAuthenticated && location.pathname !== '/') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const PublicRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  const location = useLocation();
  if (isAuthenticated && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const stored = localStorage.getItem('gheras_admin');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) return true;
      } catch (e) {}
    }
    return false;
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthChecking(false);
    }, 1000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const stored = localStorage.getItem('gheras_admin');
      let isBypass = false;
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.email) {
            isBypass = true;
          }
        } catch (e) {}
      }

      if (user) {
        localStorage.setItem('gheras_admin', JSON.stringify({ role: 'admin', email: user.email }));
        setIsAuthenticated(true);
      } else if (isBypass) {
        // Keep the local admin bypass active without wiping it
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('gheras_admin');
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
      clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  if (isAuthChecking && !isAuthenticated) {
    // Show glass login immediately instead of a blank screen while checking
  }

  return (
    <Routes>
      <Route path="/" element={<PublicRoute isAuthenticated={isAuthenticated}><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
