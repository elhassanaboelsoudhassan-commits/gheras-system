import React, { useState } from 'react';

const SettingsModule: React.FC<{ initialTab?: string }> = ({ initialTab = 'الإعدادات العامة' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="p-8">
      <div className="mb-8 flex overflow-x-auto gap-3 pb-2 custom-scrollbar">
        {['الإعدادات العامة'].map(tab => (
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
      <div className="flex items-center justify-center h-64 text-slate-400 text-lg">
        وحدة إعدادات المنشأة - قيد التأسيس...
      </div>
    </div>
  );
};

export default SettingsModule;
