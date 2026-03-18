
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
             <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-center">
                <img 
                   src="https://odzvkxzgoibxxybcocbr.supabase.co/storage/v1/object/public/branding/PolyGen%20Logo.png" 
                   alt="PolyGen Logo" 
                   className="h-12 w-auto object-contain"
                   referrerPolicy="no-referrer"
                />
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
      <main className="flex-grow bg-slate-50 h-screen relative flex flex-col overflow-hidden">
        {/* Dashboard Header */}
        <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-xl">
                 {groups.flatMap(g => g.items).find(i => i.id === activeStep)?.icon || '🏛️'}
              </div>
              <div>
                 <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    {groups.flatMap(g => g.items).find(i => i.id === activeStep)?.label || 'Command Hub'}
                 </h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {groups.find(g => g.items.some(i => i.id === activeStep))?.label || 'Academic Workspace'}
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{user?.full_name || 'Academic Staff'}</p>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'Creator'}</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:block">System Status</span>
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase tracking-wider">Operational</span>
                 </div>
              </div>
           </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {children}
        </div>
        
        {/* Dashboard Footer */}
        <footer className="px-8 py-6 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institution</span>
              <span className="text-sm font-bold text-slate-700">POLITEKNIK KUCHING SARAWAK</span>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right flex flex-col">
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
                 <span className="text-[10px] font-black text-cyan-600 uppercase tracking-tight">PolyGen System</span>
              </div>
              <img 
                 src="https://odzvkxzgoibxxybcocbr.supabase.co/storage/v1/object/public/branding/logopks.png" 
                 alt="PKS Logo" 
                 className="h-10 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                 referrerPolicy="no-referrer"
              />
           </div>
        </footer>
      </main>
    </div>
  );
};
