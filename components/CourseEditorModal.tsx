
import React, { useMemo, useState } from 'react';
import { Course, Department, Programme, GlobalMqf, AssessmentTaskPolicy, LearningDomain, Taxonomy, DublinAccord } from '../types';

interface CourseEditorModalProps {
  course: Course;
  onSave: (course: Course) => void;
  onCancel: () => void;
  onUpdate: (course: Course) => void;
  departments: Department[];
  programmes: Programme[];
  globalMqfs: GlobalMqf[];
  dublinAccords: DublinAccord[];
  learningDomains: LearningDomain[];
  taxonomies: Taxonomy[];
}

type Tab = 'identity' | 'clos' | 'topics' | 'policies' | 'mqfs' | 'syllabus';

export const CourseEditorModal: React.FC<CourseEditorModalProps> = ({ 
  course, onSave, onCancel, onUpdate, departments, programmes, learningDomains, taxonomies, globalMqfs, dublinAccords 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const TABS: Tab[] = ['identity', 'clos', 'topics', 'policies', 'mqfs', 'syllabus'];
  const currentIdx = TABS.indexOf(activeTab);

  const handleNext = () => {
    if (currentIdx < TABS.length - 1) setActiveTab(TABS[currentIdx + 1]);
  };

  const handleBack = () => {
    if (currentIdx > 0) setActiveTab(TABS[currentIdx - 1]);
  };

  const taxonomyOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    learningDomains.forEach(domain => {
      options[domain.name] = taxonomies
        .filter(t => t.domain_id === domain.id)
        .map(t => t.level)
        .sort();
    });
    return options;
  }, [learningDomains, taxonomies]);



  const updateMapKey = (mapType: 'clos', oldKey: string, newKey: string) => {
    const currentMap = { ...course[mapType] };
    const value = currentMap[oldKey];
    const newMap: Record<string, string> = {};
    
    Object.keys(currentMap).forEach(k => {
      if (k === oldKey) newMap[newKey] = value;
      else newMap[k] = currentMap[k];
    });

    onUpdate({ ...course, [mapType]: newMap });
  };

  const updateMapValue = (mapType: 'clos', key: string, newValue: string) => {
    onUpdate({
      ...course,
      [mapType]: { ...course[mapType], [key]: newValue }
    });
  };

  const toggleMqfTaskMapping = (policyId: string, mqfCode: string) => {
    const currentMappings = { ...(course.mqfMappings || {}) };
    const mqfs = currentMappings[policyId] || [];
    const isAdding = !mqfs.includes(mqfCode);
    
    const nextMqfs = isAdding 
      ? [...mqfs, mqfCode]
      : mqfs.filter(c => c !== mqfCode);
    
    const nextMappings = { ...currentMappings, [policyId]: nextMqfs };
    
    // Update the flat mqfs dictionary for definitions
    const nextMqfDefs = { ...(course.mqfs || {}) };
    if (isAdding) {
      const allStandards = [...(globalMqfs || []), ...(dublinAccords || [])];
      const standard = allStandards.find(s => s.code === mqfCode);
      if (standard) {
        nextMqfDefs[mqfCode] = standard.description;
      }
    } else {
      // Check if still used elsewhere
      const stillUsed = Object.values(nextMappings).some(codes => codes.includes(mqfCode));
      if (!stillUsed) {
        delete nextMqfDefs[mqfCode];
      }
    }

    onUpdate({
      ...course,
      mqfMappings: nextMappings,
      mqfs: nextMqfDefs
    });
  };

  const removeItem = (mapType: 'clos', key: string) => {
    const newMap = { ...course[mapType] };
    delete newMap[key];
    
    onUpdate({ ...course, [mapType]: newMap });
  };

  const addClo = () => {
    const existing = Object.keys(course.clos || {});
    const nextNum = existing.length + 1;
    const newKey = `CLO ${nextNum}`;
    onUpdate({ ...course, clos: { ...(course.clos || {}), [newKey]: '' } });
  };

  const addTopic = () => {
    const currentTopics = course.topics || [];
    onUpdate({ ...course, topics: [...currentTopics, ''] });
  };

  const updateTopic = (idx: number, val: string) => {
    const currentTopics = [...(course.topics || [])];
    currentTopics[idx] = val;
    onUpdate({ ...course, topics: currentTopics });
  };

  const removeTopic = (idx: number) => {
    const currentTopics = [...(course.topics || [])];
    currentTopics.splice(idx, 1);
    onUpdate({ ...course, topics: currentTopics });
  };

  const addPolicy = () => {
    const current = course.assessmentPolicies || [];
    const newPolicy: AssessmentTaskPolicy = {
      id: crypto.randomUUID(),
      name: '',
      weightage: 0,
      duration: '45 MINUTES',
      maxTaxonomy: 'C3',
      linkedTopics: [],
      linkedClos: []
    };
    onUpdate({ ...course, assessmentPolicies: [...current, newPolicy] });
  };

  const updatePolicy = (id: string, updates: Partial<AssessmentTaskPolicy>) => {
    const next = (course.assessmentPolicies || []).map(p => p.id === id ? { ...p, ...updates } : p);
    onUpdate({ ...course, assessmentPolicies: next });
  };

  const togglePolicyItem = (id: string, field: 'linkedTopics' | 'linkedClos', value: string) => {
    const p = (course.assessmentPolicies || []).find(x => x.id === id);
    if (!p) return;
    const current = [...p[field]];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    updatePolicy(id, { [field]: next });
  };

  const handleFinalSave = () => {
    onSave(course);
  };

  const tabClass = (t: Tab) => `flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-4 ${
    activeTab === t ? 'text-blue-600 border-blue-600 bg-blue-50/30' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'
  }`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="px-10 py-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Course Registry Editor</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry: {course.code || 'Drafting...'}</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition flex items-center justify-center font-bold text-2xl">&times;</button>
        </div>

        <div className="flex bg-white shrink-0 border-b">
           <button onClick={() => setActiveTab('identity')} className={tabClass('identity')}>1. Core Metadata</button>
           <button onClick={() => setActiveTab('clos')} className={tabClass('clos')}>2. Learning Outcomes</button>
           <button onClick={() => setActiveTab('topics')} className={tabClass('topics')}>3. Course Topics</button>
           <button onClick={() => setActiveTab('policies')} className={tabClass('policies')}>4. Assessment Policies</button>
           <button onClick={() => setActiveTab('mqfs')} className={tabClass('mqfs')}>5. Standards Mapping</button>
           <button onClick={() => setActiveTab('syllabus')} className={tabClass('syllabus')}>6. Syllabus Context</button>
        </div>
        
        <div className="p-10 overflow-y-auto custom-scrollbar bg-white flex-grow">
           {activeTab === 'identity' && (
             <div className="space-y-10 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-blue-50/30 p-8 rounded-[32px] border border-blue-100/50 shadow-inner">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Parent Department</label>
                    <select 
                      className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-blue-400 transition font-bold text-slate-700 shadow-sm"
                      value={course.deptId || ''}
                      onChange={e => onUpdate({...course, deptId: e.target.value, programmeId: ''})}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">Target Programme</label>
                    <select 
                      className="w-full border-2 border-white bg-white rounded-2xl p-4 outline-none focus:border-blue-400 transition font-bold text-slate-700 shadow-sm disabled:opacity-50"
                      value={course.programmeId || ''}
                      disabled={!course.deptId}
                      onChange={e => onUpdate({...course, programmeId: e.target.value})}
                    >
                      <option value="">-- Select Programme --</option>
                      {programmes.filter(p => p.deptId === course.deptId).map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Code</label>
                    <input className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 transition font-black text-slate-700 bg-slate-50 shadow-inner" value={course.code || ''} onChange={e => onUpdate({...course, code: e.target.value.toUpperCase()})} placeholder="e.g. DJJ10243" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Name</label>
                    <input className="w-full border-2 border-slate-50 rounded-2xl p-4 outline-none focus:border-blue-400 transition font-black text-slate-700 bg-slate-50 shadow-inner" value={course.name || ''} onChange={e => onUpdate({...course, name: e.target.value.toUpperCase()})} placeholder="e.g. WORKSHOP TECHNOLOGY" />
                  </div>
               </div>
             </div>
           )}

           {activeTab === 'clos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-[11px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      Course Learning Outcomes (CLOS)
                   </h4>
                   <button onClick={addClo} className="bg-purple-600 text-white font-black text-[10px] uppercase px-4 py-2 rounded-xl hover:bg-purple-700 transition shadow-lg">+ Add CLO</button>
                </div>
                 <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-50 border-b border-slate-200">
                       <tr>
                         <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Code</th>
                         <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                         <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                       {Object.entries(course.clos || {}).map(([key, val]) => (
                         <tr key={key} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="px-4 py-2 align-top">
                             <input className="w-full border border-transparent hover:border-slate-200 focus:border-purple-400 rounded-lg p-2 text-xs font-black text-slate-800 outline-none bg-transparent transition text-center uppercase" defaultValue={key} placeholder="CODE" onBlur={e => updateMapKey('clos', key, e.target.value)} />
                           </td>
                           <td className="px-4 py-2 align-top">
                             <textarea 
                               className="w-full border border-transparent hover:border-slate-200 focus:border-purple-400 rounded-lg p-2 text-xs outline-none bg-transparent transition resize-none font-medium italic leading-relaxed overflow-hidden" 
                               value={val || ''} 
                               onChange={e => {
                                 updateMapValue('clos', key, e.target.value);
                                 e.target.style.height = 'auto';
                                 e.target.style.height = e.target.scrollHeight + 'px';
                               }} 
                               placeholder="Outcome description..." 
                               rows={1}
                               ref={(el) => {
                                 if (el) {
                                   el.style.height = 'auto';
                                   el.style.height = el.scrollHeight + 'px';
                                 }
                               }}
                             />
                           </td>
                           <td className="px-4 py-2 align-top text-center">
                             <button onClick={() => removeItem('clos', key)} className="w-8 h-8 inline-flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors text-lg">&times;</button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   {Object.keys(course.clos || {}).length === 0 && (
                     <div className="text-center py-10 bg-slate-50">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No CLOs defined yet. Click &quot;+ Add CLO&quot; to begin.</p>
                     </div>
                   )}
                 </div>
              </div>
           )}

           {activeTab === 'topics' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                   <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Course Syllabus Topics
                   </h4>
                   <button onClick={addTopic} className="bg-emerald-600 text-white font-black text-[10px] uppercase px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-lg">+ Add Topic</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">No.</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Title</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(course.topics || []).map((topic, idx) => (
                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2 align-middle text-center font-black text-slate-300 text-sm">
                            T{idx + 1}.
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <input 
                              className="w-full border border-transparent hover:border-slate-200 focus:border-emerald-400 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none bg-transparent transition" 
                              value={topic} 
                              onChange={e => updateTopic(idx, e.target.value)} 
                              placeholder={`Topic ${idx + 1} title`} 
                            />
                          </td>
                          <td className="px-4 py-2 align-middle text-center">
                            <button onClick={() => removeTopic(idx)} className="w-8 h-8 inline-flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors text-lg">&times;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!course.topics || course.topics.length === 0) && (
                    <div className="text-center py-10 bg-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Topics defined yet. Click &quot;+ Add Topic&quot; to begin.</p>
                    </div>
                  )}
                </div>
              </div>
           )}

           {activeTab === 'policies' && (
              <div className="space-y-10 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                   <div>
                     <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        Institutional Assessment Policies
                     </h4>
                     <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Pre-define tasks, weightages, and taxonomy ceilings</p>
                   </div>
                   <button onClick={addPolicy} className="bg-indigo-600 text-white font-black text-[10px] uppercase px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-lg">+ Add Task Policy</button>
                </div>

                <div className="space-y-8">
                   {(course.assessmentPolicies || []).map(p => (
                     <div key={p.id} className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Task Name</label>
                              <input className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xs outline-none focus:border-indigo-400" value={p.name || ''} onChange={e => updatePolicy(p.id, { name: e.target.value.toUpperCase() })} placeholder="e.g. QUIZ 1" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Weight (%)</label>
                              <input type="number" className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xs outline-none focus:border-indigo-400 text-center" value={p.weightage ?? 0} onChange={e => updatePolicy(p.id, { weightage: parseInt(e.target.value) || 0 })} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase">Duration</label>
                              <input className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xs outline-none focus:border-indigo-400" value={p.duration || ''} onChange={e => updatePolicy(p.id, { duration: e.target.value.toUpperCase() })} placeholder="e.g. 1 HOUR" />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-rose-500 uppercase">Max Taxonomy</label>
                              <input 
                                list={`taxonomy-options-${p.id}`}
                                className="w-full border-2 border-white bg-white p-3 rounded-xl font-black text-xs outline-none focus:border-rose-400" 
                                value={p.maxTaxonomy || ''} 
                                onChange={e => updatePolicy(p.id, { maxTaxonomy: e.target.value.toUpperCase() })} 
                                placeholder="Select or type..."
                              />
                              <datalist id={`taxonomy-options-${p.id}`}>
                                 {Object.values(taxonomyOptions).flat().map(opt => <option key={opt} value={opt} />)}
                              </datalist>
                           </div>
                           <div className="flex items-end justify-end">
                              <button onClick={() => onUpdate({ ...course, assessmentPolicies: (course.assessmentPolicies || []).filter(x => x.id !== p.id) })} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Remove</button>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Enforced Topics</label>
                              <div className="flex flex-wrap gap-2">
                                 {(course.topics || []).map((t, idx) => {
                                   const code = `T${idx + 1}`;
                                   const active = p.linkedTopics.includes(code);
                                   return (
                                     <button key={code} onClick={() => togglePolicyItem(p.id, 'linkedTopics', code)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-white'}`}>{code}</button>
                                   );
                                 })}
                              </div>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Enforced CLOs</label>
                              <div className="flex flex-wrap gap-2">
                                 {(course.clos && Object.keys(course.clos).map(clo => {
                                   const active = p.linkedClos.includes(clo);
                                   return (
                                     <button key={clo} onClick={() => togglePolicyItem(p.id, 'linkedClos', clo)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${active ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-400 border border-white'}`}>{clo}</button>
                                   );
                                 })) || <span className="text-[8px] text-slate-300 uppercase italic">No CLOs defined</span>}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
           )}

           {activeTab === 'mqfs' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                   <div>
                     <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        MQF / Dublin Standard Mapping
                     </h4>
                     <p className="text-[8px] text-slate-400 font-bold mt-1">Map Global MQF/DA standards to Assessment Tasks</p>
                   </div>
                </div>
                 <div className="space-y-8">
                  {(course.assessmentPolicies || []).map(policy => (
                    <div key={policy.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-full">
                          <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-3">{policy.name || 'Unnamed Task'}</label>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {globalMqfs.map(mqf => {
                              const isMapped = (course.mqfMappings?.[policy.id] || []).includes(mqf.code);
                              return (
                                <button 
                                  key={mqf.code} 
                                  onClick={() => toggleMqfTaskMapping(policy.id, mqf.code)}
                                  title={mqf.description}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                    isMapped ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {mqf.code}
                                </button>
                              );
                            })}
                          </div>
                          <label className="text-[10px] font-black text-slate-600 uppercase ml-1 block mb-3">Dublin Accords</label>
                          <div className="flex flex-wrap gap-2">
                            {dublinAccords.map(da => {
                              const isMapped = (course.mqfMappings?.[policy.id] || []).includes(da.code);
                              return (
                                <button 
                                  key={da.code} 
                                  onClick={() => toggleMqfTaskMapping(policy.id, da.code)}
                                  title={da.description}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                    isMapped ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {da.code}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!course.assessmentPolicies || course.assessmentPolicies.length === 0) && (
                    <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Assessment Policies defined yet. Define tasks first.</p>
                    </div>
                  )}
                 </div>
              </div>
           )}

           {activeTab === 'syllabus' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                   <div>
                     <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        Full Course Syllabus Context
                     </h4>
                     <p className="text-[8px] text-slate-400 font-bold mt-1">Paste the full syllabus text here to help AI generate better constructs</p>
                   </div>
                </div>
                <div className="bg-amber-50/30 p-8 rounded-[32px] border border-amber-100/50 shadow-inner">
                  <textarea 
                    className="w-full h-[400px] border-2 border-white bg-white rounded-2xl p-6 outline-none focus:border-amber-400 transition font-medium text-slate-700 shadow-sm resize-none custom-scrollbar"
                    value={course.syllabus || ''}
                    onChange={e => onUpdate({...course, syllabus: e.target.value})}
                    placeholder="Paste syllabus content here (Topics, Sub-topics, Learning Outcomes, etc.)..."
                  />
                </div>
              </div>
           )}
        </div>

        <div className="px-10 py-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex gap-4">
              <button onClick={onCancel} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-rose-500 transition">Discard Changes</button>
              {currentIdx > 0 && (
                <button onClick={handleBack} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-50 transition">
                  &larr; Previous Step
                </button>
              )}
            </div>
            
            <div className="flex gap-4">
              {currentIdx < TABS.length - 1 ? (
                <button onClick={handleNext} className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-blue-700 transition shadow-lg flex items-center gap-3">
                  Next Step &rarr;
                </button>
              ) : (
                <button onClick={handleFinalSave} className="px-12 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-800 transition uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 active:scale-[0.98]">
                  Finalize & Save Course Registry
                </button>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};
