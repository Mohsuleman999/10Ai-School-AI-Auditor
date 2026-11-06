import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  AlertOctagon,
  Sparkles,
  FileText,
  History,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'upload'
  | 'mappings'
  | 'discrepancies'
  | 'ask_ai'
  | 'reports'
  | 'audit'
  | 'finance'
  | 'inventory'
  | 'hr';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unresolvedCount: number;
  filesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unresolvedCount,
  filesCount,
}) => {
  const mainNav = [
    { id: 'dashboard' as ActiveTab, label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'upload' as ActiveTab, label: 'Upload Data', icon: UploadCloud, badge: filesCount > 0 ? `${filesCount} files` : undefined },
    { id: 'mappings' as ActiveTab, label: 'Confirm Mappings', icon: Layers },
    {
      id: 'discrepancies' as ActiveTab,
      label: 'Discrepancy Review',
      icon: AlertOctagon,
      alertCount: unresolvedCount,
    },
    { id: 'ask_ai' as ActiveTab, label: 'Ask AI', icon: Sparkles, highlight: true },
    { id: 'reports' as ActiveTab, label: 'Reports & Exports', icon: FileText },
    { id: 'audit' as ActiveTab, label: 'Audit Trail', icon: History },
  ];

  const departmentNav = [
    { id: 'finance' as ActiveTab, label: 'Finance & Payments', icon: DollarSign },
    { id: 'inventory' as ActiveTab, label: 'Inventory & Stock', icon: Package },
    { id: 'hr' as ActiveTab, label: 'HR & Payroll', icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#111735] text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#405CF5] to-[#E83DC4] flex items-center justify-center text-white font-bold text-sm shadow-md">
            10
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#E83DC4] font-bold">10AI School</div>
            <div className="text-sm font-bold text-white tracking-tight">LedgerLens</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 pl-10">AI Reporting Assistant by 10Alytics</div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workflows
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#405CF5] text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.highlight ? 'text-[#E83DC4]' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.alertCount !== undefined && item.alertCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-[#405CF5]' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.alertCount}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Department Deep Dives
          </div>
          <nav className="space-y-1">
            {departmentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border-l-2 border-[#405CF5]'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">Deterministic Engine</span>
          <span className="text-emerald-400 font-mono text-[10px]">Active</span>
        </div>
        <div className="text-[10px] text-slate-500">Cent-Safe USD · Strict Joins</div>
      </div>
    </aside>
  );
};
