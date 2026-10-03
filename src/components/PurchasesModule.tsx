import React, { useState } from 'react';
import { ShoppingBag, Truck, ClipboardList, RotateCcw, Building, Plus, FilePlus, Calculator, Save, AlertCircle } from 'lucide-react';

const PurchasesModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'فاتورة المشتريات' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const tabs = ['فاتورة المشتريات', 'دورة المشتريات', 'بطاقة المورد'];

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
            {tab === 'فاتورة المشتريات' && <ShoppingBag size={18} />}
            {tab === 'دورة المشتريات' && <ClipboardList size={18} />}
            {tab === 'بطاقة المورد' && <Building size={18} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'فاتورة المشتريات' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="col-span-1 xl:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="text-emerald-600"/> إدخال فاتورة مشتريات (الواردات)</h3>
                <div className="flex gap-2">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-slate-200">INV-PUR-908</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">المورد</label>
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500">
                    <option>شركة الأسمدة السعودية</option>
                    <option>مؤسسة المعدات الزراعية</option>
                    <option>مورد خارجي (استيراد)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">رقم فاتورة المورد</label>
                  <input type="text" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-mono" placeholder="INV-2023-085" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ الفاتورة</label>
                  <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3 font-bold w-12 text-center">#</th>
                      <th className="p-3 font-bold w-1/3">الصنف المستلم</th>
                      <th className="p-3 font-bold">الكمية</th>
                      <th className="p-3 font-bold">سعر الشراء</th>
                      <th className="p-3 font-bold">الضريبة</th>
                      <th className="p-3 font-bold">تكلفة نهائية (تلقائي)</th>
                      <th className="p-3 font-bold">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 text-center text-slate-400">1</td>
                      <td className="p-3"><input type="text" className="w-full p-1.5 border border-slate-200 rounded outline-none" defaultValue="سماد يوريا 50 كجم" /></td>
                      <td className="p-3"><input type="number" className="w-full p-1.5 border border-slate-200 rounded outline-none" defaultValue={100} /></td>
                      <td className="p-3"><input type="number" className="w-full p-1.5 border border-slate-200 rounded outline-none" defaultValue={85.00} /></td>
                      <td className="p-3"><input type="number" className="w-full p-1.5 border border-slate-200 rounded outline-none text-slate-500" defaultValue={15} placeholder="%" /></td>
                      <td className="p-3 font-mono text-emerald-600 font-bold bg-emerald-50 rounded">88.50</td>
                      <td className="p-3 font-mono font-bold text-slate-700">8,500.00</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 text-center text-slate-400">2</td>
                      <td className="p-3"><input type="text" className="w-full p-1.5 border border-slate-200 rounded outline-none" placeholder="بحث عن صنف..." /></td>
                      <td className="p-3"><input type="number" className="w-full p-1.5 border border-slate-200 rounded outline-none" /></td>
                      <td className="p-3"><input type="number" className="w-full p-1.5 border border-slate-200 rounded outline-none" /></td>
                      <td className="p-3"><input type="number" className="w-full p-1.5 border border-slate-200 rounded outline-none" placeholder="%" /></td>
                      <td className="p-3 font-mono text-emerald-600 font-bold">0.00</td>
                      <td className="p-3 font-mono font-bold text-slate-700">0.00</td>
                    </tr>
                  </tbody>
                </table>
                <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="w-full p-3 text-emerald-600 font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 border-t border-slate-200">
                  <Plus size={18} /> إضافة سطر جديد
                </button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="w-full md:w-1/2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2"><Calculator size={18}/> توزيع المصاريف الرأسمالية (Landed Cost)</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">مصاريف الشحن</span>
                      <input type="number" className="w-24 p-1.5 text-center border border-amber-300 rounded outline-none focus:border-amber-500" defaultValue={250} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">رسوم الجمارك</span>
                      <input type="number" className="w-24 p-1.5 text-center border border-amber-300 rounded outline-none focus:border-amber-500" defaultValue={100} />
                    </div>
                    <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="w-full mt-2 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors">
                      إعادة حساب وتوزيع التكلفة على الأصناف
                    </button>
                    <p className="text-xs text-amber-700 mt-2 flex gap-1"><AlertCircle size={12}/> يتم رفع تكلفة الصنف المخزنية تلقائياً بناءً على هذه المصاريف لضمان دقة الأرباح.</p>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>قيمة البضاعة:</span>
                    <span className="font-mono">8,500.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>إجمالي المصاريف الموزعة:</span>
                    <span className="font-mono">350.00</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>الضريبة (15%):</span>
                    <span className="font-mono">1,275.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-emerald-800 pt-2 border-t border-slate-200 mt-2">
                    <span>إجمالي الفاتورة:</span>
                    <span className="font-mono">10,125.00 SAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">طريقة الدفع للمورد</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="radio" name="payment_method" className="w-4 h-4 accent-emerald-600" defaultChecked />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">آجل (على حساب المورد)</div>
                    <div className="text-xs text-slate-500">سيتم ترحيل المبلغ كذمم دائنة</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="radio" name="payment_method" className="w-4 h-4 accent-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">نقدي (من الصندوق)</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="radio" name="payment_method" className="w-4 h-4 accent-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-800 text-sm">تحويل بنكي / شيك</div>
                  </div>
                </label>
              </div>
            </div>

            <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
              <Save size={20} />
              حفظ وتوليد القيد المحاسبي
            </button>
          </div>
        </div>
      )}

      {activeTab === 'دورة المشتريات' && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button onClick={() => setActiveModal('طلب شراء داخلي')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FilePlus size={18} /> طلب شراء داخلي (Request)
            </button>
            <button onClick={() => setActiveModal('أمر شراء لمورد')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Truck size={18} /> أمر شراء لمورد (Order)
            </button>
            <button onClick={() => setActiveModal('مرتجع مشتريات')} className="px-6 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-md hover:bg-rose-700 transition-colors flex items-center gap-2">
              <RotateCcw size={18} /> مرتجع مشتريات
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
              <span>سجل أوامر وطلبات الشراء</span>
              <div className="flex gap-2">
                <input type="text" placeholder="بحث برقم الأمر..." className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="p-4 font-bold">الرقم المرجعي</th>
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">النوع</th>
                  <th className="p-4 font-bold">المورد / الجهة الطالبة</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold">خيارات</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-mono font-medium text-slate-800">PO-2023-010</td>
                  <td className="p-4 text-slate-600" dir="ltr">2023-10-24</td>
                  <td className="p-4"><span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">أمر شراء (PO)</span></td>
                  <td className="p-4 text-slate-700">شركة الأسمدة السعودية</td>
                  <td className="p-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">بانتظار التسليم</span></td>
                  <td className="p-4"><button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="text-emerald-600 font-bold hover:underline">تحويل لفاتورة</button></td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-mono font-medium text-slate-800">PR-2023-045</td>
                  <td className="p-4 text-slate-600" dir="ltr">2023-10-23</td>
                  <td className="p-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">طلب شراء (PR)</span></td>
                  <td className="p-4 text-slate-700">المستودع الرئيسي (الرياض)</td>
                  <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">تمت الموافقة</span></td>
                  <td className="p-4"><button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="text-indigo-600 font-bold hover:underline">إنشاء أمر شراء</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'بطاقة المورد' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Building className="text-blue-600"/> ملف المورد (Supplier Card)</h3>
            <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
              حفظ بيانات المورد
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المورد</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="شركة الأسمدة السعودية" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الضريبي للمورد (15 رقم)</label>
                <input type="text" maxLength={15} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono" placeholder="300000000000003" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">العنوان</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="الرياض، المنطقة الصناعية" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">فترة الائتمان المتاحة (بالأيام)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" defaultValue={30} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الحد الائتماني (أعلى سقف مديونية)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="مثال: 100,000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">بيانات التواصل</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" placeholder="اسم المندوب - رقم الجوال" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{activeModal}</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <AlertCircle size={24} />
              </button>
            </div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FilePlus size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">جاري تجهيز الشاشة</h3>
              <p className="text-slate-500">سيتم تفعيل نافذة "{activeModal}" للعمل بالكامل في التحديث القادم.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
              <button onClick={() => setActiveModal(null)} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors w-full">
                حسناً، إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasesModule;
