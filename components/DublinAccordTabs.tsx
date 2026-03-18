import React, { useState } from 'react';
import { DublinAccord } from '../types';

interface DublinAccordTabsProps {
  standards: DublinAccord[];
}

export const DublinAccordTabs: React.FC<DublinAccordTabsProps> = ({ standards }) => {
  const [activeTab, setActiveTab] = useState<'DK' | 'DP' | 'NA'>('DK');

  const grouped = {
    DK: standards.filter(s => s.profile_type === 'DK'),
    DP: standards.filter(s => s.profile_type === 'DP'),
    NA: standards.filter(s => s.profile_type === 'NA'),
  };

  const tabs = [
    { id: 'DK', label: 'DK: Knowledge Profile', desc: 'Procedural & Codified' },
    { id: 'DP', label: 'DP: Problem Solving', desc: 'Well-defined' },
    { id: 'NA', label: 'NA: Engineering Activities', desc: 'Defined' },
  ] as const;

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              activeTab === tab.id
                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-indigo-200'
            }`}
          >
            <h3 className={`font-bold ${activeTab === tab.id ? 'text-indigo-900' : 'text-slate-900'}`}>
              {tab.label}
            </h3>
            <p className={`text-sm ${activeTab === tab.id ? 'text-indigo-700' : 'text-slate-500'}`}>
              {tab.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {tabs.find(t => t.id === activeTab)?.label}
        </h2>
        <div className="space-y-4">
          {grouped[activeTab].map((standard) => (
            <div key={standard.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="font-semibold text-slate-900 mb-1">
                {standard.code}: {standard.title}
              </h4>
              <p className="text-sm text-slate-600">{standard.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
