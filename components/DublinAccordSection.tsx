import React from 'react';
import { DublinAccord } from '../types';

interface DublinAccordSectionProps {
  standards: DublinAccord[];
  profileType: 'DK' | 'DP' | 'NA';
}

export const DublinAccordSection: React.FC<DublinAccordSectionProps> = ({ standards, profileType }) => {
  const filtered = standards.filter(s => s.profile_type === profileType);
  
  return (
    <div className="space-y-4">
      {filtered.map((standard) => (
        <div key={standard.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
          <h4 className="font-semibold text-slate-900 mb-1">
            {standard.code}: {standard.title}
          </h4>
          <p className="text-sm text-slate-600">{standard.description}</p>
        </div>
      ))}
    </div>
  );
};
