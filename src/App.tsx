import React, { useState, useEffect } from 'react';
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
  // 2. تثبيت الحالة المبدئية: Start loading as false if we already have a local session
  const [loading, setLoading] = useState(() => !localStorage.getItem('gheras_admin'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'elhassanelsoudy@gmail.com') {
        localStorage.setItem('gheras_admin', JSON.stringify({ role: 'admin', email: user.email }));
      }
      // Guarantee loading is false after auth check completes
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">جاري الاتصال بسحابة غِراس...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
