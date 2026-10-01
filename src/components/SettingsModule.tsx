import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Shield, Save, Key, Database, RefreshCw, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { getSettings, updateSettings, SettingsData } from '../lib/firestoreUtils';

const SettingsModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'إعدادات المنشأة والفروع' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Settings State
  const [settings, setSettings] = useState<SettingsData>({
    companyNameAr: '',
    companyNameEn: '',
    taxNumber: '',
    nationalAddress: '',
    contactNumbers: '',
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const result = await getSettings();
      if (result.success && result.data) {
        setSettings(result.data);
        setSettingsId(result.id || null);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const result = await updateSettings(settingsId, settings);
      if (result.success) {
        setSettingsId(result.id || null);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = ['إعدادات المنشأة والفروع', 'الصلاحيات والأمان', 'النسخ الاحتياطي والأرشفة'];

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
            {tab === 'إعدادات المنشأة والفروع' && <Building2 size={18} />}
            {tab === 'الصلاحيات والأمان' && <Shield size={18} />}
            {tab === 'النسخ الاحتياطي والأرشفة' && <Database size={18} />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'إعدادات المنشأة والفروع' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">بيانات المؤسسة</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنشأة (عربي)</label>
                  <input type="text" name="companyNameAr" value={settings.companyNameAr} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none" placeholder="غصن ياسمين" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنشأة (إنجليزي)</label>
                  <input type="text" name="companyNameEn" value={settings.companyNameEn} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none" placeholder="Ghosn Yasmeen" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الضريبي (15 رقم)</label>
                <input type="text" name="taxNumber" value={settings.taxNumber} onChange={handleInputChange} maxLength={15} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-mono text-left" placeholder="300000000000003" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">العنوان الوطني</label>
                <input type="text" name="nationalAddress" value={settings.nationalAddress} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none" placeholder="الرياض، حي السليمانية" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">أرقام التواصل</label>
                <input type="text" name="contactNumbers" value={settings.contactNumbers} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none" placeholder="0500000000 - 920000000" />
              </div>

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span className="font-bold">تم حفظ بيانات المؤسسة بنجاح!</span>
                </div>
              )}

              <button onClick={handleSaveSettings} disabled={isSaving} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {isSaving ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <Save size={20} />}
                {isSaving ? 'جاري الحفظ...' : 'حفظ بيانات المؤسسة'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <MapPin size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800">تهيئة الفروع والمستودعات</h3>
                  <p className="text-sm text-slate-500">نظام شجري للمراكز والفروع</p>
                </div>
                <button className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors">
                  + فرع جديد
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-emerald-800">الفرع الرئيسي (الرياض)</h4>
                    <p className="text-xs text-emerald-600">مركز تكلفة: CC-001 • المستودع الرئيسي</p>
                  </div>
                  <button className="text-emerald-700 hover:bg-emerald-100 p-2 rounded-lg transition-colors">تعديل</button>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:border-emerald-200 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-700">فرع جدة</h4>
                    <p className="text-xs text-slate-500">مركز تكلفة: CC-002 • مستودع الغربية</p>
                  </div>
                  <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors">تعديل</button>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-4">إعدادات التاريخ والعملة</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Calendar size={16}/> نظام التاريخ</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>ميلادي (Gregorian)</option>
                    <option>هجري (Hijri)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><DollarSign size={16}/> العملة الافتراضية</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none">
                    <option>ريال سعودي (SAR)</option>
                    <option>دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'الصلاحيات والأمان' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800">المستخدمين</h3>
                </div>
                <button className="bg-orange-100 text-orange-700 p-2 rounded-lg hover:bg-orange-200 transition-colors">
                  + جديد
                </button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {['مدير النظام', 'محاسب عام', 'كاشير الفرع الرئيسي', 'أمين المستودع'].map((user, idx) => (
                  <button key={idx} className={`w-full text-right p-4 rounded-xl border transition-all ${idx === 0 ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-orange-200'}`}>
                    <div className="font-bold text-slate-800">{user}</div>
                    <div className="text-xs text-slate-500 mt-1">{idx === 0 ? 'صلاحيات مطلقة' : 'مخصص'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Key size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">مصفوفة الصلاحيات (Permission Matrix)</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-600">
                      <th className="p-3 font-bold">الشاشة / الوحدة</th>
                      <th className="p-3 font-bold text-center">استعراض (View)</th>
                      <th className="p-3 font-bold text-center">إدخال (Create)</th>
                      <th className="p-3 font-bold text-center">تعديل (Edit)</th>
                      <th className="p-3 font-bold text-center text-rose-600">حذف (Delete)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'فاتورة المبيعات', v: true, c: true, e: false, d: false },
                      { name: 'سندات القبض والصرف', v: true, c: true, e: true, d: false },
                      { name: 'بطاقات الأصناف', v: true, c: false, e: false, d: false },
                      { name: 'القيود المحاسبية', v: true, c: false, e: false, d: false },
                      { name: 'إعدادات المنشأة', v: false, c: false, e: false, d: false },
                    ].map((mod, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-medium text-slate-800">{mod.name}</td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={mod.v} className="w-5 h-5 accent-indigo-600 rounded" /></td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={mod.c} className="w-5 h-5 accent-indigo-600 rounded" /></td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={mod.e} className="w-5 h-5 accent-indigo-600 rounded" /></td>
                        <td className="p-3 text-center"><input type="checkbox" defaultChecked={mod.d} className="w-5 h-5 accent-rose-600 rounded" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="font-bold text-rose-600 mb-2 flex items-center gap-2"><Shield size={18}/> تجميد العمليات المحاسبية (إقفال الفترات)</h4>
                <p className="text-sm text-slate-600 mb-4">منع أي مستخدم من إضافة أو تعديل أو حذف أي حركة مالية أو مخزنية قبل هذا التاريخ.</p>
                <div className="flex items-center gap-4">
                  <input type="date" className="p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none" />
                  <button className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors">تطبيق الإقفال</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'النسخ الاحتياطي والأرشفة' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Save size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">أخذ نسخة احتياطية (Backup)</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              يقوم النظام بأخذ نسخة احتياطية من كافة قواعد البيانات السحابية والمحلية وتشفيرها لضمان عدم ضياع البيانات.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" className="w-5 h-5 accent-emerald-600" defaultChecked />
                <div>
                  <div className="font-bold text-slate-800">نسخ احتياطي تلقائي (موصى به)</div>
                  <div className="text-xs text-slate-500">يومياً عند إغلاق النظام أو كل 12 ساعة</div>
                </div>
              </label>
              <button className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-emerald-200">
                <Database size={20} />
                أخذ نسخة احتياطية الآن
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">استعادة البيانات (Restore)</h3>
            </div>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              تحذير: استعادة النظام من نقطة سابقة سيقوم بمسح كافة الحركات التي تمت بعد تاريخ النقطة المستعادة!
            </p>
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2 mb-4">
              {[
                { date: '2023-10-25 11:30 PM', size: '45.2 MB', auto: true },
                { date: '2023-10-24 11:30 PM', size: '44.8 MB', auto: true },
                { date: '2023-10-23 04:15 PM', size: '42.1 MB', auto: false },
              ].map((backup, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-800 text-sm" dir="ltr">{backup.date}</div>
                    <div className="text-xs text-slate-500">{backup.size} • {backup.auto ? 'تلقائي' : 'يدوي'}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-lg transition-colors">
                    استعادة
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 border-dashed">
              رفع ملف نسخة احتياطية خارجي (.bak)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
