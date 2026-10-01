import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SalesModule from './SalesModule';
import PurchasesModule from './PurchasesModule';
import InventoryModule from './InventoryModule';
import SettingsModule from './SettingsModule';

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
          {activeView.module === 'overview' ? (
            <div className="p-8">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">لوحة التقارير المركزية</h3>
                <p className="text-slate-500">نظرة شاملة لجميع تقارير المنشأة المتاحة.</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[
                  {
                    title: 'تقارير المبيعات',
                    colorClass: 'bg-emerald-500',
                    reports: ['ملخص أرصدة العملاء', 'كشف عميل', 'ملخص فواتير المبيعات', 'ملخص الإيصالات المباعة', 'ربحية المنتجات', 'أعمار ديون المبيعات', 'إجمالي المبيعات حسب الفترة', 'التسليمات المعلقة للتجزئة']
                  },
                  {
                    title: 'تقارير المشتريات',
                    colorClass: 'bg-blue-500',
                    reports: ['ملخص أرصدة الموردين', 'كشف مورد', 'ملخص فواتير المشتريات', 'ملخص الإيصالات للمشتروات', 'ملخص مصروفات العهد النقدية', 'أسعار دفع المشتريات', 'ملخص المنتجات المستردة', 'إجمالي المشتريات حسب الفترة', 'التسليمات المعلقة للمشتروات']
                  },
                  {
                    title: 'تقارير المحاسبة',
                    colorClass: 'bg-purple-500',
                    reports: ['دفتر الأستاذ', 'الميزانية العمومية', 'قائمة الدخل', 'ميزان المراجعة', 'كشف حساب', 'كشف أبعاد التقارير', 'الإقرار الضريبي', 'تقرير الفحص الضريبي', 'ملخص الإيصالات العامة']
                  },
                  {
                    title: 'المنتجات والمخزون',
                    colorClass: 'bg-amber-500',
                    reports: ['الأستاذ المخزني', 'المستودع الحالي', 'جرد المخزون الحالي']
                  },
                  {
                    title: 'الموارد البشرية',
                    colorClass: 'bg-rose-500',
                    reports: ['ملخص أرصدة الموظفين', 'كشف موظف', 'تقرير الحضور']
                  }
                ].map((category, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-2 h-8 rounded-full ${category.colorClass}`}></div>
                      <h4 className="text-xl font-bold text-slate-800">{category.title}</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {category.reports.map((report, rIdx) => (
                        <button key={rIdx} className="text-right p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-colors text-sm font-medium text-slate-700 flex items-center justify-between group">
                          <span>{report}</span>
                          <span className="text-slate-400 group-hover:text-emerald-500 transition-colors truncate w-4 rtl:-rotate-180">←</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeView.module === 'sales' ? (
            <SalesModule initialTab={activeView.tab} />
          ) : activeView.module === 'purchases' ? (
            <PurchasesModule initialTab={activeView.tab} />
          ) : activeView.module === 'inventory' ? (
            <InventoryModule initialTab={activeView.tab} />
          ) : activeView.module === 'settings' ? (
            <SettingsModule initialTab={activeView.tab} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-lg">
              هذا الموديول ({activeView.module}) قيد التطوير...
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
