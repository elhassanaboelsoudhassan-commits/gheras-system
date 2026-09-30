import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Search, Plus, X, Save, RefreshCw, FileText } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const branchId = 'MAIN_BRANCH';

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
  const [invoiceForm, setInvoiceForm] = useState({ date: '', customerName: '', store: '', preparedBy: '', pos: '', deliveryDate: '', paymentStatus: 'غير مدفوعة', confirmed: false });
  const [receiptForm, setReceiptForm] = useState({ receiptNo: '', invoiceNo: '', paymentMethod: 'كاش', amount: 0, date: '' });
  const [refundForm, setRefundForm] = useState({ refundNo: '', invoiceNo: '', branch: '', amount: 0, date: '' });
  const [creditNoteForm, setCreditNoteForm] = useState({ noteNo: '', invoiceNo: '', reason: '', amount: 0, zatcaStatus: 'مسودة' });
  const [adjustmentForm, setAdjustmentForm] = useState({ customer: '', type: 'مدين', amount: 0, reason: '' });
  const [deliveryNoteForm, setDeliveryNoteForm] = useState({ noteNo: '', invoiceNo: '', store: '', status: 'قيد التجهيز', date: '' });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const getCol = async (col: string) => {
        const snap = await getDocs(collection(db, col));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      };
      
      const [cData, iData, qData, rData, refData, cnData, adjData, dnData] = await Promise.all([
        getCol('customers'), getCol('sales'), getCol('quotations'), getCol('receipts'),
        getCol('refunds'), getCol('credit_notes'), getCol('balance_adjustments'), getCol('delivery_notes')
      ]);

      setCustomers(cData);
      setInvoices(iData);
      setQuotations(qData);
      setReceipts(rData);
      setRefunds(refData);
      setCreditNotes(cnData);
      setAdjustments(adjData);
      setDeliveryNotes(dnData);
    } catch (e) {
      console.error("Firestore fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (type: keyof typeof modals) => setModals({ ...modals, [type]: true });
  const closeModal = (type: keyof typeof modals) => setModals({ ...modals, [type]: false });

  const handleSave = async (collectionName: string, data: any, modalType: keyof typeof modals, resetForm: () => void) => {
    setSaving(true);
    try {
      await addDoc(collection(db, collectionName), {
        ...data,
        branchId,
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
  const saveInvoice = () => handleSave('sales', invoiceForm, 'invoice', () => setInvoiceForm({ date: '', customerName: '', store: '', preparedBy: '', pos: '', deliveryDate: '', paymentStatus: 'غير مدفوعة', confirmed: false }));
  const saveReceipt = () => handleSave('receipts', receiptForm, 'receipt', () => setReceiptForm({ receiptNo: '', invoiceNo: '', paymentMethod: 'كاش', amount: 0, date: '' }));
  const saveRefund = () => handleSave('refunds', refundForm, 'refund', () => setRefundForm({ refundNo: '', invoiceNo: '', branch: '', amount: 0, date: '' }));
  const saveCreditNote = () => handleSave('credit_notes', creditNoteForm, 'creditNote', () => setCreditNoteForm({ noteNo: '', invoiceNo: '', reason: '', amount: 0, zatcaStatus: 'مسودة' }));
  const saveAdjustment = () => handleSave('balance_adjustments', adjustmentForm, 'adjustment', () => setAdjustmentForm({ customer: '', type: 'مدين', amount: 0, reason: '' }));
  const saveDeliveryNote = () => handleSave('delivery_notes', deliveryNoteForm, 'deliveryNote', () => setDeliveryNoteForm({ noteNo: '', invoiceNo: '', store: '', status: 'قيد التجهيز', date: '' }));

  // Shared UI components
  const Modal = ({ isOpen, onClose, title, children, onSave }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold text-emerald-800">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
          </div>
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
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
        {['قائمة العملاء', 'عروض الأسعار', 'فواتير المبيعات', 'إيصالات المبيعات', 'إيصالات الاسترداد', 'الإشعارات الدائنة', 'تعديلات أرصدة', 'سندات تسليم المبيعات', 'سياسة تسعير المبيعات'].map(tab => (
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

      {/* Content based on Active Tab */}
      {!loading && activeTab === 'قائمة العملاء' && (
        <TableLayout title="قائمة العملاء" onAdd={() => openModal('customer')} renderAddText="إضافة عميل" filters={
          <>
            <input type="text" placeholder="اسم العميل..." className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            <input type="text" placeholder="اسم المنشأة..." className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
            <input type="text" placeholder="رقم الجوال..." className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
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
            {customers.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-slate-400">لا توجد بيانات</td></tr>}
          </tbody>
        </TableLayout>
      )}

      {/* Repeat similar structures for other tabs... */}
      {!loading && activeTab === 'عروض الأسعار' && (
        <TableLayout title="عروض الأسعار" onAdd={() => openModal('quotation')} renderAddText="إضافة عرض سعر">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">العميل</th><th className="px-6 py-4 font-bold">التاريخ</th><th className="px-6 py-4 font-bold">الفرع</th></tr>
          </thead>
          <tbody>
            {quotations.map((q, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{q.customerName}</td>
                <td className="px-6 py-4">{q.date}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">{q.branchId}</span></td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'فواتير المبيعات' && (
        <TableLayout title="فواتير المبيعات" onAdd={() => openModal('invoice')} renderAddText="إضافة فاتورة جديدة">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">العميل</th><th className="px-6 py-4 font-bold">التاريخ</th><th className="px-6 py-4 font-bold">حالة الدفع</th><th className="px-6 py-4 font-bold">مؤكدة</th></tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">{inv.customerName}</td>
                <td className="px-6 py-4">{inv.date}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-lg text-xs font-bold ${inv.paymentStatus === 'مدفوعة' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{inv.paymentStatus}</span></td>
                <td className="px-6 py-4">{inv.confirmed ? 'نعم' : 'لا'}</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'إيصالات المبيعات' && (
        <TableLayout title="إيصالات المبيعات" onAdd={() => openModal('receipt')} renderAddText="إضافة إيصال مبيعات">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">رقم الإيصال</th><th className="px-6 py-4 font-bold">الفاتورة</th><th className="px-6 py-4 font-bold">المبلغ</th><th className="px-6 py-4 font-bold">طريقة الدفع</th></tr>
          </thead>
          <tbody>
            {receipts.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{r.receiptNo}</td>
                <td className="px-6 py-4 text-emerald-600">{r.invoiceNo}</td>
                <td className="px-6 py-4 font-bold">{r.amount}</td>
                <td className="px-6 py-4">{r.paymentMethod}</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'إيصالات الاسترداد' && (
        <TableLayout title="إيصالات الاسترداد" onAdd={() => openModal('refund')} renderAddText="إضافة إيصال استرداد">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">رقم الإيصال</th><th className="px-6 py-4 font-bold">الفاتورة</th><th className="px-6 py-4 font-bold">المبلغ</th><th className="px-6 py-4 font-bold">الفرع</th></tr>
          </thead>
          <tbody>
            {refunds.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{r.refundNo}</td>
                <td className="px-6 py-4 text-emerald-600">{r.invoiceNo}</td>
                <td className="px-6 py-4 font-bold text-rose-600">{r.amount}</td>
                <td className="px-6 py-4">{r.branch}</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'الإشعارات الدائنة' && (
        <TableLayout title="الإشعارات الدائنة" onAdd={() => openModal('creditNote')} renderAddText="إصدار إشعار دائن">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">رقم الإشعار</th><th className="px-6 py-4 font-bold">الفاتورة</th><th className="px-6 py-4 font-bold">المبلغ</th><th className="px-6 py-4 font-bold">السبب</th></tr>
          </thead>
          <tbody>
            {creditNotes.map((c, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{c.noteNo}</td>
                <td className="px-6 py-4 text-emerald-600">{c.invoiceNo}</td>
                <td className="px-6 py-4 font-bold">{c.amount}</td>
                <td className="px-6 py-4">{c.reason}</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'تعديلات أرصدة' && (
        <TableLayout title="تعديل الأرصدة" onAdd={() => openModal('adjustment')} renderAddText="إضافة تسوية">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">العميل</th><th className="px-6 py-4 font-bold">النوع</th><th className="px-6 py-4 font-bold">المبلغ</th><th className="px-6 py-4 font-bold">السبب</th></tr>
          </thead>
          <tbody>
            {adjustments.map((a, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{a.customer}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-lg text-xs font-bold ${a.type === 'مدين' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{a.type}</span></td>
                <td className="px-6 py-4 font-bold">{a.amount}</td>
                <td className="px-6 py-4">{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'سندات تسليم المبيعات' && (
        <TableLayout title="سند تسليم مبيعات" onAdd={() => openModal('deliveryNote')} renderAddText="إضافة سند تسليم">
          <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
            <tr><th className="px-6 py-4 font-bold">رقم السند</th><th className="px-6 py-4 font-bold">الفاتورة</th><th className="px-6 py-4 font-bold">الحالة</th><th className="px-6 py-4 font-bold">التاريخ</th></tr>
          </thead>
          <tbody>
            {deliveryNotes.map((d, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{d.noteNo}</td>
                <td className="px-6 py-4 text-emerald-600">{d.invoiceNo}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">{d.status}</span></td>
                <td className="px-6 py-4">{d.date}</td>
              </tr>
            ))}
          </tbody>
        </TableLayout>
      )}

      {!loading && activeTab === 'سياسة تسعير المبيعات' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">قوائم سياسة تسعير المبيعات</h3>
          <p className="text-slate-500 mb-8">قم بتعريف فئات التسعير وتخصيصها حسب مجموعات العملاء.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-emerald-100 bg-emerald-50/30 p-6 rounded-2xl hover:shadow-lg transition-all">
              <h4 className="text-lg font-bold text-emerald-800 mb-2">تسعير الجملة</h4>
              <p className="text-sm text-emerald-600/80 mb-4">نشط ومفعل لـ 45 عميلاً</p>
              <button className="bg-white text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50">تعديل الأسعار</button>
            </div>
            <div className="border border-slate-200 bg-slate-50 p-6 rounded-2xl hover:shadow-lg transition-all">
              <h4 className="text-lg font-bold text-slate-800 mb-2">تسعير التجزئة</h4>
              <p className="text-sm text-slate-500 mb-4">الافتراضي لنقاط البيع</p>
              <button className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-100">تعديل الأسعار</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={modals.customer} onClose={() => closeModal('customer')} onSave={saveCustomer} title="إضافة عميل جديد">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم العميل</label><input type="text" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم المنشأة</label><input type="text" value={customerForm.company} onChange={e => setCustomerForm({...customerForm, company: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم الجوال</label><input type="text" value={customerForm.phone} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" /></div>
        </div>
      </Modal>

      <Modal isOpen={modals.quotation} onClose={() => closeModal('quotation')} onSave={saveQuotation} title="إضافة عرض سعر">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الإصدار</label><input type="date" value={quotationForm.date} onChange={e => setQuotationForm({...quotationForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الانتهاء</label><input type="date" value={quotationForm.expiry} onChange={e => setQuotationForm({...quotationForm, expiry: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          </div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">العميل</label><input type="text" value={quotationForm.customerName} onChange={e => setQuotationForm({...quotationForm, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">المخزن</label><input type="text" value={quotationForm.store} onChange={e => setQuotationForm({...quotationForm, store: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
        </div>
      </Modal>

      <Modal isOpen={modals.invoice} onClose={() => closeModal('invoice')} onSave={saveInvoice} title="إصدار فاتورة إلكترونية ضريبية">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label><input type="date" value={invoiceForm.date} onChange={e => setInvoiceForm({...invoiceForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ التسليم</label><input type="date" value={invoiceForm.deliveryDate} onChange={e => setInvoiceForm({...invoiceForm, deliveryDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          </div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">العميل</label><input type="text" value={invoiceForm.customerName} onChange={e => setInvoiceForm({...invoiceForm, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div className="flex items-center gap-3 mt-4">
            <input type="checkbox" id="confirmed" checked={invoiceForm.confirmed} onChange={e => setInvoiceForm({...invoiceForm, confirmed: e.target.checked})} className="w-5 h-5 accent-emerald-600 rounded" />
            <label htmlFor="confirmed" className="font-bold text-slate-700">تأكيد الفاتورة (ليست مسودة)</label>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modals.receipt} onClose={() => closeModal('receipt')} onSave={saveReceipt} title="إضافة إيصال مبيعات">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم الإيصال</label><input type="text" value={receiptForm.receiptNo} onChange={e => setReceiptForm({...receiptForm, receiptNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">الفاتورة</label><input type="text" value={receiptForm.invoiceNo} onChange={e => setReceiptForm({...receiptForm, invoiceNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">طريقة الدفع</label>
            <select value={receiptForm.paymentMethod} onChange={e => setReceiptForm({...receiptForm, paymentMethod: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
              <option>كاش</option>
              <option>شبكة</option>
            </select>
          </div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label><input type="number" value={receiptForm.amount} onChange={e => setReceiptForm({...receiptForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
        </div>
      </Modal>

      <Modal isOpen={modals.refund} onClose={() => closeModal('refund')} onSave={saveRefund} title="إضافة إيصال استرداد">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم المرتجع</label><input type="text" value={refundForm.refundNo} onChange={e => setRefundForm({...refundForm, refundNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">الفاتورة الأصلية</label><input type="text" value={refundForm.invoiceNo} onChange={e => setRefundForm({...refundForm, invoiceNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label><input type="number" value={refundForm.amount} onChange={e => setRefundForm({...refundForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
        </div>
      </Modal>

      <Modal isOpen={modals.creditNote} onClose={() => closeModal('creditNote')} onSave={saveCreditNote} title="إصدار إشعار دائن">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم الإشعار</label><input type="text" value={creditNoteForm.noteNo} onChange={e => setCreditNoteForm({...creditNoteForm, noteNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">الفاتورة المرتبطة</label><input type="text" value={creditNoteForm.invoiceNo} onChange={e => setCreditNoteForm({...creditNoteForm, invoiceNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">السبب</label><input type="text" value={creditNoteForm.reason} onChange={e => setCreditNoteForm({...creditNoteForm, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">القيمة (شامل الضريبة)</label><input type="number" value={creditNoteForm.amount} onChange={e => setCreditNoteForm({...creditNoteForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
        </div>
      </Modal>

      <Modal isOpen={modals.adjustment} onClose={() => closeModal('adjustment')} onSave={saveAdjustment} title="تسوية أرصدة">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">العميل</label><input type="text" value={adjustmentForm.customer} onChange={e => setAdjustmentForm({...adjustmentForm, customer: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">النوع</label>
            <select value={adjustmentForm.type} onChange={e => setAdjustmentForm({...adjustmentForm, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
              <option>مدين (+)</option>
              <option>دائن (-)</option>
            </select>
          </div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label><input type="number" value={adjustmentForm.amount} onChange={e => setAdjustmentForm({...adjustmentForm, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">السبب</label><input type="text" value={adjustmentForm.reason} onChange={e => setAdjustmentForm({...adjustmentForm, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
        </div>
      </Modal>

      <Modal isOpen={modals.deliveryNote} onClose={() => closeModal('deliveryNote')} onSave={saveDeliveryNote} title="سند تسليم مبيعات">
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم السند</label><input type="text" value={deliveryNoteForm.noteNo} onChange={e => setDeliveryNoteForm({...deliveryNoteForm, noteNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">رقم الفاتورة</label><input type="text" value={deliveryNoteForm.invoiceNo} onChange={e => setDeliveryNoteForm({...deliveryNoteForm, invoiceNo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">تاريخ التسليم</label><input type="date" value={deliveryNoteForm.date} onChange={e => setDeliveryNoteForm({...deliveryNoteForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
        </div>
      </Modal>
    </div>
  );
};

export default SalesModule;
