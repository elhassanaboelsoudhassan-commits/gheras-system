import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('gheras_user');
    if (!user) {
      navigate('/');
      return;
    }

    // Simulate initial data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Right Side (RTL context) */}
      <Sidebar />

      {/* Main Content - Left Side */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-2xl font-bold text-slate-800">لوحة التحكم</h2>
          <div className="flex-1"></div>
          {/* Add user menu or notifications here if needed */}
        </header>

        {/* Workspace */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { title: 'إجمالي المبيعات', value: '1,250,000 ر.س', color: 'from-emerald-500 to-emerald-400' },
              { title: 'المشتريات', value: '450,000 ر.س', color: 'from-blue-500 to-blue-400' },
              { title: 'العملاء', value: '1,240', color: 'from-amber-500 to-amber-400' },
              { title: 'المخزون', value: '8,500 صنف', color: 'from-purple-500 to-purple-400' },
            ].map((card, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-2 h-full bg-gradient-to-b ${card.color}`}></div>
                <h3 className="text-slate-500 text-sm font-medium mb-2">{card.title}</h3>
                <p className="text-3xl font-bold text-slate-800">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Large Table Area */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">أحدث الفواتير</h3>
              <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700">عرض الكل</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-medium">رقم الفاتورة</th>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                    <th className="px-6 py-4 font-medium">العميل</th>
                    <th className="px-6 py-4 font-medium">القيمة</th>
                    <th className="px-6 py-4 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 'INV-2024-001', date: '2024-05-01', client: 'شركة الأفق المحدودة', amount: '15,000 ر.س', status: 'مدفوعة' },
                    { id: 'INV-2024-002', date: '2024-05-02', client: 'مؤسسة البناء الحديث', amount: '8,450 ر.س', status: 'معلقة' },
                    { id: 'INV-2024-003', date: '2024-05-03', client: 'الشركة العالمية للتجارة', amount: '32,100 ر.س', status: 'مدفوعة' },
                    { id: 'INV-2024-004', date: '2024-05-04', client: 'مجموعة الرواد', amount: '4,200 ر.س', status: 'ملغاة' },
                    { id: 'INV-2024-005', date: '2024-05-05', client: 'مؤسسة السعادة', amount: '11,800 ر.س', status: 'مدفوعة' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{row.id}</td>
                      <td className="px-6 py-4">{row.date}</td>
                      <td className="px-6 py-4">{row.client}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{row.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          row.status === 'مدفوعة' ? 'bg-emerald-100 text-emerald-700' :
                          row.status === 'معلقة' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
