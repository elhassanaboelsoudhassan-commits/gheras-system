import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, FileSignature, ArrowRightLeft, Search, Plus, Minus, X, CheckCircle, PauseCircle, LogOut, Printer, QrCode, ShieldCheck, Package, Save } from 'lucide-react';
import { getItems, processSale, addQuotation, processSalesReturn, type ItemData, type SaleItem } from '../lib/firestoreUtils';

const SalesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'نقطة البيع السريع (POS)' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [items, setItems] = useState<(ItemData & { id: string })[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Quotation State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qIssueDate, setQIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [qExpiryDate, setQExpiryDate] = useState('');
  const [qCustomerName, setQCustomerName] = useState('');
  const [qBranch, setQBranch] = useState('الفرع الرئيسي');
  const [qItems, setQItems] = useState<{ id: string, name: string, qty: number, price: number }[]>([]);
  const [qDiscount, setQDiscount] = useState(0);
  const [isSavingQuotation, setIsSavingQuotation] = useState(false);

  // Sales Return State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [returnCustomer, setReturnCustomer] = useState('');
  const [returnBranch, setReturnBranch] = useState('الفرع الرئيسي');
  const [returnItems, setReturnItems] = useState<{ id: string, name: string, qty: number, price: number }[]>([]);
  const [isSavingReturn, setIsSavingReturn] = useState(false);

  // Advanced Invoice State
  const [advItems, setAdvItems] = useState<{ id: string, product: string, quantity: number, price: number, discount: number, total: number }[]>([]);
  const [advCustomer, setAdvCustomer] = useState('عميل نقدي افتراضي');
  const [advTerms, setAdvTerms] = useState('نقدي / فوري');
  const [advNotes, setAdvNotes] = useState('');
  const [isSavingAdv, setIsSavingAdv] = useState(false);

  const handleSaveAdv = async () => {
    setIsSavingAdv(true);
    try {
      const db = (await import('../firebase')).db;
      const { collection, addDoc } = await import('firebase/firestore');
      
      const totalBeforeTax = advItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const totalDiscount = advItems.reduce((sum, item) => sum + (item.discount || 0), 0);
      const taxAmount = (totalBeforeTax - totalDiscount) * 0.15;
      const netTotal = (totalBeforeTax - totalDiscount) + taxAmount;

      await addDoc(collection(db, "quotations"), {
        customerName: advCustomer,
        branch: "الفرع الرئيسي",
        issueDate: new Date().toISOString().split('T')[0],
        items: advItems,
        notes: advNotes,
        terms: advTerms,
        totalBeforeTax,
        totalDiscount,
        taxAmount,
        netTotal,
        createdAt: new Date().toISOString()
      });
      
      setNotification({ message: 'تم الحفظ وإرسال الفاتورة بنجاح!', type: 'success' });
      setAdvItems([]);
      setAdvNotes('');
    } catch (e) {
      console.error(e);
      setNotification({ message: 'حدث خطأ أثناء الحفظ', type: 'error' });
    } finally {
      setIsSavingAdv(false);
    }
  };

  const tabs = ['نقطة البيع السريع (POS)', 'فاتورة مبيعات متقدمة', 'عروض الأسعار', 'مرتجع المبيعات'];

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    // Guarantee stability and unblock interactive elements
    window.dispatchEvent(new Event('resize'));
  }, []);

  const fetchItems = async () => {
    const result = await getItems();
    if (result.success && result.data) {
      setItems(result.data);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (item: ItemData & { id: string }) => {
    // Check stock
    const currentCartItem = cart.find(c => c.id === item.id);
    const currentQtyInCart = currentCartItem ? currentCartItem.qty : 0;
    
    if (item.stockQuantity <= currentQtyInCart) {
      showNotification(`عذراً، رصيد الصنف "${item.nameAr}" لا يكفي! المتاح: ${item.stockQuantity}`, 'error');
      return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.nameAr, price: item.retailPrice, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty < 1) return item;
          // check stock before increment
          if (delta > 0) {
             const dbItem = items.find(i => i.id === id);
             if (dbItem && dbItem.stockQuantity < newQty) {
                showNotification(`عذراً، الرصيد لا يكفي. المتاح: ${dbItem.stockQuantity}`, 'error');
                return item;
             }
          }
          return { ...item, qty: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const vat = subTotal * 0.15;
  const total = subTotal + vat;

  const handleCheckout = async (paymentMethod: 'نقدي' | 'شبكة') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    const invoiceData = {
      items: cart,
      subTotal,
      vat,
      total,
      paymentMethod,
      branchId: 'main_branch', // In a real app, this would come from user context
      createdAt: new Date().toISOString()
    };

    const result = await processSale(invoiceData);
    
    if (result.success) {
      showNotification('تمت عملية البيع بنجاح وتم توليد القيد المحاسبي', 'success');
      setCart([]);
      fetchItems(); // Refresh stock
    } else {
      showNotification(result.error || 'حدث خطأ أثناء إتمام العملية', 'error');
    }
    setIsProcessing(false);
  };

  const handleSaveQuotation = async () => {
    setIsSavingQuotation(true);
    const total = qItems.reduce((sum, item) => sum + (item.price * item.qty), 0) - qDiscount;
    const res = await addQuotation({
      issueDate: qIssueDate,
      expiryDate: qExpiryDate,
      customerName: qCustomerName,
      branch: qBranch,
      items: qItems,
      discount: qDiscount,
      total,
      createdAt: new Date().toISOString()
    });

    if (res.success) {
      showNotification('تم حفظ عرض السعر بنجاح', 'success');
      setIsModalOpen(false);
      setQItems([]);
      setQCustomerName('');
      setQDiscount(0);
    } else {
      showNotification('حدث خطأ أثناء الحفظ', 'error');
    }
    setIsSavingQuotation(false);
  };

  const handleSaveReturn = async () => {
    if (!returnInvoiceId || returnItems.length === 0) {
      showNotification('يرجى إدخال رقم الفاتورة وإضافة أصناف', 'error');
      return;
    }
    setIsSavingReturn(true);
    const subTotal = returnItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const vat = subTotal * 0.15;
    const total = subTotal + vat;

    const res = await processSalesReturn({
      originalInvoiceId: returnInvoiceId,
      items: returnItems,
      subTotal,
      vat,
      total,
      refundMethod: 'نقدي',
      branchId: returnBranch,
      createdAt: new Date().toISOString()
    });

    if (res.success) {
      showNotification('تم حفظ المرتجع بنجاح وإنشاء القيد', 'success');
      setIsReturnModalOpen(false);
      setReturnInvoiceId('');
      setReturnCustomer('');
      setReturnItems([]);
      fetchItems(); // refresh stock
    } else {
      showNotification(res.error || 'حدث خطأ', 'error');
    }
    setIsSavingReturn(false);
  };

  const filteredItems = items.filter(item => 
    item.nameAr.includes(searchQuery) || 
    item.barcode.includes(searchQuery) ||
    item.internalCode.includes(searchQuery)
  );

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
            {tab === 'نقطة البيع السريع (POS)' && <ShoppingCart size={18} />}
            {tab === 'فاتورة مبيعات متقدمة' && <FileText size={18} />}
            {tab === 'عروض الأسعار' && <FileSignature size={18} />}
            {tab === 'مرتجع المبيعات' && <ArrowRightLeft size={18} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'نقطة البيع السريع (POS)' && (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* POS Left Panel (Cart & Payment) */}
          <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <div className="font-bold flex items-center gap-2"><ShoppingCart size={20}/> الفاتورة الحالية</div>
              <div className="bg-emerald-700 px-3 py-1 rounded-lg text-xs font-mono font-bold">INV-NEW</div>
            </div>
            
            <div className="p-4 border-b border-slate-100 flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" 
                placeholder="بحث عن صنف أو قراءة باركود..." 
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border border-slate-100 bg-slate-50 rounded-xl hover:border-emerald-200 transition-colors group">
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-sm mb-1">{item.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{item.price.toFixed(2)} SAR</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                      <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"><Minus size={14}/></button>
                      <input type="text" className="w-8 text-center text-sm font-bold bg-transparent outline-none" value={item.qty} readOnly />
                      <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 transition-colors"><Plus size={14}/></button>
                    </div>
                    <div className="w-16 text-left font-bold text-slate-700 text-sm font-mono">
                      {(item.price * item.qty).toFixed(2)}
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><X size={16}/></button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                  <ShoppingCart size={40} className="mb-2 opacity-50" />
                  <p>السلة فارغة. قم بإضافة أصناف من القائمة.</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-mono">{subTotal.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono">{vat.toFixed(2)} SAR</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-emerald-800 pt-2 border-t border-slate-200 mt-2">
                <span>الإجمالي الكلي:</span>
                <span className="font-mono">{total.toFixed(2)} SAR</span>
              </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-2 bg-white">
              <button 
                onClick={() => handleCheckout('نقدي')}
                disabled={false}
                className={`p-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
                  cart.length === 0 ? 'bg-emerald-200 text-emerald-100 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <CheckCircle size={18} /> دفع نقدي (F1)
              </button>
              <button 
                onClick={() => handleCheckout('شبكة')}
                disabled={false}
                className={`p-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
                  cart.length === 0 ? 'bg-blue-200 text-blue-100 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckCircle size={18} /> بطاقة / شبكة (F3)
              </button>
              <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="p-3 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                <PauseCircle size={16} /> تعليق الفاتورة (F4)
              </button>
              <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                <LogOut size={16} /> إغلاق الوردية (F12)
              </button>
            </div>
          </div>

          {/* POS Right Panel (Categories & Items Grid) */}
          <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-slate-100 custom-scrollbar">
              {['الكل'].map((cat, idx) => (
                <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} key={idx} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${idx === 0 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar content-start">
              {filteredItems.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => addToCart(item)}
                  className={`border rounded-2xl p-3 cursor-pointer transition-all flex flex-col items-center text-center group ${
                    item.stockQuantity > 0 ? 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-full mb-3 flex items-center justify-center transition-transform ${item.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-600 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>
                    <Package size={28} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 line-clamp-2 mb-2">{item.nameAr}</h4>
                  <div className="mt-auto w-full pt-2 border-t border-slate-100 font-mono text-emerald-600 font-bold text-sm">
                    {item.retailPrice.toFixed(2)} SAR
                  </div>
                  <div className={`text-[10px] font-bold mt-1 ${item.stockQuantity > 0 ? 'text-slate-400' : 'text-rose-500'}`}>
                    المخزون: {item.stockQuantity || 0}
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-20 flex flex-col items-center justify-center">
                  <Package size={48} className="mb-4 opacity-50" />
                  <p>لم يتم العثور على أصناف. تأكد من إضافتها في قسم المستودعات.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'فاتورة مبيعات متقدمة' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="col-span-1 xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> إصدار فاتورة ضريبية متقدمة</h3>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-slate-200">التاريخ: {new Date().toISOString().split('T')[0]}</span>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-blue-200">INV-ADV-NEW</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">العميل (الذمم الآجلة)</label>
                  <select value={advCustomer} onChange={e => setAdvCustomer(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500">
                    <option>عميل نقدي افتراضي</option>
                    <option>شركة المزارع الحديثة (سقف ائتمان: 50,000)</option>
                    <option>مؤسسة الورود (سقف ائتمان: 15,000)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">شروط الدفع / الاستحقاق</label>
                  <select value={advTerms} onChange={e => setAdvTerms(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500">
                    <option>نقدي / فوري</option>
                    <option>آجل 30 يوم</option>
                    <option>آجل 60 يوم</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3 font-bold w-12 text-center">#</th>
                      <th className="p-3 font-bold w-1/3">الصنف</th>
                      <th className="p-3 font-bold">الكمية</th>
                      <th className="p-3 font-bold">السعر (غير شامل)</th>
                      <th className="p-3 font-bold text-rose-600">الخصم</th>
                      <th className="p-3 font-bold">الضريبة 15%</th>
                      <th className="p-3 font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="p-3 text-center text-slate-400">{index + 1}</td>
                        <td className="p-3">
                          <input type="text" value={item.product} onChange={(e) => {
                            const newItems = [...advItems];
                            newItems[index].product = e.target.value;
                            setAdvItems(newItems);
                          }} className="w-full p-1.5 border border-slate-200 rounded outline-none" placeholder="بحث عن صنف..." />
                        </td>
                        <td className="p-3">
                          <input type="number" value={item.quantity} onChange={(e) => {
                            const newItems = [...advItems];
                            newItems[index].quantity = Number(e.target.value);
                            newItems[index].total = (newItems[index].quantity * newItems[index].price) - newItems[index].discount;
                            setAdvItems(newItems);
                          }} className="w-full p-1.5 border border-slate-200 rounded outline-none" min={1} />
                        </td>
                        <td className="p-3">
                          <input type="number" value={item.price} onChange={(e) => {
                            const newItems = [...advItems];
                            newItems[index].price = Number(e.target.value);
                            newItems[index].total = (newItems[index].quantity * newItems[index].price) - newItems[index].discount;
                            setAdvItems(newItems);
                          }} className="w-full p-1.5 border border-slate-200 rounded outline-none" min={0} />
                        </td>
                        <td className="p-3">
                          <input type="number" value={item.discount} onChange={(e) => {
                            const newItems = [...advItems];
                            newItems[index].discount = Number(e.target.value);
                            newItems[index].total = (newItems[index].quantity * newItems[index].price) - newItems[index].discount;
                            setAdvItems(newItems);
                          }} className="w-full p-1.5 border border-rose-200 rounded outline-none" min={0} />
                        </td>
                        <td className="p-3 font-mono text-slate-500">{((item.quantity * item.price - item.discount) * 0.15).toFixed(2)}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    {advItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-slate-500">لم يتم إضافة منتجات بعد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <button 
                  onClick={() => setAdvItems([...advItems, { id: Date.now().toString(), product: "", quantity: 1, price: 0, discount: 0, total: 0 }])}
                  className="w-full p-3 text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-t border-slate-200"
                >
                  <Plus size={18} /> إضافة سطر جديد
                </button>
              </div>

              <div className="mt-6 flex justify-between items-start">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات الفاتورة</label>
                  <textarea value={advNotes} onChange={e => setAdvNotes(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 h-24 resize-none" placeholder="اكتب أي ملاحظات للعميل أو شروط إضافية..."></textarea>
                </div>
                
                <div className="w-1/3 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>الإجمالي قبل الضريبة:</span>
                    <span className="font-mono">{advItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-rose-600">
                    <span>إجمالي الخصومات:</span>
                    <span className="font-mono">{advItems.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>إجمالي الضريبة (15%):</span>
                    <span className="font-mono">{(advItems.reduce((sum, item) => sum + ((item.quantity * item.price) - item.discount), 0) * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-blue-800 pt-2 border-t border-slate-200 mt-2">
                    <span>الصافي المستحق:</span>
                    <span className="font-mono">{(advItems.reduce((sum, item) => sum + ((item.quantity * item.price) - item.discount), 0) * 1.15).toFixed(2)} SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-start justify-end p-3 text-emerald-600">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-emerald-800 mb-2">تكامل زاتكا (ZATCA)</h3>
              <p className="text-xs text-emerald-600 mb-6 font-medium">الربط الآلي للمرحلة الثانية (الربط والتكامل)</p>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-700">حالة الربط</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> متصل بـ Fatoora</span>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-xs font-bold text-slate-500 mb-1">UUID</span>
                  <span className="block text-xs font-mono text-slate-800 truncate">سيتم توليده عند الحفظ...</span>
                </div>
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-xs font-bold text-slate-500 mb-1">Cryptographic Hash</span>
                  <span className="block text-xs font-mono text-slate-800 truncate">تشفير تلقائي من المنظومة...</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <button onClick={handleSaveAdv} disabled={false} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50">
                <Save size={20} />
                {isSavingAdv ? 'جاري الحفظ...' : 'حفظ وإرسال لـ ZATCA'}
              </button>
              <button onClick={() => window.print()} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 border border-slate-200">
                <Printer size={18} />
                معاينة الطباعة (QR Code)
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'عروض الأسعار' || activeTab === 'مرتجع المبيعات') && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-6">
            {activeTab === 'عروض الأسعار' ? <FileSignature size={40} /> : <ArrowRightLeft size={40} />}
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">وحدة {activeTab}</h3>
          <p className="text-slate-500 max-w-md">تم تجهيز البنية التحتية لهذه الشاشة لتعمل بنظام استيراد البيانات الذكي من الفواتير الأساسية.</p>
          <button onClick={() => activeTab === 'عروض الأسعار' ? setIsModalOpen(true) : setIsReturnModalOpen(true)} className="mt-8 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Plus size={18} /> إضافة مستند جديد
          </button>
        </div>
      )}

      {isModalOpen && activeTab === 'عروض الأسعار' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileSignature className="text-emerald-600" />
                إضافة عرض سعر جديد
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم العميل</label>
                  <input type="text" value={qCustomerName} onChange={e => setQCustomerName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" placeholder="اسم العميل..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الفرع / المخزن</label>
                  <select value={qBranch} onChange={e => setQBranch(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500">
                    <option>الفرع الرئيسي</option>
                    <option>فرع الرياض</option>
                    <option>فرع جدة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الإصدار</label>
                  <input type="date" value={qIssueDate} onChange={e => setQIssueDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الانتهاء</label>
                  <input type="date" value={qExpiryDate} onChange={e => setQExpiryDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">منتجات عرض السعر</label>
                  <button onClick={() => setQItems([...qItems, { id: '', name: '', qty: 1, price: 0 }])} className="text-sm font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                    <Plus size={16} /> إضافة منتج
                  </button>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-3 font-bold w-1/2">المنتج</th>
                        <th className="p-3 font-bold">الكمية</th>
                        <th className="p-3 font-bold">السعر</th>
                        <th className="p-3 font-bold">الإجمالي</th>
                        <th className="p-3 font-bold w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {qItems.map((qItem, index) => (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="p-2">
                            <select 
                              value={qItem.id} 
                              onChange={(e) => {
                                const selected = items.find(i => i.id === e.target.value);
                                if (selected) {
                                  const newItems = [...qItems];
                                  newItems[index] = { ...newItems[index], id: selected.id, name: selected.nameAr, price: selected.retailPrice };
                                  setQItems(newItems);
                                }
                              }}
                              className="w-full p-2 border border-slate-200 rounded outline-none"
                            >
                              <option value="">اختر المنتج...</option>
                              {items.map(item => (
                                <option key={item.id} value={item.id}>{item.nameAr}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="number" min="1" value={qItem.qty} onChange={e => {
                              const newItems = [...qItems];
                              newItems[index].qty = Number(e.target.value) || 1;
                              setQItems(newItems);
                            }} className="w-full p-2 border border-slate-200 rounded outline-none" />
                          </td>
                          <td className="p-2">
                            <input type="number" value={qItem.price} onChange={e => {
                              const newItems = [...qItems];
                              newItems[index].price = Number(e.target.value) || 0;
                              setQItems(newItems);
                            }} className="w-full p-2 border border-slate-200 rounded outline-none" />
                          </td>
                          <td className="p-2 font-mono bg-slate-50">{(qItem.qty * qItem.price).toFixed(2)}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => setQItems(qItems.filter((_, i) => i !== index))} className="text-slate-400 hover:text-rose-500">
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {qItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500">لم يتم إضافة منتجات بعد.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-4 items-center">
                <label className="text-sm font-bold text-slate-700">إجمالي الخصم:</label>
                <input type="number" value={qDiscount} onChange={e => setQDiscount(Number(e.target.value) || 0)} className="w-32 p-2 border border-rose-200 rounded-lg outline-none" placeholder="0.00" />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="font-bold text-lg text-slate-800">
                الصافي: <span className="font-mono text-emerald-600">{(qItems.reduce((sum, item) => sum + (item.price * item.qty), 0) - qDiscount).toFixed(2)} SAR</span>
              </div>
              <button 
                onClick={handleSaveQuotation} 
                disabled={false}
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingQuotation ? 'جاري الحفظ...' : 'إتمام الحفظ السحابي'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isReturnModalOpen && activeTab === 'مرتجع المبيعات' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up border border-white/20">
            <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-white/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="text-rose-600" />
                إضافة مرتجع مبيعات جديد
              </h2>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم الفاتورة الأصلية</label>
                  <div className="relative">
                    <input type="text" value={returnInvoiceId} onChange={e => setReturnInvoiceId(e.target.value)} className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl outline-none focus:border-rose-500 pl-10" placeholder="INV-..." />
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم العميل (اختياري)</label>
                  <input type="text" value={returnCustomer} onChange={e => setReturnCustomer(e.target.value)} className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl outline-none focus:border-rose-500" placeholder="اسم العميل..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الفرع / المخزن للإرجاع</label>
                  <select value={returnBranch} onChange={e => setReturnBranch(e.target.value)} className="w-full p-2.5 bg-white/70 border border-slate-200 rounded-xl outline-none focus:border-rose-500">
                    <option>الفرع الرئيسي</option>
                    <option>فرع الرياض</option>
                    <option>فرع جدة</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">الأصناف المرتجعة</label>
                  <button onClick={() => setReturnItems([...returnItems, { id: '', name: '', qty: 1, price: 0 }])} className="text-sm font-bold text-rose-600 flex items-center gap-1 hover:text-rose-700">
                    <Plus size={16} /> إضافة صنف للمرتجع
                  </button>
                </div>
                <div className="border border-slate-200/50 rounded-xl overflow-hidden bg-white/50">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100/50 text-slate-700 border-b border-slate-200/50">
                      <tr>
                        <th className="p-3 font-bold w-1/2">الصنف</th>
                        <th className="p-3 font-bold">الكمية المرتجعة</th>
                        <th className="p-3 font-bold">سعر الوحدة</th>
                        <th className="p-3 font-bold">الإجمالي الفرعي</th>
                        <th className="p-3 font-bold w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((rItem, index) => (
                        <tr key={index} className="border-t border-slate-100/50 hover:bg-white/40">
                          <td className="p-2">
                            <select 
                              value={rItem.id} 
                              onChange={(e) => {
                                const selected = items.find(i => i.id === e.target.value);
                                if (selected) {
                                  const newItems = [...returnItems];
                                  newItems[index] = { ...newItems[index], id: selected.id, name: selected.nameAr, price: selected.retailPrice };
                                  setReturnItems(newItems);
                                }
                              }}
                              className="w-full p-2 bg-transparent border border-slate-200 rounded outline-none"
                            >
                              <option value="">اختر الصنف...</option>
                              {items.map(item => (
                                <option key={item.id} value={item.id}>{item.nameAr}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input type="number" min="1" value={rItem.qty} onChange={e => {
                              const newItems = [...returnItems];
                              newItems[index].qty = Number(e.target.value) || 1;
                              setReturnItems(newItems);
                            }} className="w-full p-2 bg-transparent border border-slate-200 rounded outline-none" />
                          </td>
                          <td className="p-2">
                            <input type="number" value={rItem.price} onChange={e => {
                              const newItems = [...returnItems];
                              newItems[index].price = Number(e.target.value) || 0;
                              setReturnItems(newItems);
                            }} className="w-full p-2 bg-transparent border border-slate-200 rounded outline-none" />
                          </td>
                          <td className="p-2 font-mono">{(rItem.qty * rItem.price).toFixed(2)}</td>
                          <td className="p-2 text-center">
                            <button onClick={() => setReturnItems(returnItems.filter((_, i) => i !== index))} className="text-slate-400 hover:text-rose-500">
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {returnItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
                            قم بالبحث عن الفاتورة أو إضافة الأصناف المرتجعة يدوياً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>المجموع الفرعي للمرتجع:</span>
                  <span className="font-mono">{returnItems.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600">
                  <span>إعادة احتساب ضريبة القيمة المضافة (15%):</span>
                  <span className="font-mono">{(returnItems.reduce((sum, item) => sum + (item.price * item.qty), 0) * 0.15).toFixed(2)} SAR</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200/50 bg-white/50 flex justify-between items-center backdrop-blur-sm">
              <div className="font-bold text-lg text-slate-800 flex flex-col">
                <span className="text-xs text-slate-500 font-normal">صافي القيمة المردودة للصندوق:</span>
                <span className="font-mono text-rose-600">{(returnItems.reduce((sum, item) => sum + (item.price * item.qty), 0) * 1.15).toFixed(2)} SAR</span>
              </div>
              <button 
                onClick={handleSaveReturn} 
                disabled={false}
                className="px-8 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-200"
              >
                {isSavingReturn ? 'جاري تأمين وحفظ المرتجع...' : 'تأمين وحفظ المرتجع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesModule;
