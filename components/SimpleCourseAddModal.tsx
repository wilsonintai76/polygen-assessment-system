
import React, { useState } from 'react';
import { Course, Department, Programme } from '../types';

interface SimpleCourseAddModalProps {
  onSave: (course: Partial<Course>) => void;
  onCancel: () => void;
  departments: Department[];
  programmes: Programme[];
  showToast?: (message: string, section: string) => void;
}

export const SimpleCourseAddModal: React.FC<SimpleCourseAddModalProps> = ({ 
  onSave, onCancel, departments, programmes, showToast 
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    deptId: '',
    programmeId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.deptId || !formData.programmeId) {
      if (showToast) showToast("Please fill in all required fields.", "Error");
      return;
    }
    onSave({
      ...formData,
      clos: { 'CLO 1': '' },
      da: {},
      topics: [],
      assessmentPolicies: []
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-slate-200">
        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Register New Course</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Stage 1: Initial Shell Creation</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition flex items-center justify-center font-bold text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Parent Department</label>
                <select 
                  className="w-full border-2 border-slate-100 bg-white rounded-2xl p-4 outline-none focus:border-blue-400 transition font-bold text-slate-700 shadow-sm"
                  value={formData.deptId}
                  onChange={e => setFormData({...formData, deptId: e.target.value, programmeId: ''})}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Target Programme</label>
                <select 
                  className="w-full border-2 border-slate-100 bg-white rounded-2xl p-4 outline-none focus:border-blue-400 transition font-bold text-slate-700 shadow-sm disabled:opacity-50"
                  value={formData.programmeId}
                  disabled={!formData.deptId}
                  onChange={e => setFormData({...formData, programmeId: e.target.value})}
                  required
                >
                  <option value="">-- Select Programme --</option>
                  {programmes.filter(p => p.deptId === formData.deptId).map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Code</label>
                <input 
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 transition font-black text-slate-700 bg-slate-50 shadow-inner" 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                  placeholder="e.g. DJJ10243"
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Name</label>
                <input 
                  className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 transition font-black text-slate-700 bg-slate-50 shadow-inner" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} 
                  placeholder="e.g. WORKSHOP TECHNOLOGY"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onCancel} className="px-8 py-4 text-slate-400 font-black uppercase text-[11px] tracking-widest hover:text-rose-500 transition">Cancel</button>
            <button type="submit" className="flex-grow bg-blue-600 text-white font-black py-5 rounded-3xl shadow-2xl hover:bg-blue-700 transition uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98]">
              Create Course Shell
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
