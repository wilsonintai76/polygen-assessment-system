
import React from 'react';
import { User } from '../types';

import { api } from '../services/api';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeStep: string;
  onNavigate: (step: string) => void;
  user?: User;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  allowedRoles?: string[]; // If undefined, available to all. If defined, only these roles.
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, activeStep, onNavigate, user, onLogout, onOpenProfile }) => {
  const groups: SidebarGroup[] = [
    {
      label: 'ACADEMIC WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Command Hub', icon: '🏛️' },
      ]
    },
    {
      label: 'REPOSITORIES',
      items: [
        { id: 'setup', label: 'New Assessment', icon: '📝', allowedRoles: ['Administrator', 'Reviewer', 'Creator'] },
        { id: 'manage-bank', label: 'Question Bank', icon: '🗄️', allowedRoles: ['Administrator', 'Reviewer', 'Creator'] },
        { id: 'library', label: 'Paper Archive', icon: '📁' },
      ]
    },
    {
      label: 'INSTITUTIONAL HIERARCHY',
      items: [
        { id: 'departments', label: 'Department Manager', icon: '🏢', allowedRoles: ['Administrator'] },
        { id: 'programmes', label: 'Programme Registry', icon: '🎓', allowedRoles: ['Administrator'] },
        { id: 'courses', label: 'Course Catalog', icon: '📚', allowedRoles: ['Administrator', 'Reviewer'] },
      ]
    },
    {
      label: 'ACADEMIC STANDARDS',
      items: [
        { id: 'sessions', label: 'Session Control', icon: '⏳', allowedRoles: ['Administrator'] },
        { id: 'manage-templates', label: 'Assessment Templates', icon: '🎨', allowedRoles: ['Administrator'] },
        { id: 'global-mqf', label: 'Global MQF/DA', icon: '🧬', allowedRoles: ['Administrator'] },
        { id: 'branding', label: 'Institution Identity', icon: '⚙️', allowedRoles: ['Administrator'] },
        { id: 'users', label: 'Staff Management', icon: '👥', allowedRoles: ['Administrator'] },
      ]
    },
    {
      label: 'SUPPORT',
      items: [
        { id: 'help', label: 'User Manual', icon: '❓' },
      ]
    },
    {
      label: 'LEGAL',
      items: [
        { id: 'privacy', label: 'Privacy Policy', icon: '🛡️' },
        { id: 'terms', label: 'Terms of Service', icon: '📜' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      {/* Enterprise Sidebar */}
      <aside className="w-72 bg-[#0f172a] text-white flex flex-col shrink-0 border-r border-slate-800 shadow-2xl z-50 print:hidden">
        
        {/* Brand Identity */}
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex flex-col gap-3">
             <div className="bg-white/5 p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <img src="https://odzvkxzgoibxxybcocbr.supabase.co/storage/v1/object/public/branding/sidebar%20logo.png" alt="Sidebar Logo" className="w-12 object-contain" referrerPolicy="no-referrer" />
                <div className="flex flex-col">
                   <span className="text-xl font-black tracking-tight text-white">PolyGen</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment Paper Generator</span>
                </div>
             </div>
             <div className={`mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${api.isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${api.isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
               <span className="text-[8px] font-bold uppercase tracking-wider">{api.isSupabaseConfigured ? 'Cloud Connected' : 'Local Mode'}</span>
             </div>
          </div>
        </div>

        {/* Staff Identity Card */}
        <div className="px-6 py-6">
          <button 
            onClick={onOpenProfile}
            className="w-full bg-slate-800/40 rounded-3xl p-4 border border-slate-700/50 flex items-center gap-4 hover:bg-slate-700/50 transition-colors text-left"
          >
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border border-slate-600 shrink-0 ${
               user?.role === 'Administrator' ? 'bg-rose-500/20 text-rose-400' : 
               user?.role === 'Reviewer' ? 'bg-purple-500/20 text-purple-400' :
               user?.role === 'Endorser' ? 'bg-emerald-500/20 text-emerald-400' :
               'bg-blue-500/20 text-blue-400'
             }`}>
               {user?.full_name?.charAt(0) || 'U'}
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-black truncate text-white uppercase tracking-tight">{user?.full_name || 'Academic Staff'}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{user?.role || 'Creator'}</p>
             </div>
          </button>
        </div>

        {/* Dynamic Navigation */}
        <nav className="flex-grow overflow-y-auto px-4 space-y-8 custom-scrollbar pb-10">
          {groups.map((group, idx) => {
            const visibleItems = group.items.filter(item => !item.allowedRoles || (user?.role && item.allowedRoles.includes(user.role)));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-2">
                <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">{group.label}</h3>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[13px] font-bold ${
                        activeStep === item.id || (item.id === 'setup' && ['setup', 'cist', 'preview'].includes(activeStep))
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1' 
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <span className="text-lg opacity-80">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* System Exit */}
        <div className="p-6 mt-auto border-t border-slate-800/50 bg-slate-900/30">
          <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-50/10 transition-all font-black uppercase text-[10px] tracking-widest"
          >
             Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto bg-slate-50 h-screen custom-scrollbar relative">
        {children}
      </main>
    </div>
  );
};
