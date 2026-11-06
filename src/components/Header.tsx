import React from 'react';
import { ActiveTab } from './Sidebar';
import { RefreshCw, Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onReconcile: () => void;
  isReconciling: boolean;
  totalRecords: number;
  unresolvedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onReconcile,
  isReconciling,
  totalRecords,
  unresolvedCount,
}) => {
  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'upload':
        return 'Data Ingestion & Discovery';
      case 'mappings':
        return 'Schema Joins & Confirmation';
      case 'discrepancies':
        return 'Discrepancy Treatment Review';
      case 'ask_ai':
        return 'Grounded AI Assistant';
      case 'reports':
        return 'Management Reports & Exports';
      case 'audit':
        return 'Immutable Audit Register';
      case 'finance':
        return 'Finance · Invoices & Bank Receipts';
      case 'inventory':
        return 'Inventory · ERP vs Physical Audit';
      case 'hr':
        return 'HR · Biometric Attendance & Payroll';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Brand / Breadcrumb */}
      <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          LedgerLens
        </span>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-bold text-[#111735]">{getBreadcrumb()}</h1>
      </div>

      {/* Zone 2: Contextual Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 whitespace-nowrap">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-[#111735] transition-colors ${
            activeTab === 'dashboard' ? 'text-[#405CF5] font-semibold' : ''
          }`}
        >
          Executive KPIs
        </button>
        <button
          onClick={() => onSelectTab('discrepancies')}
          className={`hover:text-[#111735] transition-colors ${
            activeTab === 'discrepancies' ? 'text-[#405CF5] font-semibold' : ''
          }`}
        >
          Discrepancies {unresolvedCount > 0 && `(${unresolvedCount})`}
        </button>
        <button
          onClick={() => onSelectTab('ask_ai')}
          className={`flex items-center gap-1 hover:text-[#111735] transition-colors ${
            activeTab === 'ask_ai' ? 'text-[#405CF5] font-semibold' : ''
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E83DC4]" />
          <span>Ask AI</span>
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`hover:text-[#111735] transition-colors ${
            activeTab === 'reports' ? 'text-[#405CF5] font-semibold' : ''
          }`}
        >
          Export Workbook
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden lg:inline text-[11px] font-mono text-slate-500 tabular-nums">
          {totalRecords.toLocaleString()} records ingested
        </span>
        <button
          onClick={onReconcile}
          disabled={isReconciling}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
          <span>{isReconciling ? 'Reconciling...' : 'Re-Run Engine'}</span>
        </button>
      </div>
    </header>
  );
};
