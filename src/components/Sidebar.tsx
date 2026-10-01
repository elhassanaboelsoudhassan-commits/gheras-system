import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Calculator, 
  Users, 
  Settings, 
  ChevronDown,
  LogOut,
  Search,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const getSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: true, data: { companyNameAr: 'مشاتل غصن يميس' } };
  } catch (error) {
    return { success: false, error };
  }
};

const navItems = [
  { id: 'sales', label: 'المبيعات', icon: ShoppingCart, subItems: ['العمليات', 'نقطة البيع السريع (POS)', 'مرتجع المبيعات', 'عروض الأسعار'] },
  { id: 'purchases', label: 'المشتريات', icon: Package, subItems: ['فاتورة المشتريات', 'دورة المشتريات', 'بطاقة المورد'] },
  { id: 'inventory', label: 'المخازن', icon: LayoutDashboard, subItems: ['المستودعات', 'الأصناف', 'حركة المخزون'] },
  { id: 'accounting', label: 'المحاسبة', icon: Calculator, subItems: ['شجرة الحسابات', 'القيود اليومية', 'سندات القبض والصرف', 'التقارير المالية'] },
  { id: 'hr', label: 'الموارد البشرية', icon: Users, subItems: ['ملفات الموظفين', 'الحضور والانصراف', 'العهد النقدية', 'مسيرات الرواتب'] },
  { id: 'settings', label: 'الإعدادات', icon: Settings, subItems: ['الإعدادات العامة', 'إدارة المستخدمين', 'النسخ الاحتياطي'] },
];

const Sidebar: React.FC<{ onNavigate?: (module: string, tab?: string) => void }> = ({ onNavigate }) => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('مشاتل غصن يميس');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await getSettings();
      if (res.success && res.data && res.data.companyNameAr) {
        setCompanyName(res.data.companyNameAr);
      }
    };
    fetchSettings();
  }, []);

  const user = JSON.parse(localStorage.getItem('gheras_admin') || '{}');
  const isAdmin = user.email === 'elhassanelsoudy@gmail.com';

  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'settings' && !isAdmin) return false;
    return true;
  });

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleLogout = () => {
    localStorage.removeItem('gheras_admin');
    navigate('/');
  };

  return (
    <aside className="w-[290px] bg-slate-900 text-slate-300 h-screen flex flex-col shadow-2xl transition-all duration-300 flex-shrink-0">
      {/* Brand area */}
      <div className="h-20 flex items-center gap-4 px-6 border-b border-slate-800 bg-slate-950/50">
        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
          <span className="text-2xl">🌱</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">غِراس ERP</h1>
          <p className="text-xs text-emerald-400 mt-1">{companyName}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4">
        <div className="relative">
          <input 
            type="text"
            placeholder="بحث سريع..."
            className="w-full bg-slate-800 text-sm text-slate-200 placeholder-slate-400 rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-700"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {filteredNavItems.map((item) => {
          const isOpen = openAccordion === item.id;
          const Icon = item.icon;
          
          return (
            <div key={item.id} className="mb-2">
              <button
                onClick={() => toggleAccordion(item.id)}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all ${
                  isOpen ? 'bg-emerald-600/10 text-emerald-400' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isOpen ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : 'text-slate-500'}`} 
                />
              </button>
              
              {/* Sub items */}
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  isOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pr-12 pl-4 py-2 space-y-1 border-r border-slate-800 mr-6">
                  {item.subItems.map((sub, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate(item.id, sub);
                        }
                      }}
                      className="w-full text-right py-2 text-sm text-slate-400 hover:text-emerald-400 hover:translate-x-1 transition-all flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User area & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="bg-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold shadow-lg">
              HS
            </div>
            <div>
              <p className="text-sm font-semibold text-white">حسن السعودي</p>
              <p className="text-xs text-slate-400">المدير العام</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
