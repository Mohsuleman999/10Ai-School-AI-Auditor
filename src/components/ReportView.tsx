import React from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Layers,
  History,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import { AuditLogEntry, ReconciliationResults } from '../types/reconciliation';
import {
  downloadAuditLogCSV,
  downloadDiscrepanciesCSV,
  downloadExcelReconciliationWorkbook,
  triggerPrintReport,
} from '../utils/exportUtils';
import { formatUSD } from '../utils/reconciliationEngine';

interface ReportViewProps {
  results: ReconciliationResults;
  auditLogs: AuditLogEntry[];
}

export const ReportView: React.FC<ReportViewProps> = ({ results, auditLogs }) => {
  const kpis = results.kpiSummary;

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions (Hidden during print) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#405CF5]">
              Executive Governance
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Working Workbook & Audit Exports
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Generate Management Report & Workbooks
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Export functional Excel multi-sheet workbooks, print or save the comprehensive PDF Management
            Report, or export raw CSV registers of all anomalies and audit decisions.
          </p>
        </div>

        {/* Working Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => downloadExcelReconciliationWorkbook(results, auditLogs)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111735] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel Workbook (.xlsx)</span>
          </button>

          <button
            onClick={triggerPrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={() => downloadDiscrepanciesCSV(results.discrepancies)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Discrepancies (CSV)</span>
          </button>

          <button
            onClick={() => downloadAuditLogCSV(auditLogs)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* Formal Management Report Document (Print-Ready) */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="flex flex-col md:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#E83DC4] font-bold mb-1">
              10AI School by 10Alytics · LedgerLens Platform
            </div>
            <h1 className="text-2xl font-bold text-[#111735] tracking-tight">
              Executive Reconciliation & Internal Controls Report
            </h1>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Reporting Period: October 2026 · Evaluation Cutoff: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
            </div>
          </div>

          <div className="text-right text-xs space-y-1 font-mono">
            <div className="font-bold text-slate-800">Classification: Confidential / Board Review</div>
            <div className="text-slate-500">Methodology: Deterministic Rule Engine</div>
            <div className="text-slate-500">Valuation Currency: US Dollar (USD)</div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
            1. Executive Summary & Audit Opinion
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            During the audit period, a total of <strong>{kpis.filesUploaded} source spreadsheets</strong> encompassing{' '}
            <strong>{kpis.sourceRecords.toLocaleString()} individual records</strong> were ingested and verified through
            the LedgerLens deterministic reconciliation engine. The engine performed multi-dimensional cross-system matching
            between Accounts Receivable and bank settlements, ERP inventory balances and physical cycle counts, and biometric
            attendance records against payroll disbursements.
          </p>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            A total of <strong>{kpis.duplicateKeys} duplicate keys</strong> and <strong>{kpis.unmatchedRows} unmatched/orphan records</strong>{' '}
            were isolated. Provisional distinct-ID aggregation successfully prevented artificial revenue inflation in billing.
            As of this report, <strong>{kpis.unresolvedIssues} anomalies remain open or under review</strong> awaiting management sign-off.
          </p>
        </div>

        {/* Section 2: Key Financial Metrics Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#405CF5]" />
            <span>2. Finance & Cash Settlement Summary (USD)</span>
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-4">Financial Ledger Metric</th>
                  <th className="py-2 px-4 text-right">Calculated USD</th>
                  <th className="py-2 px-4">Accounting Definition & Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Total Invoiced (Distinct)</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatUSD(results.finance.totalInvoicedUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Gross distinct billing across valid customer accounts</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Matched Cleared Receipts</td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{formatUSD(results.finance.matchedClearedReceiptsUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Cleared bank receipts matched to invoices</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Gross Outstanding Receivables</td>
                  <td className="py-2.5 px-4 text-right font-bold text-amber-700">{formatUSD(results.finance.grossOutstandingUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Uncollected customer balances (excluding overpayment credits)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Customer Overpayments</td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#E83DC4]">{formatUSD(results.finance.overpaymentsUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Customer credit balances held in escrow (e.g. INV-106)</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2.5 px-4 font-sans text-slate-900">Net Billing Difference</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">{formatUSD(results.finance.netDifferenceUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 font-normal">Total Invoiced - Matched Cleared Cash</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Inventory Stock Variances & Valuations */}
        <div className="space-y-3 print-page-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#E83DC4]" />
            <span>3. Inventory & Physical Stock Audit Valuation</span>
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-4">Inventory Audit Metric</th>
                  <th className="py-2 px-4 text-right">Physical Units</th>
                  <th className="py-2 px-4 text-right">Financial Valuation (USD)</th>
                  <th className="py-2 px-4">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">ERP System Catalog Valuation</td>
                  <td className="py-2.5 px-4 text-right text-slate-700">{results.inventory.items.reduce((acc, i) => acc + i.expectedQty, 0)} units</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatUSD(results.inventory.totalExpectedValueUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Perpetual inventory master</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Physical Stock Shortages</td>
                  <td className="py-2.5 px-4 text-right text-rose-700 font-bold">-{results.inventory.totalShortageUnits} units</td>
                  <td className="py-2.5 px-4 text-right text-rose-700 font-bold">-{formatUSD(results.inventory.shortageValueUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-rose-700">Shrinkage / unrecorded write-offs</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Physical Stock Surpluses</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">+{results.inventory.totalSurplusUnits} units</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">+{formatUSD(results.inventory.surplusValueUSD)}</td>
                  <td className="py-2.5 px-4 font-sans text-emerald-700">Unrecorded stock receipts</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Missing Physical Stock Counts</td>
                  <td className="py-2.5 px-4 text-right text-amber-700">{results.inventory.missingCountSkus.length} SKUs</td>
                  <td className="py-2.5 px-4 text-right text-amber-700">Quarantined</td>
                  <td className="py-2.5 px-4 font-sans text-amber-700">e.g. SKU-029 (Never assumed 0)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Conflicting Recounts</td>
                  <td className="py-2.5 px-4 text-right text-amber-700">{results.inventory.conflictingCountSkus.length} SKUs</td>
                  <td className="py-2.5 px-4 text-right text-amber-700">Pending Review</td>
                  <td className="py-2.5 px-4 font-sans text-amber-700">e.g. SKU-031 (CNT-009A vs CNT-009B)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: HR Biometric Attendance vs Payroll */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#405CF5]" />
            <span>4. HR Attendance vs Payroll Governance</span>
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 font-semibold text-slate-700">
                <tr>
                  <th className="py-2 px-4">HR Reconciliation Factor</th>
                  <th className="py-2 px-4 text-right">Staff Count</th>
                  <th className="py-2 px-4">Internal Control Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Exact / Leave-Explained Match</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700 font-bold">{results.hr.employees.filter((e) => e.status === 'Reconciled' || e.status === 'Explained by Leave').length}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Days paid fully corroborated by days present + approved leave</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Unexplained Day Gaps</td>
                  <td className="py-2.5 px-4 text-right text-rose-700 font-bold">{results.hr.unexplainedGapCount}</td>
                  <td className="py-2.5 px-4 font-sans text-rose-700">Days paid exceeds verified attendance + leave (e.g. EMP-023: +4 days)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Attendance Without Scheduled Payroll</td>
                  <td className="py-2.5 px-4 text-right text-amber-700 font-bold">{results.hr.missingPayrollCount}</td>
                  <td className="py-2.5 px-4 font-sans text-amber-700">Biometric check-ins found but omitted from disbursement (e.g. EMP-029)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Payroll Disbursement Lacking Attendance</td>
                  <td className="py-2.5 px-4 text-right text-amber-700 font-bold">{results.hr.missingAttendanceCount}</td>
                  <td className="py-2.5 px-4 font-sans text-amber-700">Salary disbursed without biometric clock-in logs (e.g. EMP-999)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Unapproved Draft Payrolls</td>
                  <td className="py-2.5 px-4 text-right text-amber-700 font-bold">{results.hr.unapprovedPayrollCount}</td>
                  <td className="py-2.5 px-4 font-sans text-amber-700">Payroll marked Draft pending director approval (e.g. EMP-030)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Urgent Action Items & Material Discrepancies */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
            5. Register of High-Priority Audit Findings
          </h3>
          <div className="space-y-2">
            {results.discrepancies.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3 border border-slate-200 rounded-lg text-xs bg-slate-50/40"
              >
                <div className="flex items-center justify-between font-bold text-[#111735] mb-1">
                  <span>{item.recordId} · {item.title}</span>
                  <span className="font-mono text-slate-500 uppercase text-[10px]">{item.status}</span>
                </div>
                <div className="text-slate-600 mb-1.5">{item.description}</div>
                <div className="text-[11px] font-mono text-slate-700 flex justify-between">
                  <span>Action: {item.recommendedAction}</span>
                  <span className="text-[#405CF5] font-bold">{item.comparedValues.signedDifference}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Sign-off Footer */}
        <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600 font-mono">
          <div>
            <div>Audited by: muhammad@10alytics.org</div>
            <div>Program: 10AI School Executive BI Certification</div>
          </div>
          <div className="text-right">
            <div>Signature: __________________________</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
