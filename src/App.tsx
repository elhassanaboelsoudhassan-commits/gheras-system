import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';

// 1. المكون المحمي (ProtectedRoute) لمنع التوجيه العشوائي
const ProtectedRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('gheras_admin');
  });
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // نسف الوميض وإلغاء دالة الانتظار تماماً مع مصفوفة تبعية فارغة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'elhassanelsoudy@gmail.com') {
        localStorage.setItem('gheras_admin', JSON.stringify({ role: 'admin', email: user.email }));
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('gheras_admin');
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (isAuthChecking && !isAuthenticated) {
    // Return a minimal fallback or just let it render PublicRoute immediately 
    // to show the luxury glass login instead of a white screen
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
