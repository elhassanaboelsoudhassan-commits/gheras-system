import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, X, Save, RefreshCw, Receipt } from 'lucide-react';

const PurchasesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'المصروفات النقدية' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [modals, setModals] = useState({ expense: false });
  const [expenseForm, setExpenseForm] = useState({ date: '', beneficiary: '', amount: 0, reason: '', branchId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const [eSnap, bSnap] = await Promise.all([
        getDocs(collection(db, 'expenses')),
        getDocs(collection(db, 'branches'))
      ]);
      setExpenses(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Firestore fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveExpense = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      if (expenseForm.amount <= 0) throw new Error("المبلغ غير صحيح");
      if (!expenseForm.branchId) throw new Error("يجب تحديد الفرع (المخزن)");

      // Create Voucher
      const expenseRef = await addDoc(collection(db, 'expenses'), {
        ...expenseForm,
        createdAt: serverTimestamp()
      });

      // Double Entry System
      await addDoc(collection(db, 'ledger'), {
        reference: expenseRef.id,
        type: 'EXPENSE_VOUCHER',
        date: expenseForm.date || new Date().toISOString(),
        branchId: expenseForm.branchId,
        createdAt: serverTimestamp(),
        entries: [
          { account: 'ح/ المصروفات (' + expenseForm.reason + ')', debit: expenseForm.amount, credit: 0 },
          { account: 'ح/ الصندوق أو البنك', debit: 0, credit: expenseForm.amount }
        ]
      });

      setModals({ ...modals, expense: false });
      setExpenseForm({ date: '', beneficiary: '', amount: 0, reason: '', branchId: '' });
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {['قائمة الموردين', 'المصروفات النقدية'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-600 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center items-center py-20"><RefreshCw className="animate-spin text-emerald-500" size={40} /></div>}

      {!loading && activeTab === 'المصروفات النقدية' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Receipt /> سندات الصرف (مصروفات)</h3>
            <button onClick={() => setModals({ ...modals, expense: true })} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
              <Plus size={18} /> إصدار سند صرف
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                <tr><th className="px-6 py-4 font-bold">التاريخ</th><th className="px-6 py-4 font-bold">المستفيد</th><th className="px-6 py-4 font-bold">البيان</th><th className="px-6 py-4 font-bold">المبلغ</th><th className="px-6 py-4 font-bold">الفرع</th></tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => {
                  const branchName = branches.find(b => b.id === e.branchId)?.name || e.branchId;
                  return (
                  <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{e.date}</td>
                    <td className="px-6 py-4">{e.beneficiary}</td>
                    <td className="px-6 py-4">{e.reason}</td>
                    <td className="px-6 py-4 font-bold text-rose-600">{e.amount} ر.س</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">{branchName}</span></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modals.expense && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-emerald-800">إصدار سند صرف (مصروف نثري/مورد)</h3>
              <button onClick={() => setModals({ ...modals, expense: false })} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
              <div><label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label><input type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">المستفيد (المورد / الموظف)</label><input type="text" value={expenseForm.beneficiary} onChange={e => setExpenseForm({...expenseForm, beneficiary: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">بيان الصرف</label><input type="text" value={expenseForm.reason} onChange={e => setExpenseForm({...expenseForm, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ (ر.س)</label><input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الفرع (المخزن) المسحوب منه</label>
                <select value={expenseForm.branchId} onChange={e => setExpenseForm({...expenseForm, branchId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                  <option value="">اختر الفرع...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModals({ ...modals, expense: false })} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
              <button onClick={handleSaveExpense} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ السند وتوليد القيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesModule;
