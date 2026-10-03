import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, PieChart, TrendingUp, BarChart3, Calculator, Download, Search, Layers, FileSpreadsheet } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export interface JournalEntryLine {
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id?: string;
  referenceId: string;
  date: string;
  type: string;
  description: string;
  totalAmount: number;
  entries: JournalEntryLine[];
}

export interface ChartOfAccount {
  code: string;
  name: string;
  type: 'أصول' | 'خصوم' | 'إيرادات' | 'مصروفات';
  balance: number;
}

const getJournalEntries = async (): Promise<{ success: boolean; data?: (JournalEntry & { id: string })[]; error?: any }> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'journal_entries'));
    const entries: (JournalEntry & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() } as JournalEntry & { id: string });
    });
    return { success: true, data: entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
  } catch (error) {
    console.error("Error getting journal entries: ", error);
    return { success: false, error };
  }
};

const computeTrialBalance = async (): Promise<{ success: boolean; data?: ChartOfAccount[]; error?: any }> => {
  const res = await getJournalEntries();
  if (!res.success || !res.data) return { success: false, data: [] };

  const accountsMap = new Map<string, ChartOfAccount>();

  const baseAccounts: ChartOfAccount[] = [
    { code: '1001', name: 'الصندوق', type: 'أصول', balance: 0 },
    { code: '1002', name: 'البنك', type: 'أصول', balance: 0 },
    { code: '1003', name: 'عهد الموظفين', type: 'أصول', balance: 0 },
    { code: '1004', name: 'سلف الموظفين', type: 'أصول', balance: 0 },
    { code: '1005', name: 'المخزون', type: 'أصول', balance: 0 },
    { code: '2001', name: 'ضريبة القيمة المضافة المستحقة', type: 'خصوم', balance: 0 },
    { code: '2002', name: 'الموردين (ذمم دائنة)', type: 'خصوم', balance: 0 },
    { code: '3001', name: 'إيرادات المبيعات', type: 'إيرادات', balance: 0 },
    { code: '3002', name: 'إيرادات أخرى (استقطاعات)', type: 'إيرادات', balance: 0 },
    { code: '4001', name: 'مصروفات الرواتب والأجور', type: 'مصروفات', balance: 0 },
    { code: '4002', name: 'تكلفة البضاعة المباعة', type: 'مصروفات', balance: 0 },
  ];

  baseAccounts.forEach(acc => accountsMap.set(acc.name, acc));

  res.data.forEach(entry => {
    entry.entries.forEach(line => {
      let acc = accountsMap.get(line.accountName);
      if (!acc) {
        acc = { code: `9999-${Math.floor(Math.random()*1000)}`, name: line.accountName, type: 'مصروفات', balance: 0 };
        accountsMap.set(line.accountName, acc);
      }
      
      if (acc.type === 'أصول' || acc.type === 'مصروفات') {
        acc.balance += line.debit;
        acc.balance -= line.credit;
      } else {
        acc.balance += line.credit;
        acc.balance -= line.debit;
      }
    });
  });

  return { success: true, data: Array.from(accountsMap.values()) };
};

const AccountingModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'لوحة التقارير المركزية' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const tabs = ['لوحة التقارير المركزية', 'شجرة الحسابات', 'الدفاتر المحاسبية', 'ميزان المراجعة'];

  const showNotification = (message: string, type: 'success' | 'error') => {
  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, []);

    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    // Empty dependency array ensures it loads once on mount, preventing flicker.
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    setIsLoading(true);
    try {
      const [journalRes, trialRes] = await Promise.all([
        getJournalEntries(),
        computeTrialBalance()
      ]);
      
      if (journalRes.success && journalRes.data) {
        setJournalEntries(journalRes.data);
      }
      
      if (trialRes.success && trialRes.data) {
        setAccounts(trialRes.data);
      }
    } catch (error) {
      showNotification('حدث خطأ أثناء جلب البيانات المحاسبية', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute summary metrics for reports
  const totalAssets = accounts.filter(a => a.type === 'أصول').reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'خصوم').reduce((s, a) => s + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'إيرادات').reduce((s, a) => s + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === 'مصروفات').reduce((s, a) => s + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  const vatPayable = accounts.find(a => a.name === 'ضريبة القيمة المضافة المستحقة')?.balance || 0;

  return (
    <div className="p-8 space-y-6 relative">
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-xl shadow-lg z-50 text-white font-bold animate-fade-in-down ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {notification.message}
        </div>
      )}

      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-600 border border-slate-200'
            }`}
          >
            {tab === 'لوحة التقارير المركزية' && <PieChart size={18} />}
            {tab === 'شجرة الحسابات' && <Layers size={18} />}
            {tab === 'الدفاتر المحاسبية' && <BookOpen size={18} />}
            {tab === 'ميزان المراجعة' && <Calculator size={18} />}
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {activeTab === 'لوحة التقارير المركزية' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Financial Summary Cards */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-500 text-sm font-bold mb-1">إجمالي الأصول</p>
                      <h3 className="text-2xl font-bold text-emerald-600">{totalAssets.toFixed(2)} SAR</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
                  </div>
                  <div className="text-xs text-slate-400">بناءً على شجرة الحسابات</div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-500 text-sm font-bold mb-1">إجمالي الخصوم</p>
                      <h3 className="text-2xl font-bold text-rose-600">{totalLiabilities.toFixed(2)} SAR</h3>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><BarChart3 size={24} /></div>
                  </div>
                  <div className="text-xs text-slate-400">الالتزامات والضرائب</div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-500 text-sm font-bold mb-1">إجمالي الإيرادات</p>
                      <h3 className="text-2xl font-bold text-blue-600">{totalRevenue.toFixed(2)} SAR</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><FileSpreadsheet size={24} /></div>
                  </div>
                  <div className="text-xs text-slate-400">المبيعات التشغيلية</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-500 text-sm font-bold mb-1">صافي الدخل / الربح</p>
                      <h3 className={`text-2xl font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{netIncome.toFixed(2)} SAR</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${netIncome >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Calculator size={24} /></div>
                  </div>
                  <div className="text-xs text-slate-400">الإيرادات - المصروفات</div>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'تقرير المبيعات والأرباح', desc: 'تحليل شامل للمبيعات وهوامش الربح', icon: <TrendingUp size={28} /> },
                  { title: 'تقرير المشتريات والموردين', desc: 'فواتير المشتريات والمدفوعات', icon: <FileText size={28} /> },
                  { title: 'الإقرار الضريبي (VAT)', desc: `الضريبة المستحقة: ${vatPayable.toFixed(2)} SAR`, icon: <Calculator size={28} /> },
                  { title: 'دفتر الأستاذ العام', desc: 'حركات الحسابات التفصيلية', icon: <BookOpen size={28} /> },
                  { title: 'تقارير رواتب الموظفين', desc: 'مسيرات الرواتب والسلف المعتمدة', icon: <FileSpreadsheet size={28} /> },
                  { title: 'قائمة المركز المالي', desc: 'الميزانية العمومية للمنشأة', icon: <PieChart size={28} /> },
                ].map((report, idx) => (
                  <div key={idx} onClick={() => setActiveModal(report.title)} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex items-start gap-4">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {report.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">{report.title}</h4>
                      <p className="text-sm text-slate-500">{report.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'شجرة الحسابات' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Layers className="text-emerald-600" />
                  الدليل المحاسبي (Chart of Accounts)
                </h3>
                <div className="relative w-64">
                  <input type="text" placeholder="بحث في الحسابات..." className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {['أصول', 'خصوم', 'إيرادات', 'مصروفات'].map(type => (
                    <div key={type} className="space-y-4">
                      <h4 className="font-bold text-slate-700 bg-slate-100 p-3 rounded-lg text-center border border-slate-200">
                        {type}
                      </h4>
                      <div className="space-y-2">
                        {accounts.filter(a => a.type === type).map(acc => (
                          <div key={acc.code} className="p-3 border border-slate-100 rounded-lg bg-white hover:border-emerald-200 transition-colors shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-800 text-sm">{acc.name}</span>
                              <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{acc.code}</span>
                            </div>
                            <div className="text-left font-mono font-bold text-emerald-700">
                              {acc.balance.toFixed(2)} SAR
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'الدفاتر المحاسبية' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
               <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <BookOpen className="text-emerald-600" />
                  دفتر اليومية العامة (Journal Entries)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-4 font-bold">التاريخ</th>
                      <th className="p-4 font-bold">النوع</th>
                      <th className="p-4 font-bold">البيان</th>
                      <th className="p-4 font-bold">الحساب</th>
                      <th className="p-4 font-bold text-center">مدين</th>
                      <th className="p-4 font-bold text-center">دائن</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.map(entry => (
                      <React.Fragment key={entry.id}>
                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                          <td className="p-3 text-slate-500 font-mono" rowSpan={entry.entries.length}>{new Date(entry.date).toLocaleString('ar-SA')}</td>
                          <td className="p-3 font-bold text-emerald-700" rowSpan={entry.entries.length}>{entry.type}</td>
                          <td className="p-3 text-slate-700" rowSpan={entry.entries.length}>{entry.description}</td>
                          <td className="p-3 font-bold text-slate-800">{entry.entries[0].accountName}</td>
                          <td className="p-3 text-center font-mono font-bold">{entry.entries[0].debit > 0 ? entry.entries[0].debit.toFixed(2) : '-'}</td>
                          <td className="p-3 text-center font-mono font-bold">{entry.entries[0].credit > 0 ? entry.entries[0].credit.toFixed(2) : '-'}</td>
                        </tr>
                        {entry.entries.slice(1).map((line, idx) => (
                          <tr key={idx} className="bg-white border-b border-slate-100">
                            <td className="p-3 font-bold text-slate-800">{line.accountName}</td>
                            <td className="p-3 text-center font-mono font-bold">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
                            <td className="p-3 text-center font-mono font-bold">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    {journalEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد قيود محاسبية مسجلة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ميزان المراجعة' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <Calculator className="text-emerald-600" />
                  ميزان المراجعة (Trial Balance)
                </h3>
                <button onClick={() => setActiveModal('تصدير ميزان المراجعة PDF')} className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-2 text-sm">
                  <Download size={16} /> تصدير PDF
                </button>
              </div>
              <div className="overflow-x-auto p-6">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="p-4 rounded-tr-xl">رقم الحساب</th>
                      <th className="p-4">اسم الحساب</th>
                      <th className="p-4">النوع</th>
                      <th className="p-4 text-center">أرصدة مدينة</th>
                      <th className="p-4 text-center rounded-tl-xl">أرصدة دائنة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map(acc => {
                      const isDebit = acc.type === 'أصول' || acc.type === 'مصروفات';
                      const balance = Math.abs(acc.balance);
                      
                      return (
                        <tr key={acc.code} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-4 font-mono text-slate-500">{acc.code}</td>
                          <td className="p-4 font-bold text-slate-800">{acc.name}</td>
                          <td className="p-4 text-slate-500">{acc.type}</td>
                          <td className="p-4 text-center font-mono font-bold text-emerald-700">
                            {isDebit && balance > 0 ? balance.toFixed(2) : '-'}
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-rose-700">
                            {!isDebit && balance > 0 ? balance.toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-800">
                    <tr>
                      <td colSpan={3} className="p-4 text-left">الإجمالي المطابق (SAR):</td>
                      <td className="p-4 text-center font-mono text-lg text-emerald-700">
                        {accounts.filter(a => a.type === 'أصول' || a.type === 'مصروفات').reduce((s, a) => s + Math.abs(a.balance), 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-center font-mono text-lg text-rose-700">
                        {accounts.filter(a => a.type === 'خصوم' || a.type === 'إيرادات').reduce((s, a) => s + Math.abs(a.balance), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{activeModal}</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <Calculator size={24} />
              </button>
            </div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">جاري تجهيز الشاشة</h3>
              <p className="text-slate-500">سيتم تفعيل نافذة "{activeModal}" للعمل بالكامل في التحديث القادم.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
              <button onClick={() => setActiveModal(null)} className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors w-full">
                حسناً، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingModule;
