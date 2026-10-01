import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SalesModule from './SalesModule';
import PurchasesModule from './PurchasesModule';
import InventoryModule from './InventoryModule';
import SettingsModule from './SettingsModule';
import HRModule from './HRModule';
import AccountingModule from './AccountingModule';
import ErrorBoundary from '../ErrorBoundary';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<{ module: string, tab?: string }>({ module: 'overview' });
  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('gheras_admin');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Right Side (RTL context) */}
      <Sidebar onNavigate={(mod, tab) => setActiveView({ module: mod, tab })} />

      {/* Main Content - Left Side */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-2xl font-bold text-slate-800">لوحة التحكم</h2>
          <div className="flex-1"></div>
          {/* Add user menu or notifications here if needed */}
        </header>

        {/* Workspace */}
        {/* Workspace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          <ErrorBoundary>
            {activeView.module === 'overview' ? (
              <div className="p-8">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">لوحة التقارير المركزية</h3>
                  <p className="text-slate-500">نظرة شاملة لجميع تقارير المنشأة المتاحة.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h4 className="text-xl font-bold text-slate-800 mb-4">أهلاً بك في غِراس</h4>
                    <p className="text-slate-500">منظومة غِراس في وضع التأسيس الجديد. يمكنك البدء بإضافة الوحدات خطوة بخطوة.</p>
                  </div>
                </div>
              </div>
            ) : activeView.module === 'sales' ? (
              <SalesModule initialTab={activeView.tab} />
            ) : activeView.module === 'purchases' ? (
              <PurchasesModule initialTab={activeView.tab} />
            ) : activeView.module === 'inventory' ? (
              <InventoryModule initialTab={activeView.tab} />
            ) : activeView.module === 'accounting' ? (
              <AccountingModule initialTab={activeView.tab} />
            ) : activeView.module === 'settings' ? (
              <SettingsModule initialTab={activeView.tab} />
            ) : activeView.module === 'hr' ? (
              <HRModule initialTab={activeView.tab} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-lg">
                هذا الموديول ({activeView.module}) قيد التطوير...
              </div>
            )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
