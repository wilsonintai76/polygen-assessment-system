
import React, { useState, useMemo } from 'react';
import { Course, MatrixRow, CISTCognitiveLevel, AssessmentDomain, LearningDomain, Taxonomy, ItemType, DublinAccord } from '../../types';
import { CISTTableHeader } from './CISTTableHeader';
import { CISTTableRow } from './CISTTableRow';
import { convertMatrixToBlueprints } from '../../utils/cistConverter';

import { PolyGenAssistant } from '../PolyGenAssistant';
import { autoGenerateConstructs } from '../../services/aiService';

interface CISTTemplateManagerProps {
  course: Course;
  learningDomains: LearningDomain[];
  taxonomies: Taxonomy[];
  itemTypes: ItemType[];
  dublinAccords: DublinAccord[];
  onSave: (updatedCourse: Course) => void;
  onCancel: () => void;
  showToast?: (message: string, section: string) => void;
}

export const CISTTemplateManager: React.FC<CISTTemplateManagerProps> = ({ 
  course, 
  learningDomains, 
  taxonomies, 
  itemTypes, 
  dublinAccords,
  onSave, 
  onCancel,
  showToast
}) => {
  const [activeDomainId, setActiveDomainId] = useState<string>(() => {
    return learningDomains.find(d => d.name === 'Cognitive')?.id || learningDomains[0]?.id || '';
  });

  const activeDomainName = useMemo(() => {
    return learningDomains.find(d => d.id === activeDomainId)?.name || 'Cognitive';
  }, [activeDomainId, learningDomains]);

  // Source CLO keys from the Course Definition
  const CLO_KEYS = useMemo(() => Object.keys(course.clos || {}), [course.clos]);

  // Determine the taxonomy levels for the active domain
  const levels = useMemo(() => {
    const domainTaxonomies = taxonomies.filter(t => t.domain_id === activeDomainId);
    const fullList = domainTaxonomies.map(t => t.level).sort();
    
    const policies = course.assessmentPolicies || [];
    
    // Find the absolute highest level required by any assessment task in this domain
    let maxFoundIdx = -1;
    policies.forEach(p => {
      const maxTax = p.maxTaxonomy || '';
      const idx = fullList.indexOf(maxTax);
      if (idx > maxFoundIdx) maxFoundIdx = idx;
    });

    // Default to the full list if no policies are defined, 
    // otherwise slice up to the max taxonomy defined in the syllabus.
    return maxFoundIdx === -1 ? fullList : fullList.slice(0, maxFoundIdx + 1);
  }, [activeDomainId, taxonomies, course.assessmentPolicies]);

  const itemTypeCodes = useMemo(() => itemTypes.map(it => it.code), [itemTypes]);

  const [template, setTemplate] = useState<MatrixRow[]>(() => {
    return (course.jsuTemplate || []).map(row => ({
      ...row,
      levels: row.levels || {},
      domain: row.domain || 'Cognitive'
    }));
  });

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  const handleAutoGenerate = async () => {
    if (!course.syllabus) {
      if (showToast) showToast("Please provide a syllabus in the Course Registry first!", "Error");
      return;
    }

    setIsAutoGenerating(true);
    try {
      const tasks = Array.from(new Set(template.map(r => r.task).filter(Boolean) as string[]));
      const topics = course.topics || [];
      const clos = Object.values(course.clos || {});

      const suggestions = await autoGenerateConstructs({
        syllabus: course.syllabus,
        topics: topics,
        clos: clos,
        tasks: tasks
      });

      setTemplate(prev => prev.map(row => {
        const suggestion = suggestions.find(s => s.task === row.task);
        if (suggestion) {
          return { ...row, construct: suggestion.construct };
        }
        return row;
      }));
      if (showToast) showToast("Constructs auto-generated successfully.", "CIST Blueprint");
    } catch (error) {
      console.error("Auto-generate failed:", error);
      if (showToast) showToast("Failed to auto-generate constructs.", "Error");
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const domainRows = useMemo(() => template.filter(r => r.domain === activeDomainName), [template, activeDomainName]);

  const duplicateMap = useMemo(() => {
    const globalTaskNumbers: Record<string, Record<string, number>> = {};
    domainRows.forEach(row => {
      const task = (row.task || '').trim().toUpperCase();
      if (!task) return;
      if (!globalTaskNumbers[task]) globalTaskNumbers[task] = {};
      Object.values(row.levels || {}).forEach(ld => {
        const n = (ld.count || '').trim();
        if (n) globalTaskNumbers[task][n] = (globalTaskNumbers[task][n] || 0) + 1;
      });
    });

    const duplicates: Record<number, Record<string, boolean>> = {};
    domainRows.forEach((row, rowIdx) => {
      const task = (row.task || '').trim().toUpperCase();
      duplicates[rowIdx] = {};
      Object.entries(row.levels || {}).forEach(([lk, ld]) => {
        const n = (ld.count || '').trim();
        if (n && task && globalTaskNumbers[task][n] > 1) {
          duplicates[rowIdx][lk] = true;
        }
      });
    });
    return duplicates;
  }, [domainRows]);

  const rowSpans = useMemo(() => {
    const spans: Record<string, number[]> = {
      task: new Array(domainRows.length).fill(1),
      topicCode: new Array(domainRows.length).fill(1),
      clos: new Array(domainRows.length).fill(1),
      construct: new Array(domainRows.length).fill(1),
      itemTypes: new Array(domainRows.length).fill(1),
      totalMark: new Array(domainRows.length).fill(1)
    };

    // 1. Calculate Task Spans first
    for (let i = 0; i < domainRows.length; i++) {
      let span = 1;
      const currentTask = domainRows[i].task;
      if (!currentTask) continue;
      
      for (let j = i + 1; j < domainRows.length; j++) {
        if (domainRows[j].task === currentTask) {
          span++;
          spans.task[j] = 0;
        } else break;
      }
      spans.task[i] = span;
      i += span - 1;
    }

    // 2. Calculate other spans, restricted by task boundaries
    // CLOs, Item Types, Construct, and Total Mark now always merge per task
    for (let i = 0; i < domainRows.length; i++) {
      spans.clos[i] = spans.task[i];
      spans.itemTypes[i] = spans.task[i];
      spans.construct[i] = spans.task[i];
      spans.totalMark[i] = spans.task[i];
    }

    // Topic code usually doesn't merge across different topics even if they have same code? 
    // Actually topicCode should probably follow the same logic if they are identical.
    for (let i = 0; i < domainRows.length; i++) {
      let span = 1;
      const currentVal = domainRows[i].topicCode;
      const currentTask = domainRows[i].task;
      if (!currentVal) { i++; continue; }
      for (let j = i + 1; j < domainRows.length; j++) {
        if (domainRows[j].task === currentTask && domainRows[j].topicCode === currentVal) {
          span++; spans.topicCode[j] = 0;
        } else break;
      }
      spans.topicCode[i] = span; i += span - 1;
    }

    return spans;
  }, [domainRows]);

  const taskTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let i = 0; i < domainRows.length; i++) {
      if (rowSpans.task[i] > 0) {
        let sum = 0;
        for (let j = i; j < i + rowSpans.task[i]; j++) {
          sum += domainRows[j].totalMark || 0;
        }
        totals[i] = sum;
      }
    }
    return totals;
  }, [domainRows, rowSpans.task]);

  const addRow = () => {
    const newRow: MatrixRow = {
      task: '',
      clos: [],
      topicCode: '',
      domain: activeDomainName as AssessmentDomain,
      levels: levels.reduce((acc, l) => {
        acc[l] = { count: '', marks: 0 };
        return acc;
      }, {} as Record<string, CISTCognitiveLevel>),
      totalMark: 0,
      construct: '',
      itemTypes: []
    };
    setTemplate([...template, newRow]);
  };

  const updateRowInGlobal = (rowToUpdate: MatrixRow, updates: Partial<MatrixRow>) => {
    setTemplate(prev => {
      const idx = prev.findIndex(r => r === rowToUpdate);
      if (idx === -1) return prev;
      
      const next = [...prev];
      const task = rowToUpdate.task;
      const domain = rowToUpdate.domain;

      // If updating task-level fields, update all rows in the same task/domain
      const taskFields: (keyof MatrixRow)[] = ['clos', 'itemTypes', 'construct'];
      const isTaskUpdate = Object.keys(updates).some(k => taskFields.includes(k as keyof MatrixRow));

      if (isTaskUpdate && task) {
        prev.forEach((r, i) => {
          if (r.task === task && r.domain === domain) {
            next[i] = { ...next[i], ...updates };
          }
        });
      } else {
        next[idx] = { ...next[idx], ...updates };
      }
      
      return next;
    });
  };

  const removeRowFromGlobal = (rowToRemove: MatrixRow) => {
    setTemplate(prev => prev.filter(r => r !== rowToRemove));
  };

  const toggleArrayItemInGlobal = (rowToUpdate: MatrixRow, field: 'clos' | 'itemTypes', value: string) => {
    const current = [...(rowToUpdate[field] || [])];
    const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
    updateRowInGlobal(rowToUpdate, { [field]: next });
  };

  const totals = useMemo(() => {
    const levelTotals = levels.reduce((acc, level) => {
      acc[level] = domainRows.reduce((sum, row) => sum + (row.levels?.[level]?.marks || 0), 0);
      return acc;
    }, {} as Record<string, number>);
    return { levelTotals, grandTotal: Object.values(levelTotals).reduce((a, b) => a + b, 0) };
  }, [domainRows, levels]);

  return (
    <div className="p-8 max-w-[1800px] mx-auto bg-white min-h-screen animate-in fade-in duration-500 overflow-x-auto print-exact custom-scrollbar">
      <div className="border-2 border-black mb-6">
        <div className="bg-white p-6 flex flex-col items-center border-b-2 border-black text-center text-black">
          <div className="mb-2">
             <h1 className="text-3xl font-black uppercase tracking-tight leading-none">POLITEKNIK MALAYSIA KUCHING SARAWAK</h1>
             <p className="text-base font-black mt-2">JABATAN KEJURUTERAAN MEKANIKAL</p>
          </div>
          <h2 className="text-xl font-black uppercase border-t-2 border-black pt-3 mt-3 w-full tracking-widest bg-slate-50">COURSEWORK ITEM SPECIFICATION TABLE (CIST)</h2>
        </div>
        <div className="grid grid-cols-2 text-xs font-black uppercase bg-white">
           <div className="p-3.5 border-r-2 border-black text-black">DEPARTMENT : JABATAN KEJURUTERAAN MEKANIKAL</div>
           <div className="p-3.5 text-black">COURSE NAME : {course.name || 'N/A'}</div>
           <div className="p-3.5 border-t-2 border-r-2 border-black text-black">COURSE CODE : {course.code || 'N/A'}</div>
           <div className="p-3.5 border-t-2 border-black text-black">SESSION : II 2024/2025</div>
        </div>
      </div>

      <div className="border-2 border-black mb-6 p-6 text-xs bg-slate-50">
        <h3 className="font-black underline mb-4 uppercase text-sm text-black">Course Learning Outcome (CLO)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
          {Object.entries(course.clos || {}).map(([key, val]) => (
            <div key={key} className="flex gap-4 items-start font-bold">
              <span className="shrink-0 bg-blue-600 text-white px-2 py-0.5 rounded text-[10px]">{key}</span>
              <span className="text-black">{val || 'Pending description...'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-4 no-print">
        {learningDomains.map(d => (
          <button key={d.id} onClick={() => setActiveDomainId(d.id)} className={`px-8 py-3 rounded-t-2xl font-black uppercase tracking-widest text-[10px] transition-all border-x-2 border-t-2 ${activeDomainId === d.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}>
            {d.name} DOMAIN
          </button>
        ))}
      </div>

      <div className="overflow-x-auto mb-10 shadow-xl border-2 border-black bg-white">
        <table className="w-full border-collapse text-[10px] uppercase font-bold text-center">
          <CISTTableHeader levels={levels} cloKeys={CLO_KEYS} itemTypes={itemTypeCodes} domainLabel={activeDomainName} />
          <tbody className="bg-white divide-y divide-black/20">
            {domainRows.map((row, idx) => (
              <CISTTableRow 
                key={idx} row={row} index={idx} levels={levels} cloKeys={CLO_KEYS} itemTypes={itemTypeCodes}
                onUpdate={(updates) => updateRowInGlobal(row, updates)}
                onToggleArray={(f, v) => toggleArrayItemInGlobal(row, f, v)}
                onRemove={() => removeRowFromGlobal(row)} course={course} duplicateLevels={duplicateMap[idx]}
                spans={{ 
                  task: rowSpans.task[idx], 
                  topicCode: rowSpans.topicCode[idx], 
                  clos: rowSpans.clos[idx], 
                  construct: rowSpans.construct[idx], 
                  itemTypes: rowSpans.itemTypes[idx],
                  totalMark: rowSpans.totalMark[idx]
                }}
                taskTotalMark={taskTotals[idx]}
              />
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black">
             <tr className="bg-[#F4F9FF] h-12">
               <td colSpan={CLO_KEYS.length + 2} className="border-r-2 border-black font-black uppercase text-xs text-right pr-6 text-black">TOTALS</td>
               {levels.map(level => (
                 <React.Fragment key={level}>
                   <td className="border-r border-black bg-slate-100"></td>
                   <td className="border-r-2 border-black bg-white font-black text-blue-700 text-sm">{totals.levelTotals[level]}</td>
                 </React.Fragment>
               ))}
               <td className="border-r-2 border-black bg-blue-50 font-black text-base text-black">{totals.grandTotal}</td>
               <td colSpan={itemTypeCodes.length + 1} className="bg-slate-50"></td>
               <td className="no-print"></td>
             </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-4 mb-12 no-print">
        <button onClick={addRow} className="flex-grow py-6 bg-slate-900 text-white rounded-3xl hover:bg-slate-800 transition-all uppercase font-black tracking-[0.3em] text-xs shadow-2xl">
          + Add New {activeDomainName} entry
        </button>
        <button 
          onClick={handleAutoGenerate} 
          disabled={isAutoGenerating}
          className="px-12 py-6 bg-amber-500 text-white rounded-3xl hover:bg-amber-600 transition-all uppercase font-black tracking-[0.2em] text-xs shadow-2xl disabled:opacity-50 flex items-center gap-3"
        >
          {isAutoGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <span>✨</span>
              Auto-Generate Constructs
            </>
          )}
        </button>
      </div>
      <div className="mt-20 pt-10 border-t-8 border-slate-900 flex justify-end gap-8 no-print pb-20">
         <button onClick={onCancel} className="px-12 py-5 text-slate-400 font-black uppercase text-sm tracking-widest hover:text-rose-500">Discard Blueprint</button>
         <button onClick={() => {
            // Calculate task totals for all rows across all domains before saving
            const updatedTemplate = template.map(row => {
              if (!row.task) return row;
              const taskTotal = template
                .filter(r => r.task === row.task && r.domain === row.domain)
                .reduce((sum, r) => {
                  return sum + Object.values(r.levels || {}).reduce((s, l) => s + (l.marks || 0), 0);
                }, 0);
              return { ...row, totalMark: taskTotal };
            });

            const blueprints = convertMatrixToBlueprints(course, updatedTemplate, learningDomains, taxonomies, itemTypes, dublinAccords);
            onSave({...course, jsuTemplate: updatedTemplate, blueprints: blueprints});
         }} className="bg-blue-600 text-white px-20 py-6 rounded-full font-black shadow-2xl hover:bg-blue-700 transition transform active:scale-95 uppercase text-sm tracking-[0.3em]">Save All Domains to Registry</button>
      </div>
      <PolyGenAssistant />
    </div>
  );
};
