import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, X, Save, RefreshCw, Users, Calculator, FileText } from 'lucide-react';

const HRModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'الموظفين' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [pettyCash, setPettyCash] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [modals, setModals] = useState({ employee: false, payroll: false, pettyCash: false });

  // Forms
  const [employeeForm, setEmployeeForm] = useState({ name: '', branchId: '', position: '', basicSalary: 0, joinDate: '', phone: '' });
  const [payrollForm, setPayrollForm] = useState({ employeeId: '', month: '', basicSalary: 0, bonus: 0, deduction: 0, advance: 0, netSalary: 0, branchId: '' });
  const [pettyCashForm, setPettyCashForm] = useState({ employeeId: '', date: '', amount: 0, reason: '', branchId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const getCol = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      };
      const [emp, b, p, pc] = await Promise.all([
        getCol('employees'), getCol('branches'), getCol('payrolls'), getCol('petty_cash')
      ]);
      setEmployees(emp);
      setBranches(b);
      setPayrolls(p);
      setPettyCash(pc);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); 

  const handleSaveEmployee = async () => {
    setSaving(true);
    try {
      if(!employeeForm.name || !employeeForm.branchId) throw new Error("الاسم والفرع مطلوبان");
      await addDoc(collection(db, 'employees'), {
        ...employeeForm,
        createdAt: serverTimestamp()
      });
      setModals({...modals, employee: false});
      setEmployeeForm({ name: '', branchId: '', position: '', basicSalary: 0, joinDate: '', phone: '' });
      fetchData();
    } catch(e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const calculateNetSalary = (basic: number, bonus: number, deduction: number, advance: number) => {
    return (Number(basic) || 0) + (Number(bonus) || 0) - (Number(deduction) || 0) - (Number(advance) || 0);
  };

  const handleSavePayroll = async () => {
    setSaving(true);
    try {
      if(!payrollForm.employeeId) throw new Error("يرجى اختيار الموظف");
      const emp = employees.find(e => e.id === payrollForm.employeeId);
      if(!emp) throw new Error("الموظف غير موجود");

      const netSalary = calculateNetSalary(payrollForm.basicSalary, payrollForm.bonus, payrollForm.deduction, payrollForm.advance);

      const prRef = await addDoc(collection(db, 'payrolls'), {
        ...payrollForm,
        netSalary,
        employeeName: emp.name,
        branchId: emp.branchId,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'ledger'), {
        reference: prRef.id,
        type: 'PAYROLL',
        date: new Date().toISOString(),
        branchId: emp.branchId,
        createdAt: serverTimestamp(),
        entries: [
          { account: 'ح/ المصروفات العمومية والإدارية (رواتب وأجور)', debit: netSalary, credit: 0 },
          { account: 'ح/ الصندوق أو البنك', debit: 0, credit: netSalary }
        ]
      });

      setModals({...modals, payroll: false});
      fetchData();
    } catch(e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePettyCash = async () => {
    setSaving(true);
    try {
      if(!pettyCashForm.employeeId || pettyCashForm.amount <= 0) throw new Error("بيانات العهدة غير صحيحة");
      const emp = employees.find(e => e.id === pettyCashForm.employeeId);
      
      const pcRef = await addDoc(collection(db, 'petty_cash'), {
        ...pettyCashForm,
        employeeName: emp?.name,
        branchId: emp?.branchId || pettyCashForm.branchId,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'ledger'), {
        reference: pcRef.id,
        type: 'PETTY_CASH',
        date: pettyCashForm.date || new Date().toISOString(),
        branchId: emp?.branchId || pettyCashForm.branchId,
        createdAt: serverTimestamp(),
        entries: [
          { account: 'ح/ عهد الموظفين', debit: pettyCashForm.amount, credit: 0 },
          { account: 'ح/ الصندوق أو البنك', debit: 0, credit: pettyCashForm.amount }
        ]
      });

      setModals({...modals, pettyCash: false});
      fetchData();
    } catch(e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (type: keyof typeof modals) => {
    setErrorMsg('');
    setModals({...modals, [type]: true});
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {['الموظفين', 'قيود الرواتب', 'العهد النقدية للمناديب', 'الحضور'].map(tab => (
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

      {!loading && activeTab === 'الموظفين' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users /> ملفات الموظفين</h3>
            <button onClick={() => openModal('employee')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
              <Plus size={18} /> إضافة موظف جديد
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                <tr><th className="px-6 py-4 font-bold">الموظف</th><th className="px-6 py-4 font-bold">المنصب</th><th className="px-6 py-4 font-bold">الفرع</th><th className="px-6 py-4 font-bold">الراتب الأساسي</th><th className="px-6 py-4 font-bold">تاريخ الانضمام</th></tr>
              </thead>
              <tbody>
                {employees.map((e, i) => {
                  const bName = branches.find(b => b.id === e.branchId)?.name || e.branchId;
                  return (
                  <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{e.name}</td>
                    <td className="px-6 py-4">{e.position}</td>
                    <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">{bName}</span></td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{e.basicSalary} ر.س</td>
                    <td className="px-6 py-4">{e.joinDate}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'قيود الرواتب' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Calculator /> مسيرات الرواتب التلقائية</h3>
            <button onClick={() => openModal('payroll')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
              <Plus size={18} /> إنشاء قيد راتب
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                <tr><th className="px-6 py-4 font-bold">الموظف</th><th className="px-6 py-4 font-bold">الشهر</th><th className="px-6 py-4 font-bold">الراتب الأساسي</th><th className="px-6 py-4 font-bold">المكافآت/الخصومات</th><th className="px-6 py-4 font-bold">الصافي للدفع</th></tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.employeeName}</td>
                    <td className="px-6 py-4">{p.month}</td>
                    <td className="px-6 py-4">{p.basicSalary} ر.س</td>
                    <td className="px-6 py-4"><span className="text-emerald-500">+{p.bonus || 0}</span> / <span className="text-rose-500">-{p.deduction || 0}</span></td>
                    <td className="px-6 py-4 font-bold text-slate-800">{p.netSalary} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'العهد النقدية للمناديب' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText /> العهد النقدية</h3>
            <button onClick={() => openModal('pettyCash')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
              <Plus size={18} /> صرف عهدة
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                <tr><th className="px-6 py-4 font-bold">تاريخ الصرف</th><th className="px-6 py-4 font-bold">المندوب (الموظف)</th><th className="px-6 py-4 font-bold">البيان</th><th className="px-6 py-4 font-bold">المبلغ</th></tr>
              </thead>
              <tbody>
                {pettyCash.map((pc, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">{pc.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{pc.employeeName}</td>
                    <td className="px-6 py-4">{pc.reason}</td>
                    <td className="px-6 py-4 font-bold text-amber-600">{pc.amount} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modals.employee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-emerald-800">إضافة موظف جديد</h3>
              <button onClick={() => setModals({...modals, employee: false})} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
              <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم الموظف</label><input type="text" value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الفرع التابع له</label>
                <select value={employeeForm.branchId} onChange={e => setEmployeeForm({...employeeForm, branchId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                  <option value="">اختر الفرع...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">المسمى الوظيفي</label><input type="text" value={employeeForm.position} onChange={e => setEmployeeForm({...employeeForm, position: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الراتب الأساسي</label><input type="number" value={employeeForm.basicSalary} onChange={e => setEmployeeForm({...employeeForm, basicSalary: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModals({...modals, employee: false})} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
              <button onClick={handleSaveEmployee} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ بيانات الموظف
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.payroll && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-emerald-800">إصدار مسير راتب وقيود</h3>
              <button onClick={() => setModals({...modals, payroll: false})} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اختر الموظف</label>
                <select value={payrollForm.employeeId} onChange={e => {
                  const emp = employees.find(x => x.id === e.target.value);
                  setPayrollForm({...payrollForm, employeeId: e.target.value, basicSalary: emp ? emp.basicSalary : 0});
                }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">شهر الاستحقاق</label><input type="month" value={payrollForm.month} onChange={e => setPayrollForm({...payrollForm, month: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-emerald-700 mb-1">الراتب الأساسي</label><input type="number" readOnly value={payrollForm.basicSalary} className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold" /></div>
                <div><label className="block text-sm font-bold text-emerald-700 mb-1">المكافآت (بدلات)</label><input type="number" value={payrollForm.bonus} onChange={e => setPayrollForm({...payrollForm, bonus: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-rose-700 mb-1">خصومات / غياب</label><input type="number" value={payrollForm.deduction} onChange={e => setPayrollForm({...payrollForm, deduction: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block text-sm font-bold text-rose-700 mb-1">سلف / قروض</label><input type="number" value={payrollForm.advance} onChange={e => setPayrollForm({...payrollForm, advance: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              </div>
              <div className="bg-slate-100 p-4 rounded-xl text-center">
                <span className="block text-sm text-slate-500 mb-1">الصافي المستحق للدفع</span>
                <span className="text-3xl font-black text-emerald-600">{calculateNetSalary(payrollForm.basicSalary, payrollForm.bonus, payrollForm.deduction, payrollForm.advance)} ر.س</span>
              </div>
              <p className="text-xs text-slate-500 text-center">* بمجرد الحفظ سيتم توليد قيد مصروفات الرواتب وسحب المبلغ من الصندوق تلقائياً.</p>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModals({...modals, payroll: false})} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
              <button onClick={handleSavePayroll} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ وتوليد القيد
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.pettyCash && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-emerald-800">تسجيل عهدة نقدية</h3>
              <button onClick={() => setModals({...modals, pettyCash: false})} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">المندوب / المستلم</label>
                <select value={pettyCashForm.employeeId} onChange={e => setPettyCashForm({...pettyCashForm, employeeId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الصرف</label><input type="date" value={pettyCashForm.date} onChange={e => setPettyCashForm({...pettyCashForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">مبلغ العهدة</label><input type="number" value={pettyCashForm.amount} onChange={e => setPettyCashForm({...pettyCashForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">البيان / الغرض من العهدة</label><input type="text" value={pettyCashForm.reason} onChange={e => setPettyCashForm({...pettyCashForm, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModals({...modals, pettyCash: false})} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
              <button onClick={handleSavePettyCash} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} اعتماد العهدة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRModule;
