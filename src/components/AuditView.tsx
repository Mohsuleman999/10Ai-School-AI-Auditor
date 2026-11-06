import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  User,
  Clock,
} from 'lucide-react';
import { AuditLogEntry } from '../types/reconciliation';

interface AuditViewProps {
  auditLogs: AuditLogEntry[];
  onReverseAction: (logId: string, issueId: string) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ auditLogs, onReverseAction }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.issueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reviewer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.issueTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.treatmentApplied.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#405CF5]">
              Governance & Compliance
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Immutable Action Log
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Analytical Treatment Audit Trail
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Complete cryptographic audit trail of all reviewer decisions. Decisions adjust only the derived
            analytical layer—uploaded source files remain strictly immutable. Every approval, rejection, and reversal is logged.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{auditLogs.length} Total Audit Entries</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by ID, reviewer, treatment..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#405CF5]"
          />
        </div>
        <div className="text-slate-500 font-mono">
          Showing {filteredLogs.length} logged events
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Reviewer</th>
                <th className="py-3 px-4">Issue ID / Title</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Treatment Applied</th>
                <th className="py-3 px-4">KPI Impact (Before &rarr; After)</th>
                <th className="py-3 px-4 text-right">Reversal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => {
                const isReversal = log.actionTaken === 'Reverse';
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{log.reviewer}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs font-sans">
                      <div className="font-mono font-bold text-[#111735]">{log.issueId}</div>
                      <div className="text-slate-500 truncate text-[11px]">{log.issueTitle}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                          log.actionTaken === 'Approve'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.actionTaken === 'Reject'
                            ? 'bg-rose-100 text-rose-800'
                            : log.actionTaken === 'Reverse'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.actionTaken}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 max-w-sm">
                      <div className="line-clamp-2">{log.treatmentApplied}</div>
                      {log.reason && (
                        <div className="text-slate-400 text-[10px] italic mt-0.5">
                          Note: "{log.reason}"
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-sans text-[11px]">
                        {log.kpiImpactBeforeAfter.metric}
                      </div>
                      <div className="text-[#405CF5] font-bold text-[10px]">
                        {log.kpiImpactBeforeAfter.before} &rarr; {log.kpiImpactBeforeAfter.after}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {log.actionTaken === 'Approve' && (
                        <button
                          onClick={() => onReverseAction(log.id, log.issueId)}
                          className="px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 border border-amber-300 rounded transition-colors"
                          title="Reverse this treatment back to Open status"
                        >
                          Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans text-xs">
                    No audit records recorded yet. All reviewer decisions will be captured here.
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
