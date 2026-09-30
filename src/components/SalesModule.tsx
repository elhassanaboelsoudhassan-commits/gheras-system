import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Search, Plus, FileText } from 'lucide-react';

const SalesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'قائمة العملاء' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!db) return;
        const custSnap = await getDocs(collection(db, 'customers'));
        setCustomers(custSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const invSnap = await getDocs(collection(db, 'sales'));
        setInvoices(invSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const quotSnap = await getDocs(collection(db, 'quotations'));
        setQuotations(quotSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const recSnap = await getDocs(collection(db, 'receipts'));
        setReceipts(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Firestore fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // مصفوفة فارغة لضمان عدم حدوث وميض مستمر

  const renderCustomers = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">قائمة العملاء</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إضافة عميل جديد
        </button>
      </div>
      <div className="p-4 bg-slate-50 flex gap-4 border-b border-slate-100">
        <input type="text" placeholder="اسم العميل..." className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none" />
        <input type="text" placeholder="اسم المنشأة..." className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none" />
        <input type="text" placeholder="رقم الجوال..." className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none" />
        <button className="bg-slate-800 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700">
          <Search size={16} /> بحث
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">اسم العميل</th>
              <th className="px-6 py-4 font-medium">المنشأة</th>
              <th className="px-6 py-4 font-medium">رقم الجوال</th>
              <th className="px-6 py-4 font-medium">الرصيد الافتتاحي</th>
              <th className="px-6 py-4 font-medium">الرصيد الحالي</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? customers.map((c, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-4">{c.name || 'غير متوفر'}</td>
                <td className="px-6 py-4">{c.company || 'غير متوفر'}</td>
                <td className="px-6 py-4">{c.phone || 'غير متوفر'}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{c.openingBalance || '0'} ر.س</td>
                <td className="px-6 py-4 font-bold text-emerald-600">{c.currentBalance || '0'} ر.س</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">لا توجد بيانات متاحة، قم بإضافة عملاء</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQuotations = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">عروض الأسعار</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إضافة عرض سعر جديد
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">تاريخ العرض</th>
              <th className="px-6 py-4 font-medium">رقم العرض</th>
              <th className="px-6 py-4 font-medium">العميل</th>
              <th className="px-6 py-4 font-medium">صلاحية العرض</th>
              <th className="px-6 py-4 font-medium">الإجمالي</th>
              <th className="px-6 py-4 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {quotations.length > 0 ? quotations.map((q, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-4">{q.date || '-'}</td>
                <td className="px-6 py-4 font-bold">{q.number || '-'}</td>
                <td className="px-6 py-4">{q.customerName || '-'}</td>
                <td className="px-6 py-4">{q.validUntil || '-'}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{q.total || '0'} ر.س</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{q.status || 'معلق'}</span></td>
              </tr>
            )) : (
              <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-4">2024-05-15</td>
                <td className="px-6 py-4 font-bold">QT-001</td>
                <td className="px-6 py-4">مؤسسة الأمل</td>
                <td className="px-6 py-4">30 يوم</td>
                <td className="px-6 py-4 font-bold text-slate-800">4,500 ر.س</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">بانتظار الموافقة</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">فواتير المبيعات</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إنشاء فاتورة
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600 whitespace-nowrap">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">التاريخ</th>
              <th className="px-6 py-4 font-medium">الرقم التسلسلي</th>
              <th className="px-6 py-4 font-medium">اسم العميل</th>
              <th className="px-6 py-4 font-medium">المخزن</th>
              <th className="px-6 py-4 font-medium">مؤكد</th>
              <th className="px-6 py-4 font-medium">سياسة الدفع</th>
              <th className="px-6 py-4 font-medium">حالة الدفع</th>
              <th className="px-6 py-4 font-medium">المستحق</th>
              <th className="px-6 py-4 font-medium">حالة التسليم</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? invoices.map((inv, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-4">{inv.date || '-'}</td>
                <td className="px-6 py-4 font-bold">{inv.serial || '-'}</td>
                <td className="px-6 py-4">{inv.customerName || '-'}</td>
                <td className="px-6 py-4">{inv.store || '-'}</td>
                <td className="px-6 py-4">{inv.confirmed ? 'نعم' : 'لا'}</td>
                <td className="px-6 py-4">{inv.paymentPolicy || '-'}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{inv.paymentStatus || 'مدفوع'}</span></td>
                <td className="px-6 py-4 font-bold text-slate-800">{inv.due || '0'} ر.س</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{inv.deliveryStatus || 'تم التسليم'}</span></td>
              </tr>
            )) : (
              <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-6 py-4">2024-05-12</td>
                <td className="px-6 py-4 font-bold">INV-001</td>
                <td className="px-6 py-4">مؤسسة الغد المشرق</td>
                <td className="px-6 py-4">المستودع الرئيسي</td>
                <td className="px-6 py-4 text-emerald-600">نعم</td>
                <td className="px-6 py-4">نقدي</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">مدفوع</span></td>
                <td className="px-6 py-4 font-bold text-slate-800">12,500 ر.س</td>
                <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">تم التسليم</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSalesReceipts = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">إيصالات المبيعات</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إضافة إيصال
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">رقم الإيصال</th>
              <th className="px-6 py-4 font-medium">رقم الفاتورة المرتبطة</th>
              <th className="px-6 py-4 font-medium">طريقة الدفع (كاشير/شبكة)</th>
              <th className="px-6 py-4 font-medium">المبلغ</th>
              <th className="px-6 py-4 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-6 py-4 font-bold">REC-001</td>
              <td className="px-6 py-4 text-blue-600">INV-001</td>
              <td className="px-6 py-4">شبكة / مدى</td>
              <td className="px-6 py-4 font-bold text-emerald-600">12,500 ر.س</td>
              <td className="px-6 py-4">2024-05-12</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRefunds = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">إيصالات الاسترداد (المرتجعات)</h3>
        <button className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 flex items-center gap-2">
          <Plus size={16} /> إضافة مرتجع
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">رقم المرتجع</th>
              <th className="px-6 py-4 font-medium">رقم الفاتورة الأصلية</th>
              <th className="px-6 py-4 font-medium">الفرع / المستودع</th>
              <th className="px-6 py-4 font-medium">المبلغ المسترد</th>
              <th className="px-6 py-4 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-6 py-4 font-bold">REF-001</td>
              <td className="px-6 py-4 text-blue-600">INV-002</td>
              <td className="px-6 py-4">المستودع الرئيسي</td>
              <td className="px-6 py-4 font-bold text-rose-600">1,200 ر.س</td>
              <td className="px-6 py-4">2024-05-14</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreditNotes = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">الإشعارات الدائنة (ZATCA)</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إصدار إشعار دائن
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">رقم الإشعار</th>
              <th className="px-6 py-4 font-medium">الفاتورة المرتبطة</th>
              <th className="px-6 py-4 font-medium">سبب الإشعار</th>
              <th className="px-6 py-4 font-medium">قيمة التعديل (شامل الضريبة)</th>
              <th className="px-6 py-4 font-medium">حالة ZATCA</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-6 py-4 font-bold">CN-001</td>
              <td className="px-6 py-4 text-blue-600">INV-005</td>
              <td className="px-6 py-4">تعديل قيمة مضافة</td>
              <td className="px-6 py-4 font-bold text-slate-800">575 ر.س</td>
              <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">مقبول</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBalanceAdjustments = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">تعديل أرصدة العملاء</h3>
        <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 flex items-center gap-2">
          <Plus size={16} /> تسوية رصيد
        </button>
      </div>
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4">إجراء تسوية مالية مباشرة</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">العميل</label>
              <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option>اختر العميل...</option>
                <option>مؤسسة الغد المشرق</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">نوع التسوية</label>
              <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option>مدين (+)</option>
                <option>دائن (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">المبلغ</label>
              <input type="number" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">البيان / السبب</label>
              <textarea className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="سبب التسوية المباشرة..."></textarea>
            </div>
            <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
              حفظ وتأكيد التسوية
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeliveryNotes = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">سندات تسليم المبيعات</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إنشاء سند تسليم
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium">رقم السند</th>
              <th className="px-6 py-4 font-medium">رقم الفاتورة</th>
              <th className="px-6 py-4 font-medium">المخزن الصادر منه</th>
              <th className="px-6 py-4 font-medium">حالة الشحن والتسليم</th>
              <th className="px-6 py-4 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 hover:bg-slate-50/50">
              <td className="px-6 py-4 font-bold">DN-001</td>
              <td className="px-6 py-4 text-blue-600">INV-001</td>
              <td className="px-6 py-4">المستودع الرئيسي</td>
              <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">تم التسليم بالكامل</span></td>
              <td className="px-6 py-4">2024-05-13</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPricingPolicy = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800">سياسة تسعير المبيعات</h3>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
          <Plus size={16} /> إضافة سياسة جديدة
        </button>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
            <h4 className="text-xl font-bold text-slate-800 mb-2">تسعير الجملة</h4>
            <p className="text-slate-500 text-sm mb-4">قائمة الأسعار المخصصة لعملاء الجملة والمشاريع الكبيرة.</p>
            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-emerald-600">نشط</span>
              <button className="text-sm text-blue-600 hover:underline">تعديل القائمة</button>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
            <h4 className="text-xl font-bold text-slate-800 mb-2">تسعير التجزئة</h4>
            <p className="text-slate-500 text-sm mb-4">الأسعار الافتراضية لنقاط البيع والعملاء الأفراد.</p>
            <div className="flex justify-between items-center border-t border-slate-200 pt-4">
              <span className="text-sm font-medium text-emerald-600">نشط (الافتراضي)</span>
              <button className="text-sm text-blue-600 hover:underline">تعديل القائمة</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    'قائمة العملاء', 
    'عروض الأسعار', 
    'فواتير المبيعات', 
    'إيصالات المبيعات', 
    'إيصالات الاسترداد', 
    'الإشعارات الدائنة', 
    'تعديلات أرصدة', 
    'سندات تسليم المبيعات', 
    'سياسة تسعير المبيعات'
  ];

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6 flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-10"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>}

      {!loading && activeTab === 'قائمة العملاء' && renderCustomers()}
      {!loading && activeTab === 'عروض الأسعار' && renderQuotations()}
      {!loading && activeTab === 'فواتير المبيعات' && renderInvoices()}
      {!loading && activeTab === 'إيصالات المبيعات' && renderSalesReceipts()}
      {!loading && activeTab === 'إيصالات الاسترداد' && renderRefunds()}
      {!loading && activeTab === 'الإشعارات الدائنة' && renderCreditNotes()}
      {!loading && activeTab === 'تعديلات أرصدة' && renderBalanceAdjustments()}
      {!loading && activeTab === 'سندات تسليم المبيعات' && renderDeliveryNotes()}
      {!loading && activeTab === 'سياسة تسعير المبيعات' && renderPricingPolicy()}
      
    </div>
  );
};

export default SalesModule;
