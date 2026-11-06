import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { DiscrepancyDomain, DiscrepancyItem, DiscrepancySeverity, DiscrepancyStatus } from '../types/reconciliation';

interface DiscrepancyViewProps {
  discrepancies: DiscrepancyItem[];
  onSelectDiscrepancy: (item: DiscrepancyItem) => void;
  onApplyAction: (
    issueId: string,
    action: 'Approve' | 'Reject' | 'Mark Investigated' | 'Keep Open' | 'Reverse',
    reviewer: string,
    reason: string,
    chosenTreatment?: string
  ) => void;
}

export const DiscrepancyView: React.FC<DiscrepancyViewProps> = ({
  discrepancies,
  onSelectDiscrepancy,
  onApplyAction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<'All' | DiscrepancyDomain>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | DiscrepancyStatus>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | DiscrepancySeverity>('All');

  const filteredItems = discrepancies.filter((d) => {
    const matchesSearch =
      d.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDomain = domainFilter === 'All' || d.domain === domainFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || d.severity === severityFilter;

    return matchesSearch && matchesDomain && matchesStatus && matchesSeverity;
  });

  const openCount = discrepancies.filter((d) => d.status === 'Open').length;
  const approvedCount = discrepancies.filter((d) => d.status === 'Approved').length;
  const underReviewCount = discrepancies.filter((d) => d.status === 'Under Review' || d.status === 'Investigated').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E83DC4]">
              Data Quality & Governance
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Immutable Original vs Derived View
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Discrepancy Review & Analytical Treatment Approval
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Audit anomalies flagged by the deterministic engine. Inspect original rows side-by-side with
            mathematical proof. Approved treatments affect only the analytical view and are logged in the immutable audit trail.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-3 shrink-0 text-xs">
          <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-800">
            <span className="font-bold">{openCount}</span> Open
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-800">
            <span className="font-bold">{underReviewCount}</span> Under Review
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800">
            <span className="font-bold">{approvedCount}</span> Approved
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID (INV-104), SKU, Employee, category..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#405CF5]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Domain Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Finance', 'Inventory', 'HR'] as const).map((dom) => (
              <button
                key={dom}
                onClick={() => setDomainFilter(dom)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  domainFilter === dom
                    ? 'bg-white text-[#111735] shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#405CF5]"
          >
            <option value="All">All Severities</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Info">Info / Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#405CF5]"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Review">Under Review</option>
            <option value="Investigated">Investigated</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Discrepancy Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Severity / Domain</th>
                <th className="py-3 px-4">Record Ref</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Compared Difference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectDiscrepancy(item)}
                    className="hover:bg-blue-50/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.severity === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : item.severity === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-slate-500 font-medium">{item.domain}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#111735]">
                      {item.recordId}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#E83DC4] font-semibold whitespace-nowrap">
                      {item.comparedValues.signedDifference || 'Anomaly'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                          item.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : item.status === 'Investigated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDiscrepancy(item);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#405CF5] hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
                      >
                        Inspect & Treat
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No discrepancies match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
