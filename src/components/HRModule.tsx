import React, { useState, useEffect } from 'react';
import { Users, Clock, Wallet, FileBarChart, UserPlus, Save, Search, FileText, CheckCircle, Plus } from 'lucide-react';
import { 
  addEmployee, 
  getEmployees, 
  type EmployeeData, 
  processCustody, 
  getCustodies, 
  type CustodyData,
  processPayroll,
  type PayrollData,
  type PayrollEntry
} from '../lib/firestoreUtils';

const HRModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'ملفات الموظفين' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Employees State
  const [employees, setEmployees] = useState<(EmployeeData & { id: string })[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [empForm, setEmpForm] = useState<Omit<EmployeeData, 'id'>>({
    empId: '',
    fullName: '',
    nationalId: '',
    nationality: 'سعودي',
    jobTitle: '',
    branch: 'الفرع الرئيسي',
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    createdAt: ''
  });

  // Custody State
  const [custodies, setCustodies] = useState<(CustodyData & { id: string })[]>([]);
  const [custodyForm, setCustodyForm] = useState<Omit<CustodyData, 'id'>>({
    employeeId: '',
    employeeName: '',
    type: 'سلفة',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'نشطة'
  });

  // Payroll State
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0,7));
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);

  // UI State
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = ['ملفات الموظفين', 'الحضور والانصراف', 'العهد النقدية', 'مسيرات الرواتب'];

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (activeTab === 'ملفات الموظفين' || activeTab === 'مسيرات الرواتب') fetchEmployees();
    if (activeTab === 'العهد النقدية') {
      fetchEmployees();
      fetchCustodies();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    const res = await getEmployees();
    if (res.success && res.data) setEmployees(res.data);
  };

  const fetchCustodies = async () => {
    const res = await getCustodies();
    if (res.success && res.data) setCustodies(res.data);
  };

  // ---------------- EMPLOYEES LOGIC ----------------
  const handleEmpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmpForm(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handleSaveEmployee = async () => {
    setIsLoading(true);
    const result = await addEmployee({ ...empForm, createdAt: new Date().toISOString() });
    if (result.success) {
      showNotification('تم حفظ بيانات الموظف بنجاح', 'success');
      setEmpForm({
        empId: '', fullName: '', nationalId: '', nationality: 'سعودي', jobTitle: '', branch: 'الفرع الرئيسي', basicSalary: 0, housingAllowance: 0, transportAllowance: 0, createdAt: ''
      });
      fetchEmployees();
    } else {
      showNotification('خطأ أثناء الحفظ', 'error');
    }
    setIsLoading(false);
  };

  // ---------------- CUSTODY LOGIC ----------------
  const handleCustodyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'employeeId') {
      const emp = employees.find(emp => emp.id === value);
      setCustodyForm(prev => ({ ...prev, employeeId: value, employeeName: emp ? emp.fullName : '' }));
    } else {
      setCustodyForm(prev => ({ ...prev, [name]: e.target.type === 'number' ? Number(value) : value }));
    }
  };

  const handleSaveCustody = async () => {
    if (!custodyForm.employeeId || custodyForm.amount <= 0) {
      showNotification('الرجاء التأكد من اختيار الموظف وإدخال مبلغ صحيح', 'error');
      return;
    }
    setIsLoading(true);
    const result = await processCustody(custodyForm);
    if (result.success) {
      showNotification(`تم صرف ال${custodyForm.type} وتوليد القيد المحاسبي بنجاح`, 'success');
      setCustodyForm({ ...custodyForm, amount: 0, description: '' });
      fetchCustodies();
    } else {
      showNotification('خطأ أثناء الصرف', 'error');
    }
    setIsLoading(false);
  };

  // ---------------- PAYROLL LOGIC ----------------
  const generatePayrollDraft = () => {
    const entries: PayrollEntry[] = employees.map(emp => {
      // Find active advances for this employee to deduct
      const activeAdvances = custodies.filter(c => c.employeeId === emp.id && c.type === 'سلفة' && c.status === 'نشطة');
      const totalAdvancesToDeduct = activeAdvances.reduce((sum, c) => sum + c.amount, 0);

      const allowances = emp.housingAllowance + emp.transportAllowance;
      const netPay = emp.basicSalary + allowances - totalAdvancesToDeduct;

      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        basicSalary: emp.basicSalary,
        allowances,
        bonus: 0,
        deductions: 0,
        advancesDeduction: totalAdvancesToDeduct,
        netPay
      };
    });
    setPayrollEntries(entries);
  };

  const handleApprovePayroll = async () => {
    if (payrollEntries.length === 0) return;
    setIsLoading(true);
    
    const payrollData: Omit<PayrollData, 'id'> = {
      month: payrollMonth,
      status: 'مسودة',
      totalBasic: payrollEntries.reduce((s, e) => s + e.basicSalary, 0),
      totalAllowances: payrollEntries.reduce((s, e) => s + e.allowances, 0),
      totalBonus: payrollEntries.reduce((s, e) => s + e.bonus, 0),
      totalDeductions: payrollEntries.reduce((s, e) => s + e.deductions, 0),
      totalAdvances: payrollEntries.reduce((s, e) => s + e.advancesDeduction, 0),
      netTotal: payrollEntries.reduce((s, e) => s + e.netPay, 0),
      entries: payrollEntries,
      createdAt: new Date().toISOString()
    };

    const result = await processPayroll(payrollData);
    if (result.success) {
      showNotification('تم اعتماد المسير وتوليد قيد الرواتب بنجاح', 'success');
      setPayrollEntries([]);
    } else {
      showNotification('حدث خطأ أثناء الاعتماد', 'error');
    }
    setIsLoading(false);
  };

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
            {tab === 'ملفات الموظفين' && <Users size={18} />}
            {tab === 'الحضور والانصراف' && <Clock size={18} />}
            {tab === 'العهد النقدية' && <Wallet size={18} />}
            {tab === 'مسيرات الرواتب' && <FileBarChart size={18} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'ملفات الموظفين' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">قائمة الموظفين</h3>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => setSelectedEmployee(emp)}
                  className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedEmployee?.id === emp.id ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : ''}`}
                >
                  <div className="font-bold text-slate-800 text-sm">{emp.fullName}</div>
                  <div className="text-xs text-slate-500 mt-1">{emp.jobTitle} - {emp.branch}</div>
                </div>
              ))}
              {employees.length === 0 && (
                <div className="p-8 text-center text-slate-400">لا يوجد موظفين مسجلين</div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="text-emerald-600"/> 
                  {selectedEmployee ? `ملف الموظف (${selectedEmployee.fullName})` : 'إضافة موظف جديد'}
                </h3>
                {!selectedEmployee && (
                  <button 
                    onClick={handleSaveEmployee} 
                    disabled={isLoading}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    <Save size={16} /> {isLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الوظيفي</label>
                  <input type="text" name="empId" value={selectedEmployee?.empId || empForm.empId} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono" placeholder="EMP-001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الاسم الكامل</label>
                  <input type="text" name="fullName" value={selectedEmployee?.fullName || empForm.fullName} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهوية / الإقامة</label>
                  <input type="text" name="nationalId" value={selectedEmployee?.nationalId || empForm.nationalId} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الجنسية</label>
                  <input type="text" name="nationality" value={selectedEmployee?.nationality || empForm.nationality} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المسمى الوظيفي</label>
                  <input type="text" name="jobTitle" value={selectedEmployee?.jobTitle || empForm.jobTitle} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الفرع / القسم</label>
                  <select name="branch" value={selectedEmployee?.branch || empForm.branch} onChange={handleEmpChange} disabled={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500">
                    <option>الفرع الرئيسي</option>
                    <option>المستودع</option>
                    <option>فرع المبيعات</option>
                  </select>
                </div>
              </div>

              <h4 className="font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">البيانات المالية (Financial Data)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الراتب الأساسي</label>
                  <input type="number" name="basicSalary" value={selectedEmployee?.basicSalary || empForm.basicSalary || ''} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono text-emerald-700 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">بدل السكن</label>
                  <input type="number" name="housingAllowance" value={selectedEmployee?.housingAllowance || empForm.housingAllowance || ''} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">بدل النقل</label>
                  <input type="number" name="transportAllowance" value={selectedEmployee?.transportAllowance || empForm.transportAllowance || ''} onChange={handleEmpChange} readOnly={!!selectedEmployee} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'الحضور والانصراف' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Clock className="text-emerald-600"/> سجل الحضور والانصراف</h3>
            <div className="flex gap-4 items-center">
              <input type="date" className="p-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-sm" />
              <button onClick={() => setActiveModal('استيراد من البصمة')} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm">
                استيراد من البصمة
              </button>
            </div>
          </div>

          <div className="border-4 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <Clock size={64} className="text-slate-300 mb-4" />
            <h4 className="text-xl font-bold text-slate-600 mb-2">نظام البصمة قيد التجهيز</h4>
            <p className="text-slate-400">سيتم ربط هذا الموديول لاحقاً مع أجهزة البصمة (ZKTeco).</p>
          </div>
        </div>
      )}

      {activeTab === 'العهد النقدية' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Wallet className="text-amber-600"/> صرف عهدة / سلفة جديدة
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الموظف</label>
                <select name="employeeId" value={custodyForm.employeeId} onChange={handleCustodyChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500">
                  <option value="">اختر الموظف...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">نوع العملية</label>
                  <select name="type" value={custodyForm.type} onChange={handleCustodyChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500">
                    <option value="سلفة">سلفة على الراتب</option>
                    <option value="عهدة">عهدة نقدية (للمشتريات)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ (SAR)</label>
                  <input type="number" name="amount" value={custodyForm.amount || ''} onChange={handleCustodyChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500 font-mono text-lg font-bold text-amber-700" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">البيان (سبب الصرف)</label>
                <input type="text" name="description" value={custodyForm.description} onChange={handleCustodyChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-500" placeholder="مثال: سلفة طارئة" />
              </div>
              
              <button 
                onClick={handleSaveCustody}
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                <Save size={18} /> {isLoading ? 'جاري التنفيذ...' : 'حفظ وتوليد سند صرف وقيد محاسبي'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <FileText className="text-indigo-600"/> أرصدة السلف والعهد المفتوحة
            </h3>
            
            <div className="space-y-4 overflow-y-auto max-h-[300px] custom-scrollbar">
              {custodies.filter(c => c.status === 'نشطة').map(c => (
                <div key={c.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center bg-slate-50">
                  <div>
                    <div className="font-bold text-slate-800">{c.employeeName}</div>
                    <div className="text-xs text-slate-500 mt-1">{c.type}: {c.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-xl font-bold ${c.type === 'سلفة' ? 'text-rose-600' : 'text-amber-600'}`}>
                      {c.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-bold">التاريخ: {c.date}</div>
                  </div>
                </div>
              ))}
              {custodies.filter(c => c.status === 'نشطة').length === 0 && (
                <div className="text-center text-slate-400 py-8">لا توجد عهد أو سلف نشطة.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'مسيرات الرواتب' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">مسير رواتب شهر ({payrollMonth})</h3>
              <p className="text-sm text-slate-500">سيتم استقطاع السلف النشطة تلقائياً.</p>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1">اختر الشهر</label>
                <input type="month" value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} className="p-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-sm" />
              </div>
              <button 
                onClick={generatePayrollDraft}
                className="self-end px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors text-sm"
              >
                إنشاء المسودة
              </button>
            </div>
          </div>

          {payrollEntries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-4 font-bold">الموظف</th>
                      <th className="p-4 font-bold text-emerald-700">أساسي</th>
                      <th className="p-4 font-bold text-emerald-700">بدلات</th>
                      <th className="p-4 font-bold text-rose-700">استقطاع سلف</th>
                      <th className="p-4 font-bold text-blue-700 text-lg">الصافي للدفع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollEntries.map(entry => (
                      <tr key={entry.employeeId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{entry.employeeName}</td>
                        <td className="p-4 font-mono">{entry.basicSalary.toFixed(2)}</td>
                        <td className="p-4 font-mono">{entry.allowances.toFixed(2)}</td>
                        <td className="p-4 font-mono text-rose-600 font-bold">{entry.advancesDeduction.toFixed(2)}</td>
                        <td className="p-4 font-mono text-blue-700 font-bold text-base bg-blue-50">{entry.netPay.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-800 text-white font-bold">
                    <tr>
                      <td className="p-4">الإجمالي (SAR)</td>
                      <td className="p-4 font-mono">{payrollEntries.reduce((s, e) => s + e.basicSalary, 0).toFixed(2)}</td>
                      <td className="p-4 font-mono">{payrollEntries.reduce((s, e) => s + e.allowances, 0).toFixed(2)}</td>
                      <td className="p-4 font-mono text-rose-400">{payrollEntries.reduce((s, e) => s + e.advancesDeduction, 0).toFixed(2)}</td>
                      <td className="p-4 font-mono text-blue-300 text-xl">{payrollEntries.reduce((s, e) => s + e.netPay, 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                <button 
                  onClick={handleApprovePayroll}
                  disabled={isLoading}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-70"
                >
                  <CheckCircle size={20} />
                  {isLoading ? 'جاري الاعتماد...' : 'اعتماد المسير وتوليد قيد الرواتب والأجور'}
                </button>
              </div>
            </div>
          )}
          {payrollEntries.length === 0 && (
            <div className="border-4 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white">
              <FileBarChart size={64} className="text-slate-300 mb-4" />
              <h4 className="text-xl font-bold text-slate-600 mb-2">لا يوجد مسودة مسير</h4>
              <p className="text-slate-400">انقر على "إنشاء المسودة" لاحتساب الرواتب لهذا الشهر.</p>
            </div>
          )}
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{activeModal}</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <CheckCircle size={24} />
              </button>
            </div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
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

export default HRModule;
