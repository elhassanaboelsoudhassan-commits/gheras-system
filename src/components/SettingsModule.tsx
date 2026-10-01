import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Save, RefreshCw, Building, Upload, Image as ImageIcon } from 'lucide-react';

const SettingsModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'إعدادات المؤسسة' }) => {
  const user = JSON.parse(localStorage.getItem('gheras_admin') || '{}');
  const isAdmin = user.email === 'elhassanelsoudy@gmail.com';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        عذراً، هذه الصفحة مخصصة للمسؤولين فقط.
      </div>
    );
  }

  // Company Settings Form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    commercialRegister: '',
    taxNumber: '',
    address: '',
    phone: '',
    email: '',
    logoUrl: ''
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      if (!db) return;
      const docRef = doc(db, 'settings', 'company_profile');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCompanyForm(docSnap.data() as any);
      }
    } catch (e) {
      console.error("Firestore fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveCompany = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!companyForm.name) throw new Error("اسم المؤسسة مطلوب");
      
      const docRef = doc(db, 'settings', 'company_profile');
      await setDoc(docRef, {
        ...companyForm,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setSuccessMsg('تم حفظ بيانات المؤسسة بنجاح');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {['إعدادات المؤسسة', 'الضرائب', 'المستخدمين والصلاحيات'].map(tab => (
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

      {!loading && activeTab === 'إعدادات المؤسسة' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in max-w-4xl mx-auto">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Building /> إعدادات وبيانات المؤسسة</h3>
          </div>
          
          <div className="p-8 space-y-6">
            {errorMsg && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold">{errorMsg}</div>}
            {successMsg && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">{successMsg}</div>}
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Logo Section */}
              <div className="w-full md:w-1/3 flex flex-col items-center space-y-4 border-l border-slate-100 pl-8">
                <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-slate-50 text-slate-400 overflow-hidden relative group">
                  {companyForm.logoUrl ? (
                    <img src={companyForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">شعار المؤسسة</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <Upload className="text-white" size={24} />
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="رابط الشعار (URL)..." 
                  value={companyForm.logoUrl} 
                  onChange={e => setCompanyForm({...companyForm, logoUrl: e.target.value})} 
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-center"
                />
                <p className="text-xs text-slate-500 text-center">أدخل رابط الصورة أو قم برفعها (قيد التطوير للرفع المباشر)</p>
              </div>

              {/* Details Section */}
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المؤسسة (الشركة)</label>
                  <input type="text" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">السجل التجاري (CR)</label>
                    <input type="text" value={companyForm.commercialRegister} onChange={e => setCompanyForm({...companyForm, commercialRegister: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">الرقم الضريبي (VAT Number)</label>
                    <input type="text" value={companyForm.taxNumber} onChange={e => setCompanyForm({...companyForm, taxNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">العنوان الوطني</label>
                  <input type="text" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                    <input type="text" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white transition-colors" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                    <input type="email" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white transition-colors" dir="ltr" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={handleSaveCompany} disabled={saving} className="px-8 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
              {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />} حفظ إعدادات المؤسسة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsModule;
