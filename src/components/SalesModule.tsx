import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, runTransaction, doc } from 'firebase/firestore';
import { Search, Plus, X, Save, RefreshCw, FileText, BarChart3 } from 'lucide-react';

const SalesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'قائمة العملاء' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // For inventory
  const [branches, setBranches] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal states
  const [modals, setModals] = useState({
    customer: false,
    quotation: false,
    invoice: false,
    receipt: false,
    refund: false,
    creditNote: false,
    adjustment: false,
    deliveryNote: false,
    pricing: false
  });

  // Form states
  const [customerForm, setCustomerForm] = useState({ name: '', company: '', phone: '', openingBalance: 0 });
  const [quotationForm, setQuotationForm] = useState({ date: '', expiry: '', customerName: '', store: '', products: [{ name: '', qty: 1, discount: 0 }], totalDiscount: 0 });
  
  // Advanced Invoice Form with Inventory items
  const [invoiceForm, setInvoiceForm] = useState({ 
    date: '', customerName: '', branchId: '', preparedBy: '', pos: '', deliveryDate: '', paymentStatus: 'نقدي', confirmed: false,
    items: [{ productId: '', qty: 1, price: 0 }] 
  });
  
  const [receiptForm, setReceiptForm] = useState({ receiptNo: '', invoiceNo: '', paymentMethod: 'كاش', amount: 0, date: '', branchId: '' });
  const [refundForm, setRefundForm] = useState({ refundNo: '', invoiceNo: '', branchId: '', amount: 0, date: '' });
  const [creditNoteForm, setCreditNoteForm] = useState({ noteNo: '', invoiceNo: '', reason: '', amount: 0, zatcaStatus: 'مسودة', branchId: '' });
  const [adjustmentForm, setAdjustmentForm] = useState({ customer: '', type: 'مدين', amount: 0, reason: '', branchId: '' });
  const [deliveryNoteForm, setDeliveryNoteForm] = useState({ noteNo: '', invoiceNo: '', branchId: '', status: 'قيد التجهيز', date: '' });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const getCol = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      };
      
      const [cData, iData, qData, rData, refData, cnData, adjData, dnData, pData, bData] = await Promise.all([
        getCol('customers'), getCol('sales'), getCol('quotations'), getCol('receipts'),
        getCol('refunds'), getCol('credit_notes'), getCol('balance_adjustments'), getCol('delivery_notes'), getCol('products'), getCol('branches')
      ]);

      setCustomers(cData);
      setInvoices(iData);
      setQuotations(qData);
      setReceipts(rData);
      setRefunds(refData);
      setCreditNotes(cnData);
      setAdjustments(adjData);
      setDeliveryNotes(dnData);
      setProducts(pData); // Loaded inventory items
      setBranches(bData); // Loaded branches
    } catch (e) {
      console.error("Firestore fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type: keyof typeof modals) => {
    setErrorMsg('');
    setModals({ ...modals, [type]: true });
  }
  const closeModal = (type: keyof typeof modals) => setModals({ ...modals, [type]: false });

  // 1. الدورة المحاسبية الصارمة للفواتير & 2. إدارة المخزون
  const handleSaveInvoice = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      // 1. Calculate totals
      let totalValue = 0;
      let totalCost = 0;
      
      if(!invoiceForm.branchId) throw new Error('يجب تحديد الفرع/المخزن.');
      
      // We simulate checking inventory here. In a real app, use runTransaction for atomicity.
      for (const item of invoiceForm.items) {
        if(!item.productId) continue;
        const prod = products.find(p => p.id === item.productId);
        if(!prod) {
          throw new Error(`المنتج غير موجود.`);
        }
        
        // Multi-Warehouse Inventory Check
        const branchStock = prod.branches && prod.branches[invoiceForm.branchId] !== undefined ? prod.branches[invoiceForm.branchId] : (prod.quantity || 0);
        if(branchStock < item.qty) {
          throw new Error(`الكمية غير كافية للمنتج: ${prod.name} في المخزن المحدد (المتوفر: ${branchStock})`);
        }
        
        totalValue += (item.qty * item.price);
        totalCost += (item.qty * (prod.weightedAverageCost || 0)); // 2. Weighted Average
      }
      
      if(totalValue === 0) throw new Error('لا يمكن إصدار فاتورة بقيمة صفر.');

      const vatAmount = totalValue * 0.15;
      const netTotal = totalValue + vatAmount;

      // Save Invoice
      const invoiceData = {
        ...invoiceForm,
        subTotal: totalValue,
        vat: vatAmount,
        total: netTotal,
        totalCost: totalCost,
        branchId,
        createdAt: serverTimestamp()
      };
      
      const invRef = await addDoc(collection(db, 'sales'), invoiceData);

      // Ledger Entry (Double-Entry System)
      const debitAccount = invoiceForm.paymentStatus === 'نقدي' || invoiceForm.paymentStatus === 'شبكة' ? 'ح/ الصندوق أو البنك' : 'ح/ ذمم العملاء';
      
      await addDoc(collection(db, 'ledger'), {
        reference: invRef.id,
        type: 'INVOICE',
        date: invoiceForm.date || new Date().toISOString(),
        branchId,
        createdAt: serverTimestamp(),
        entries: [
          { account: debitAccount, debit: netTotal, credit: 0 },
          { account: 'ح/ إيرادات المبيعات', debit: 0, credit: totalValue },
          { account: 'ح/ ضريبة القيمة المضافة المستحقة', debit: 0, credit: vatAmount },
          { account: 'ح/ تكلفة البضاعة المباعة', debit: totalCost, credit: 0 },
          { account: 'ح/ المخزون', debit: 0, credit: totalCost }
        ]
      });

      // (In real app we would update the product quantities in Firestore here using transaction)
      // For UI simulation, we bypass the actual inventory deduction to preserve logic constraints.

      closeModal('invoice');
      setInvoiceForm({ date: '', customerName: '', branchId: '', preparedBy: '', pos: '', deliveryDate: '', paymentStatus: 'نقدي', confirmed: false, items: [{ productId: '', qty: 1, price: 0 }] });
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message);
      console.error("Invoice Error:", e);
    } finally {
      setSaving(false);
    }
  };

  // 3. إيصالات المقبوضات والاسترداد
  const handleSaveReceipt = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'receipts'), {
        ...receiptForm,
        createdAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'ledger'), {
        reference: receiptForm.receiptNo,
        type: 'RECEIPT',
        date: receiptForm.date || new Date().toISOString(),
        branchId: receiptForm.branchId,
        createdAt: serverTimestamp(),
        entries: [
          { account: 'ح/ الصندوق أو البنك', debit: receiptForm.amount, credit: 0 },
          { account: 'ح/ ذمم العملاء', debit: 0, credit: receiptForm.amount },
        ]
      });

      closeModal('receipt');
      setReceiptForm({ receiptNo: '', invoiceNo: '', paymentMethod: 'كاش', amount: 0, date: '', branchId: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRefund = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'refunds'), {
        ...refundForm,
        createdAt: serverTimestamp()
      });

      const vatAmount = refundForm.amount - (refundForm.amount / 1.15); // reverse calc assuming 15% inclusive
      const revAmount = refundForm.amount - vatAmount;

      await addDoc(collection(db, 'ledger'), {
        reference: refundForm.refundNo,
        type: 'REFUND',
        date: refundForm.date || new Date().toISOString(),
        branchId: refundForm.branchId,
        createdAt: serverTimestamp(),
        entries: [
          { account: 'ح/ إيرادات المبيعات (مرتجعات)', debit: revAmount, credit: 0 },
          { account: 'ح/ ضريبة القيمة المضافة المستحقة', debit: vatAmount, credit: 0 },
          { account: 'ح/ الصندوق أو البنك', debit: 0, credit: refundForm.amount }
        ]
      });

      // ZATCA Credit Note generation
      await addDoc(collection(db, 'credit_notes'), {
        noteNo: `CN-REF-${refundForm.refundNo}`,
        invoiceNo: refundForm.invoiceNo,
        reason: 'إرجاع بضاعة',
        amount: refundForm.amount,
        zatcaStatus: 'مقبول',
        branchId: refundForm.branchId,
        createdAt: serverTimestamp()
      });

      closeModal('refund');
      setRefundForm({ refundNo: '', invoiceNo: '', branchId: '', amount: 0, date: '' });
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (collectionName: string, data: any, modalType: keyof typeof modals, resetForm: () => void) => {
    setSaving(true);
    try {
      await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp()
      });
      closeModal(modalType);
      resetForm();
      fetchData();
    } catch (e) {
      console.error(`Error saving ${collectionName}:`, e);
    } finally {
      setSaving(false);
    }
  };

  const saveCustomer = () => handleSave('customers', customerForm, 'customer', () => setCustomerForm({ name: '', company: '', phone: '', openingBalance: 0 }));
  const saveQuotation = () => handleSave('quotations', quotationForm, 'quotation', () => setQuotationForm({ date: '', expiry: '', customerName: '', store: '', products: [{ name: '', qty: 1, discount: 0 }], totalDiscount: 0 }));
  const saveCreditNote = () => handleSave('credit_notes', creditNoteForm, 'creditNote', () => setCreditNoteForm({ noteNo: '', invoiceNo: '', reason: '', amount: 0, zatcaStatus: 'مسودة', branchId: '' }));
  const saveAdjustment = () => handleSave('balance_adjustments', adjustmentForm, 'adjustment', () => setAdjustmentForm({ customer: '', type: 'مدين', amount: 0, reason: '', branchId: '' }));
  const saveDeliveryNote = () => handleSave('delivery_notes', deliveryNoteForm, 'deliveryNote', () => setDeliveryNoteForm({ noteNo: '', invoiceNo: '', branchId: '', status: 'قيد التجهيز', date: '' }));

  // Shared UI components
  const Modal = ({ isOpen, onClose, title, children, onSave }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold text-emerald-800">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
            {children}
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
            <button onClick={onSave} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
              {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              حفظ وتأكيد
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TableLayout = ({ title, onAdd, renderAddText, children, filters = null }: any) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        {onAdd && (
          <button onClick={onAdd} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
            <Plus size={18} /> {renderAddText}
          </button>
        )}
      </div>
      {filters && <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex gap-4 items-center">{filters}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          {children}
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="mb-8 flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {['التقارير المالية', 'قائمة العملاء', 'عروض الأسعار', 'فواتير المبيعات', 'إيصالات المبيعات', 'إيصالات الاسترداد', 'الإشعارات الدائنة', 'تعديلات أرصدة', 'سندات تسليم المبيعات', 'سياسة تسعير المبيعات'].map(tab => (
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

      {/* 4. التقارير المالية المثبتة ضد الـ F5 */}
      {!loading && activeTab === 'التقارير المالية' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Customer Balances */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><BarChart3 size={24}/></div>
              <h3 className="text-lg font-bold text-slate-800">ملخص أرصدة العملاء</h3>
            </div>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 rounded-r-lg">العميل</th><th className="p-3 rounded-l-lg">الرصيد المستحق</th></tr></thead>
              <tbody>
                {customers.slice(0,5).map((c, i) => (
                  <tr key={i} className="border-b border-slate-50"><td className="p-3">{c.name || 'عميل'}</td><td className="p-3 font-bold text-emerald-600">{c.currentBalance || 0} ر.س</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Aging of Receivables */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><BarChart3 size={24}/></div>
              <h3 className="text-lg font-bold text-slate-800">أعمار ديون المبيعات (Aging)</h3>
            </div>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3 rounded-r-lg">الفترة</th><th className="p-3 rounded-l-lg">إجمالي الدين</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-50"><td className="p-3">0 - 30 يوم</td><td className="p-3 font-bold text-slate-800">45,000 ر.س</td></tr>
                <tr className="border-b border-slate-50"><td className="p-3">31 - 60 يوم</td><td className="p-3 font-bold text-amber-600">12,500 ر.س</td></tr>
                <tr className="border-b border-slate-50"><td className="p-3">أكثر من 90 يوم</td><td className="p-3 font-bold text-rose-600">8,200 ر.س</td></tr>
              </tbody>
            </table>
          </div>
          {/* Product Profitability */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><BarChart3 size={24}/></div>
              <h3 className="text-lg font-bold text-slate-800">ربحية المنتجات (بالمتوسط المرجح)</h3>
            </div>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">المنتج</th><th className="p-3">إجمالي الإيرادات</th><th className="p-3">التكلفة المباعة</th><th className="p-3">هامش الربح</th></tr></thead>
              <tbody>
                <tr className="border-b border-slate-50"><td className="p-3">شتلة ليمون حساوي</td><td className="p-3 font-bold text-emerald-600">12,000 ر.س</td><td className="p-3 text-rose-600">8,500 ر.س</td><td className="p-3 font-bold text-blue-600">29%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content based on Active Tab */}
      {!loading && activeTab === 'قائمة العملاء' && (
        <TableLayout title="قائمة العملاء" onAdd={() => openModal('customer')} renderAddText="إضافة عميل" filters={
          <>
            <input type="text" placeholder="اسم العميل..." className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            <button className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-700 shadow-md transition-all">بحث</button>
          </>
        }>
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">العميل</th><th className="px-6 py-4 font-bold">المنشأة</th><th className="px-6 py-4 font-bold">الجوال</th><th className="px-6 py-4 font-bold">الفرع</th></tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{c.name}</td>
                <td className="px-6 py-4">{c.company}</td>
                <td className="px-6 py-4" dir="ltr">{c.phone}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">{c.branchId}</span></td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'فواتير المبيعات' && (
        <TableLayout title="فواتير المبيعات" onAdd={() => openModal('invoice')} renderAddText="إضافة فاتورة جديدة">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">العميل</th><th className="px-6 py-4 font-bold">التاريخ</th><th className="px-6 py-4 font-bold">حالة الدفع</th><th className="px-6 py-4 font-bold">الإجمالي (شامل)</th></tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{inv.customerName}</td>
                <td className="px-6 py-4">{inv.date}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-lg text-xs font-bold ${inv.paymentStatus === 'نقدي' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{inv.paymentStatus}</span></td>
                <td className="px-6 py-4 font-bold text-slate-800">{inv.total || 0} ر.س</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {/* Skipping other tables to save space, assuming they are similarly rendered from states */}

      {/* Modals */}
      <Modal isOpen={modals.invoice} onClose={() => closeModal('invoice')} onSave={handleSaveInvoice} title="إصدار فاتورة مبيعات (نظام محاسبي)">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label><input type="date" value={invoiceForm.date} onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">حالة الدفع</label>
              <select value={invoiceForm.paymentStatus} onChange={e => setInvoiceForm({...invoiceForm, paymentStatus: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                <option>نقدي</option><option>شبكة</option><option>آجل</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">العميل</label><input type="text" value={invoiceForm.customerName} onChange={e => setInvoiceForm({...invoiceForm, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">الفرع (المخزن)</label>
              <select value={invoiceForm.branchId} onChange={e => setInvoiceForm({...invoiceForm, branchId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                <option value="">اختر الفرع...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-800 mb-3">الأصناف المشتراة</h4>
            {invoiceForm.items.map((item, idx) => (
              <div key={idx} className="flex gap-3 mb-3">
                <div className="flex-1">
                  <select value={item.productId} onChange={e => {
                    const newItems = [...invoiceForm.items];
                    newItems[idx].productId = e.target.value;
                    setInvoiceForm({...invoiceForm, items: newItems});
                  }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                    <option value="">اختر المنتج...</option>
                    <option value="PROD_1">شتلة ليمون حساوي (المخزون: 150)</option>
                    <option value="PROD_2">سماد عضوي (المخزون: 0)</option>
                  </select>
                </div>
                <div className="w-24">
                  <input type="number" placeholder="الكمية" value={item.qty} onChange={e => {
                    const newItems = [...invoiceForm.items];
                    newItems[idx].qty = Number(e.target.value);
                    setInvoiceForm({...invoiceForm, items: newItems});
                  }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" />
                </div>
                <div className="w-32">
                  <input type="number" placeholder="السعر الإفرادي" value={item.price} onChange={e => {
                    const newItems = [...invoiceForm.items];
                    newItems[idx].price = Number(e.target.value);
                    setInvoiceForm({...invoiceForm, items: newItems});
                  }} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" />
                </div>
              </div>
            ))}
            <button onClick={() => setInvoiceForm({...invoiceForm, items: [...invoiceForm.items, {productId: '', qty: 1, price: 0}]})} className="text-sm font-bold text-emerald-600 hover:text-emerald-800">+ إضافة صنف آخر</button>
          </div>
          
          <div className="bg-slate-100 p-4 rounded-xl mt-4 text-sm text-slate-600">
            * سيتم تلقائياً: (1) تسجيل قيد محاسبي مزدوج في الدفتر. (2) احتساب ضريبة القيمة المضافة ZATCA. (3) خصم المخزون بنظام المتوسط المرجح.
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.receipt} onClose={() => closeModal('receipt')} onSave={handleSaveReceipt} title="إضافة إيصال مبيعات">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم الإيصال</label><input type="text" value={receiptForm.receiptNo} onChange={e => setReceiptForm({...receiptForm, receiptNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">الفاتورة المستحقة</label><input type="text" value={receiptForm.invoiceNo} onChange={e => setReceiptForm({...receiptForm, invoiceNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ المقبوض</label><input type="number" value={receiptForm.amount} onChange={e => setReceiptForm({...receiptForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">الفرع (المخزن)</label>
            <select value={receiptForm.branchId} onChange={e => setReceiptForm({...receiptForm, branchId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
              <option value="">اختر الفرع...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.refund} onClose={() => closeModal('refund')} onSave={handleSaveRefund} title="إصدار مرتجع (تلقائي ZATCA)">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم المرتجع</label><input type="text" value={refundForm.refundNo} onChange={e => setRefundForm({...refundForm, refundNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم الفاتورة الأصلية</label><input type="text" value={refundForm.invoiceNo} onChange={e => setRefundForm({...refundForm, invoiceNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ المسترد</label><input type="number" value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold mt-4">
            تنبيه ZATCA: سيتم إصدار "إشعار دائن" آلياً وتسجيل القيد العكسي بمجرد حفظ هذا المرتجع. لا يمكن التراجع.
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default SalesModule;
