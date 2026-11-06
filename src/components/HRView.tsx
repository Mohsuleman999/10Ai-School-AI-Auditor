import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Search,
  Filter,
  Calendar,
  FileCheck,
} from 'lucide-react';
import { DiscrepancyItem, ReconciliationResults } from '../types/reconciliation';
import { formatUSD } from '../utils/reconciliationEngine';

interface HRViewProps {
  results: ReconciliationResults;
  onSelectDiscrepancy: (item: DiscrepancyItem) => void;
}

export const HRView: React.FC<HRViewProps> = ({
  results,
  onSelectDiscrepancy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const {
    employees,
    unexplainedGapCount,
    totalUnexplainedDays,
    missingPayrollCount,
    missingAttendanceCount,
    unapprovedPayrollCount,
  } = results.hr;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#405CF5]">
              HR & Payroll Reconciliation
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              EmployeeID + Month Join
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Biometric Attendance vs Payroll Disbursement Audit
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Evaluates raw day gaps against authorized paid leave days. Unexplained day gaps, unapproved draft
            payrolls, and omitted employees are flagged for HR payroll audit without inferring intent or reducing pay.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Unexplained Net Gaps</span>
            <span className="font-bold text-rose-600">
              +{totalUnexplainedDays} days ({unexplainedGapCount} staff)
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Headcount Audited</div>
          <div className="text-xl font-bold text-[#111735] font-mono tabular-nums mt-1">
            {employees.length} Employees
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cross-Matched Records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Leave-Reconciled Gaps</div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {employees.filter((e) => e.status === 'Explained by Leave').length} Staff
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Approved Leave Covers Raw Gap</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Unexplained Day Gaps</div>
          <div className="text-xl font-bold text-rose-700 font-mono tabular-nums mt-1">
            {unexplainedGapCount} Staff
          </div>
          <div className="text-[11px] text-slate-500 mt-1">e.g. EMP-023 (+4 days)</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Data Integrity Flags</div>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {missingPayrollCount + missingAttendanceCount + unapprovedPayrollCount} Issues
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {missingPayrollCount} missing pay, {missingAttendanceCount} no log, {unapprovedPayrollCount} draft
          </div>
        </div>
      </div>

      {/* Flagged HR Integrity Strip */}
      {(missingPayrollCount > 0 || missingAttendanceCount > 0 || unapprovedPayrollCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missingPayrollCount > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Attendance Without Payroll ({missingPayrollCount})</span>
              </div>
              <p className="text-rose-800 text-[11px] mb-2 leading-relaxed">
                Biometric check-ins present but omitted from payroll disbursement:
              </p>
              <div className="font-mono text-[11px] font-bold text-rose-900">
                {employees.filter((e) => e.status === 'Missing Payroll').map((e) => e.employeeId).join(', ')}
              </div>
            </div>
          )}

          {missingAttendanceCount > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Payroll Without Attendance ({missingAttendanceCount})</span>
              </div>
              <p className="text-amber-800 text-[11px] mb-2 leading-relaxed">
                Salary disbursed without recorded biometric clock-in logs:
              </p>
              <div className="font-mono text-[11px] font-bold text-amber-900">
                {employees.filter((e) => e.status === 'Missing Attendance').map((e) => e.employeeId).join(', ')}
              </div>
            </div>
          )}

          {unapprovedPayrollCount > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Unapproved Draft Payrolls ({unapprovedPayrollCount})</span>
              </div>
              <p className="text-blue-800 text-[11px] mb-2 leading-relaxed">
                Payroll entries marked with status Draft or Unapproved:
              </p>
              <div className="font-mono text-[11px] font-bold text-blue-900">
                {employees.filter((e) => e.status === 'Unapproved Payroll').map((e) => `${e.employeeId} (${e.approvalStatus})`).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Employee Attendance & Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#405CF5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
              HR Reconciled Employee Register ({employees.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Employee ID..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#405CF5]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#405CF5]"
            >
              <option value="All">All Statuses</option>
              <option value="Reconciled">Reconciled</option>
              <option value="Explained by Leave">Explained by Leave</option>
              <option value="Unexplained Gap">Unexplained Gap</option>
              <option value="Missing Payroll">Missing Payroll</option>
              <option value="Missing Attendance">Missing Attendance</option>
              <option value="Unapproved Payroll">Unapproved Payroll</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Employee ID</th>
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4 text-right">Days Present</th>
                <th className="py-2.5 px-4 text-right">Approved Leave</th>
                <th className="py-2.5 px-4 text-right">Days Paid</th>
                <th className="py-2.5 px-4 text-right">Daily Rate</th>
                <th className="py-2.5 px-4 text-right">Gross Pay</th>
                <th className="py-2.5 px-4 text-right">Unexplained Gap</th>
                <th className="py-2.5 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEmployees.map((emp) => {
                const hasUnexplainedGap =
                  emp.unexplainedDayGap !== null && emp.unexplainedDayGap !== 0;
                return (
                  <tr key={`${emp.employeeId}-${emp.month}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#111735]">{emp.employeeId}</td>
                    <td className="py-3 px-4 font-sans text-slate-500 text-[11px]">{emp.month}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800">
                      {emp.daysPresent !== null ? `${emp.daysPresent} days` : 'MISSING'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      {emp.approvedLeaveDays !== null ? `${emp.approvedLeaveDays} days` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-slate-900">
                      {emp.daysPaid !== null ? `${emp.daysPaid} days` : 'MISSING'}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      {emp.dailyRateUSD !== null ? formatUSD(emp.dailyRateUSD) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums text-slate-900">
                      {emp.grossPayUSD !== null ? formatUSD(emp.grossPayUSD) : '—'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold tabular-nums ${
                        hasUnexplainedGap ? 'text-rose-600' : 'text-slate-400'
                      }`}
                    >
                      {emp.unexplainedDayGap !== null
                        ? `${emp.unexplainedDayGap > 0 ? '+' : ''}${emp.unexplainedDayGap} days`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          emp.status === 'Reconciled' || emp.status === 'Explained by Leave'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.status === 'Unexplained Gap'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
