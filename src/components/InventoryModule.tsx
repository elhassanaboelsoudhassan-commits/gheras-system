import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Plus, X, Save, RefreshCw, LayoutDashboard } from 'lucide-react';

const InventoryModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'المخازن والفروع' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [modals, setModals] = useState({ branch: false, product: false });
  const [branchForm, setBranchForm] = useState({ name: '', location: '', manager: '' });
  const [productForm, setProductForm] = useState({ name: '', barcode: '', category: '', price: 0, cost: 0, quantity: 0, branchId: '' });

  const user = JSON.parse(localStorage.getItem('gheras_admin') || '{}');
  const isAdmin = user.email === 'elhassanelsoudy@gmail.com';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const [bSnap, pSnap] = await Promise.all([
        getDocs(collection(db, 'branches')),
        getDocs(collection(db, 'products'))
      ]);
      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Firestore fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveBranch = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      if (!branchForm.name) throw new Error("اسم المخزن/الفرع مطلوب");
      await addDoc(collection(db, 'branches'), {
        ...branchForm,
        createdAt: serverTimestamp()
      });
      setModals({ ...modals, branch: false });
      setBranchForm({ name: '', location: '', manager: '' });
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProduct = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      if (!productForm.name) throw new Error("اسم المنتج مطلوب");
      
      // We store the initial quantity under the selected branch if any.
      const initialBranches = productForm.branchId ? { [productForm.branchId]: productForm.quantity } : {};

      await addDoc(collection(db, 'products'), {
        name: productForm.name,
        barcode: productForm.barcode,
        category: productForm.category,
        price: productForm.price,
        vat: productForm.price * 0.15,
        priceWithVat: productForm.price * 1.15,
        weightedAverageCost: productForm.cost,
        quantity: productForm.quantity,
        branches: initialBranches,
        createdAt: serverTimestamp()
      });
      setModals({ ...modals, product: false });
      setProductForm({ name: '', barcode: '', category: '', price: 0, cost: 0, quantity: 0, branchId: '' });
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
        {['المخازن والفروع', 'قائمة المنتجات'].map(tab => (
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

      {!loading && activeTab === 'المخازن والفروع' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><LayoutDashboard /> المخازن والفروع</h3>
            <button onClick={() => setModals({ ...modals, branch: true })} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
              <Plus size={18} /> إضافة مخزن / فرع
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                <tr><th className="px-6 py-4 font-bold">اسم المخزن</th><th className="px-6 py-4 font-bold">الموقع</th><th className="px-6 py-4 font-bold">المسؤول</th></tr>
              </thead>
              <tbody>
                {branches.map((b, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{b.name}</td>
                    <td className="px-6 py-4">{b.location}</td>
                    <td className="px-6 py-4">{b.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'قائمة المنتجات' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">📦 أصناف المنتجات</h3>
            {isAdmin && (
              <button onClick={() => setModals({ ...modals, product: true })} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center gap-2">
                <Plus size={18} /> إضافة صنف جديد
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b border-slate-200">
                <tr><th className="px-6 py-4 font-bold">اسم الصنف (الباركود)</th><th className="px-6 py-4 font-bold">التصنيف</th><th className="px-6 py-4 font-bold">سعر البيع (شامل 15%)</th><th className="px-6 py-4 font-bold">إجمالي الرصيد</th></tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.name} <span className="text-xs text-slate-400 block">{p.barcode}</span></td>
                    <td className="px-6 py-4">{p.category}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{p.priceWithVat ? p.priceWithVat.toFixed(2) : p.price} ر.س</td>
                    <td className="px-6 py-4">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modals.branch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-emerald-800">إضافة مخزن جديد</h3>
              <button onClick={() => setModals({ ...modals, branch: false })} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
              <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم المخزن</label><input type="text" value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">الموقع / المدينة</label><input type="text" value={branchForm.location} onChange={e => setBranchForm({...branchForm, location: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم المسؤول</label><input type="text" value={branchForm.manager} onChange={e => setBranchForm({...branchForm, manager: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModals({ ...modals, branch: false })} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
              <button onClick={handleSaveBranch} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ وتأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {modals.product && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-emerald-800">إضافة صنف منتج جديد</h3>
              <button onClick={() => setModals({ ...modals, product: false })} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {errorMsg && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">اسم الصنف</label><input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">الباركود (Barcode)</label><input type="text" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              </div>
              
              <div><label className="block text-sm font-bold text-slate-700 mb-1">التصنيف</label><input type="text" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">سعر الشراء (التكلفة)</label><input type="number" value={productForm.cost} onChange={e => setProductForm({...productForm, cost: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">سعر البيع (قبل الضريبة)</label>
                  <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" />
                  <p className="text-xs text-slate-500 mt-1">شامل الضريبة: {(productForm.price * 1.15).toFixed(2)} ر.س</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">الرصيد الافتتاحي (الكمية)</label><input type="number" value={productForm.quantity} onChange={e => setProductForm({...productForm, quantity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50" /></div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تحديد المخزن للرصيد</label>
                  <select value={productForm.branchId} onChange={e => setProductForm({...productForm, branchId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                    <option value="">كل المخازن (عام)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setModals({ ...modals, product: false })} className="px-6 py-2 rounded-lg font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50">إلغاء</button>
              <button onClick={handleSaveProduct} disabled={saving} className="px-6 py-2 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} حفظ الصنف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
