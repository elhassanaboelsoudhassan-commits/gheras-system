import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';

// 1. المكون المحمي (ProtectedRoute) لمنع التوجيه العشوائي
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem('gheras_admin');
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = localStorage.getItem('gheras_admin');
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  // نسف الوميض وإلغاء دالة الانتظار تماماً
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'elhassanelsoudy@gmail.com') {
        localStorage.setItem('gheras_admin', JSON.stringify({ role: 'admin', email: user.email }));
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
