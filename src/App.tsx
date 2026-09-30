import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 2. Local Admin Bypass Check: skip loading if local session exists
    const storedUser = localStorage.getItem('gheras_admin');
    if (storedUser) {
      setLoading(false);
      if (window.location.pathname === '/') {
        navigate('/dashboard');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'elhassanelsoudy@gmail.com') {
        localStorage.setItem('gheras_admin', JSON.stringify({ role: 'admin', email: user.email }));
        if (window.location.pathname === '/') {
          navigate('/dashboard');
        }
      } else {
        // 1. Fix Infinite Redirect Loop: if no user, direct to login immediately
        const currentStoredUser = localStorage.getItem('gheras_admin');
        if (!currentStoredUser) {
          if (window.location.pathname !== '/') {
            navigate('/');
          }
        }
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
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
