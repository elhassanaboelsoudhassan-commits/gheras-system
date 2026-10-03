import React, { useState, useEffect } from 'react';
import { Package, ArrowRightLeft, ClipboardList, TrendingDown, Layers, Barcode, Save, FileSpreadsheet, PlusCircle, CheckCircle, Search } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';

export interface ItemData {
  nameAr: string;
  nameEn?: string;
  internalCode: string;
  barcode: string;
  mainCategory: string;
  subCategory?: string;
  baseUnit: string;
  conversionFactor?: number;
  costPrice: number;
  retailPrice: number;
  wholesalePrice?: number;
  minPrice?: number;
  reorderLimit?: number;
  maxLimit?: number;
  location?: string;
  stockQuantity: number;
  createdAt?: string;
}

const addItem = async (item: ItemData) => {
  try {
    const docRef = await addDoc(collection(db, 'items'), item);
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error adding item: ", error);
    return { success: false, error: error.message };
  }
};

const getItems = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'items'));
    const items: (ItemData & { id: string })[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as ItemData & { id: string });
    });
    return { success: true, data: items };
  } catch (error: any) {
    console.error("Error getting items: ", error);
    return { success: false, error: error.message };
  }
};

const calculateStock = async (itemId: string) => {
  // Placeholder for advanced stock calculation
  return { success: true, stock: 0 };
};

const computeWeightedAverage = async (itemId: string) => {
  // Placeholder for weighted average cost calculation
  return { success: true, averageCost: 0 };
};

const InventoryModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'بطاقة الصنف الشاملة' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Items List State
  const [items, setItems] = useState<(ItemData & { id: string })[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    internalCode: '',
    barcode: '',
    mainCategory: 'النباتات الزراعية',
    subCategory: 'نباتات زينة داخلية',
    baseUnit: 'حبة',
    conversionFactor: 1,
    costPrice: 0,
    retailPrice: 0,
    wholesalePrice: 0,
    minPrice: 0,
    reorderLimit: 10,
    maxLimit: 1000,
    location: '',
    stockQuantity: 50, // Default opening stock for quick testing
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handleSaveItem = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const result = await addItem({
        ...formData,
        createdAt: new Date().toISOString()
      });
      if (result.success) {
        setSaveSuccess(true);
        // Reset form or keep values based on preference
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchItems = async () => {
    setIsLoadingItems(true);
    const result = await getItems();
    if (result.success && result.data) {
      setItems(result.data);
    }
    setIsLoadingItems(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (activeTab === 'قائمة الأصناف') {
      fetchItems();
    }
  }, [activeTab]);

  const tabs = ['بطاقة الصنف الشاملة', 'قائمة الأصناف', 'الحركات المخزنية', 'بضاعة أول المدة', 'جرد المستودعات'];

  return (
    <div className="p-8 space-y-6">
      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-600 border border-slate-200'
            }`}
          >
            {tab === 'بطاقة الصنف الشاملة' && <Package size={18} />}
            {tab === 'قائمة الأصناف' && <Search size={18} />}
            {tab === 'الحركات المخزنية' && <ArrowRightLeft size={18} />}
            {tab === 'بضاعة أول المدة' && <Layers size={18} />}
            {tab === 'جرد المستودعات' && <ClipboardList size={18} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'بطاقة الصنف الشاملة' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Package size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">بيانات التعريف العامة</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم الصنف (عربي)</label>
                  <input type="text" name="nameAr" value={formData.nameAr} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="نبتة زينة داخلية" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم الصنف (إنجليزي)</label>
                  <input type="text" name="nameEn" value={formData.nameEn} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Indoor Decorative Plant" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رمز الصنف الداخلي</label>
                  <input type="text" name="internalCode" value={formData.internalCode} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" placeholder="ITM-1024" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>الباركود الدولي</span>
                    <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="text-emerald-600 text-xs flex items-center gap-1 hover:underline"><Barcode size={12}/> توليد تلقائي</button>
                  </label>
                  <input type="text" name="barcode" value={formData.barcode} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono" placeholder="6281234567890" dir="ltr" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">تصنيف المجموعات</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">المجموعة الرئيسية</label>
                    <select name="mainCategory" value={formData.mainCategory} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>النباتات الزراعية</option>
                      <option>الأسمدة والمبيدات</option>
                      <option>المعدات والأدوات</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">المجموعة الفرعية</label>
                    <select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>نباتات زينة داخلية</option>
                      <option>أشجار مثمرة</option>
                      <option>بذور</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">وحدات القياس المتعددة</h3>
                <div className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة الأساسية</label>
                      <input type="text" className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm" value="حبة" readOnly />
                    </div>
                    <div className="w-8 text-center text-slate-400">=</div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">معامل التحويل</label>
                      <input type="number" className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-center" value="1" readOnly />
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">وحدة كبرى (اختياري)</label>
                      <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                        <option>كرتون</option>
                        <option>درزن</option>
                      </select>
                    </div>
                    <div className="w-8 text-center text-slate-400 font-bold">=</div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">تحتوي على (حبة)</label>
                      <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-emerald-500 outline-none" defaultValue="12" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">تسعير الصنف (بـ SAR)</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">سعر التكلفة (شراء)</span>
                  <input type="number" name="costPrice" value={formData.costPrice || ''} onChange={handleInputChange} className="w-24 p-1.5 text-center border border-slate-200 rounded bg-white outline-none focus:border-emerald-500" placeholder="0.00" />
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-sm font-bold text-slate-600">متوسط التكلفة (تلقائي)</span>
                  <input type="number" className="w-24 p-1.5 text-center border border-slate-200 rounded bg-slate-100 outline-none text-slate-500" value={formData.costPrice} readOnly />
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <span className="text-sm font-bold text-emerald-800">سعر البيع قطاعي</span>
                  <input type="number" name="retailPrice" value={formData.retailPrice || ''} onChange={handleInputChange} className="w-24 p-1.5 text-center border border-emerald-300 rounded bg-white outline-none focus:border-emerald-500 font-bold text-emerald-700" placeholder="0.00" />
                </div>
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <span className="text-sm font-bold text-emerald-800">سعر البيع جملة</span>
                  <input type="number" name="wholesalePrice" value={formData.wholesalePrice || ''} onChange={handleInputChange} className="w-24 p-1.5 text-center border border-emerald-300 rounded bg-white outline-none focus:border-emerald-500 font-bold text-emerald-700" placeholder="0.00" />
                </div>
                <div className="flex justify-between items-center bg-rose-50 p-2 rounded-lg border border-rose-100 mt-2">
                  <span className="text-sm font-bold text-rose-700">السعر الأدنى للكاشير</span>
                  <input type="number" name="minPrice" value={formData.minPrice || ''} onChange={handleInputChange} className="w-24 p-1.5 text-center border border-rose-300 rounded bg-white outline-none focus:border-rose-500 font-bold text-rose-700" placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">إعدادات المستودع الذكية</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">حد الطلب (تنبيه نقص)</label>
                    <input type="number" name="reorderLimit" value={formData.reorderLimit || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأعلى (منع تكدس)</label>
                    <input type="number" name="maxLimit" value={formData.maxLimit || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">موقع الصنف في المخزن</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="مثال: الممر A / الرف 3" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الرصيد الافتتاحي (الكمية الحالية)</label>
                  <input type="number" name="stockQuantity" value={formData.stockQuantity || ''} onChange={handleInputChange} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 font-bold text-emerald-700" placeholder="0" />
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <CheckCircle size={20} />
                <span className="font-bold">تم حفظ بيانات الصنف بنجاح في قاعدة البيانات!</span>
              </div>
            )}

            <button onClick={handleSaveItem} disabled={isSaving} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-70">
              {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
              {isSaving ? 'جاري الحفظ...' : 'حفظ بيانات الصنف'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'قائمة الأصناف' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="text-emerald-600" /> قاعدة بيانات الأصناف الحية
            </h3>
            <button onClick={fetchItems} className="text-emerald-600 font-bold hover:underline text-sm">
              تحديث القائمة
            </button>
          </div>
          {isLoadingItems ? (
            <div className="p-12 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-4 font-bold">كود الصنف</th>
                    <th className="p-4 font-bold">اسم الصنف</th>
                    <th className="p-4 font-bold">القسم</th>
                    <th className="p-4 font-bold">سعر التكلفة</th>
                    <th className="p-4 font-bold">سعر البيع</th>
                    <th className="p-4 font-bold">تاريخ الإضافة</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        لا توجد أصناف مضافة في قاعدة البيانات
                      </td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-4 font-mono">{item.internalCode || '-'}</td>
                        <td className="p-4 font-bold text-emerald-700">{item.nameAr || item.nameEn}</td>
                        <td className="p-4">{item.mainCategory}</td>
                        <td className="p-4">{item.costPrice} ر.س</td>
                        <td className="p-4">{item.retailPrice} ر.س</td>
                        <td className="p-4 text-slate-500" dir="ltr">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'الحركات المخزنية' && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button onClick={() => setActiveModal('أمر تحويل بين مستودعين')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
              <ArrowRightLeft size={18} />
              أمر تحويل بين مستودعين
            </button>
            <button onClick={() => setActiveModal('تسوية عجز / زيادة')} className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-md hover:bg-rose-700 transition-colors flex items-center gap-2">
              <TrendingDown size={18} />
              تسوية عجز / زيادة
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
              <span>سجل الحركات المخزنية</span>
              <div className="flex gap-2">
                <input type="text" placeholder="بحث برقم الحركة..." className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-4 font-bold">رقم الحركة</th>
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">نوع الحركة</th>
                  <th className="p-4 font-bold">المستودع المصدر</th>
                  <th className="p-4 font-bold">المستودع المستلم</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold">خيارات</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-mono font-medium text-slate-800">TRN-2023-1001</td>
                  <td className="p-4 text-slate-600" dir="ltr">2023-10-25</td>
                  <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">تحويل مخزني</span></td>
                  <td className="p-4 text-slate-700">المستودع الرئيسي</td>
                  <td className="p-4 text-slate-700">فرع جدة</td>
                  <td className="p-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">بضاعة بالطريق</span></td>
                  <td className="p-4"><button onClick={() => setActiveModal('تأكيد الاستلام')} className="text-emerald-600 font-bold hover:underline">تأكيد الاستلام</button></td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-mono font-medium text-slate-800">ADJ-2023-0042</td>
                  <td className="p-4 text-slate-600" dir="ltr">2023-10-22</td>
                  <td className="p-4"><span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">تسوية عجز</span></td>
                  <td className="p-4 text-slate-700">فرع جدة</td>
                  <td className="p-4 text-slate-400">-</td>
                  <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">تم القيد</span></td>
                  <td className="p-4"><button onClick={() => setActiveModal('عرض المستند')} className="text-slate-500 font-bold hover:underline">عرض</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'بضاعة أول المدة' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Layers className="text-emerald-600"/> إدخال بضاعة أول المدة (رأس المال العيني)</h3>
              <p className="text-sm text-slate-500 mt-1">يستخدم هذا السند لمرة واحدة عند بدء استخدام النظام لإدخال الأرصدة الافتتاحية للمخازن.</p>
            </div>
            <button onClick={() => setActiveModal('حفظ الأرصدة الافتتاحية')} className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg hover:bg-emerald-200 transition-colors">
              حفظ الأرصدة الافتتاحية
            </button>
          </div>
          
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">المستودع</label>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500">
                <option>المستودع الرئيسي (الرياض)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label>
              <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3 font-bold w-16 text-center">#</th>
                  <th className="p-3 font-bold">كود/باركود الصنف</th>
                  <th className="p-3 font-bold w-1/3">اسم الصنف</th>
                  <th className="p-3 font-bold">الوحدة</th>
                  <th className="p-3 font-bold">الكمية الافتتاحية</th>
                  <th className="p-3 font-bold">تكلفة الوحدة</th>
                  <th className="p-3 font-bold">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-3 text-center text-slate-400">1</td>
                  <td className="p-3"><input type="text" className="w-full p-1.5 border border-slate-200 rounded outline-none" placeholder="بحث..." /></td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                </tr>
              </tbody>
            </table>
            <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="w-full p-3 text-emerald-600 font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
              <PlusCircle size={18} /> إضافة سطر جديد
            </button>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-64">
              <div className="flex justify-between items-center text-slate-600 mb-2">
                <span>إجمالي التكلفة:</span>
                <span className="font-mono font-bold">0.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'جرد المستودعات' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="text-indigo-600"/> عملية جرد جديدة</h3>
              <p className="text-sm text-slate-500 mt-1">استخرج قائمة الجرد الدفترية وقارنها بالكميات الفعلية في المستودع.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActiveModal('استيراد من Excel')} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                <FileSpreadsheet size={18} />
                استيراد من Excel
              </button>
              <button onClick={() => setActiveModal('بدء جرد لمستودع')} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                بدء جرد لمستودع
              </button>
            </div>
          </div>

          <div className="border-4 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <ClipboardList size={64} className="text-slate-300 mb-4" />
            <h4 className="text-xl font-bold text-slate-600 mb-2">لا توجد عمليات جرد مفتوحة</h4>
            <p className="text-slate-400">انقر على "بدء جرد لمستودع" لتجميد أرصدة المستودع والبدء في إدخال الكميات الفعلية.</p>
          </div>
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
                <Package size={32} />
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

export default InventoryModule;
