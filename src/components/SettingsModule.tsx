import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Users, Shield, Save, Key, Database, RefreshCw, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface SettingsData {
  companyNameAr: string;
  companyNameEn: string;
  taxNumber: string;
  nationalAddress: string;
  contactNumbers: string;
}

const SettingsModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'إعدادات المنشأة والفروع' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);


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
  // Permissions State
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [permissionsSaveSuccess, setPermissionsSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'profile');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SettingsData);
          setSettingsId(docSnap.id);
        } else {
          // Default data
          setSettings(prev => ({ ...prev, companyNameAr: 'مشاتل غصن يميس' }));
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'permissions'));
        if (querySnapshot.empty) {
          const defaultRoles = [
            { id: 'admin', name: 'مدير عام', isAbsolute: true, permissions: [] },
            { id: 'cashier_ruh', name: 'كاشير الرياض', isAbsolute: false, permissions: [] },
            { id: 'store_qassim', name: 'مسؤول مستودع القصيم', isAbsolute: false, permissions: [] }
          ];
          setRoles(defaultRoles);
        } else {
          setRoles(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchPermissions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, 'settings', 'profile');
      await setDoc(docRef, settings, { merge: true });
      setSettingsId('profile');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    setIsSavingPermissions(true);
    setPermissionsSaveSuccess(false);
    try {
      const roleToSave = roles[selectedRoleIdx];
      if (roleToSave) {
        const docRef = doc(db, 'permissions', roleToSave.id || roleToSave.name);
        await setDoc(docRef, roleToSave, { merge: true });
        setPermissionsSaveSuccess(true);
        setTimeout(() => setPermissionsSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handlePermissionToggle = (moduleName: string, action: string) => {
    setRoles(prev => {
      const newRoles = [...prev];
      const role = { ...newRoles[selectedRoleIdx] };
      if (!role.permissions) role.permissions = [];
      const permIdx = role.permissions.findIndex((p: any) => p.name === moduleName);
      if (permIdx >= 0) {
        role.permissions[permIdx] = { ...role.permissions[permIdx], [action]: !role.permissions[permIdx][action] };
      } else {
        const newPerm = { name: moduleName, v: false, c: false, e: false, d: false };
        (newPerm as any)[action] = true;
        role.permissions.push(newPerm);
      }
      newRoles[selectedRoleIdx] = role;
      return newRoles;
    });
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

              <button onClick={handleSaveSettings} disabled={false} className={`w-full py-3 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 ${saveSuccess ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : saveSuccess ? <CheckCircle size={20} /> : <Save size={20} />}
                {isSaving ? 'جاري الحفظ...' : saveSuccess ? 'تم الحفظ بنجاح' : 'حفظ بيانات المؤسسة'}
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
                <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition-colors">
                  + فرع جديد
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-emerald-800">الفرع الرئيسي (الرياض)</h4>
                    <p className="text-xs text-emerald-600">مركز تكلفة: CC-001 • المستودع الرئيسي</p>
                  </div>
                  <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="text-emerald-700 hover:bg-emerald-100 p-2 rounded-lg transition-colors">تعديل</button>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:border-emerald-200 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-700">فرع جدة</h4>
                    <p className="text-xs text-slate-500">مركز تكلفة: CC-002 • مستودع الغربية</p>
                  </div>
                  <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors">تعديل</button>
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
                <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="bg-orange-100 text-orange-700 p-2 rounded-lg hover:bg-orange-200 transition-colors">
                  + جديد
                </button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {roles.map((role, idx) => (
                  <button key={idx} onClick={() => setSelectedRoleIdx(idx)} className={`w-full text-right p-4 rounded-xl border transition-all ${selectedRoleIdx === idx ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:border-orange-200'}`}>
                    <div className="font-bold text-slate-800">{role.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{role.isAbsolute ? 'صلاحيات مطلقة' : 'مخصص'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Key size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">مصفوفة الصلاحيات لـ {roles[selectedRoleIdx]?.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {permissionsSaveSuccess && (
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg">تم الحفظ بنجاح</span>
                  )}
                  <button onClick={handleSavePermissions} disabled={false} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    {isSavingPermissions ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={16} />}
                    حفظ الصلاحيات
                  </button>
                </div>
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
                      'فاتورة المبيعات',
                      'سندات القبض والصرف',
                      'بطاقات الأصناف',
                      'القيود المحاسبية',
                      'إعدادات المنشأة',
                    ].map((modName, idx) => {
                      const currentRole = roles[selectedRoleIdx];
                      const isAbs = currentRole?.isAbsolute;
                      const perm = currentRole?.permissions?.find((p: any) => p.name === modName) || { v: false, c: false, e: false, d: false };
                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-800">{modName}</td>
                          <td className="p-3 text-center"><input type="checkbox" checked={isAbs || perm.v} onChange={() => handlePermissionToggle(modName, 'v')} disabled={false} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" /></td>
                          <td className="p-3 text-center"><input type="checkbox" checked={isAbs || perm.c} onChange={() => handlePermissionToggle(modName, 'c')} disabled={false} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" /></td>
                          <td className="p-3 text-center"><input type="checkbox" checked={isAbs || perm.e} onChange={() => handlePermissionToggle(modName, 'e')} disabled={false} className="w-5 h-5 accent-indigo-600 rounded cursor-pointer" /></td>
                          <td className="p-3 text-center"><input type="checkbox" checked={isAbs || perm.d} onChange={() => handlePermissionToggle(modName, 'd')} disabled={false} className="w-5 h-5 accent-rose-600 rounded cursor-pointer" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h4 className="font-bold text-rose-600 mb-2 flex items-center gap-2"><Shield size={18}/> تجميد العمليات المحاسبية (إقفال الفترات)</h4>
                <p className="text-sm text-slate-600 mb-4">منع أي مستخدم من إضافة أو تعديل أو حذف أي حركة مالية أو مخزنية قبل هذا التاريخ.</p>
                <div className="flex items-center gap-4">
                  <input type="date" className="p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none" />
                  <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors">تطبيق الإقفال</button>
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
              <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-emerald-200">
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
                  <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-lg transition-colors">
                    استعادة
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => alert("تمت العملية بنجاح (قيد التطوير)")} className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200 border-dashed">
              رفع ملف نسخة احتياطية خارجي (.bak)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
