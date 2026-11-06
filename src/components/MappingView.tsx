import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Link,
  ShieldCheck,
} from 'lucide-react';
import { FileRole, RawUploadedFile } from '../types/reconciliation';

interface MappingViewProps {
  uploadedFiles: RawUploadedFile[];
  onFilesChange: (files: RawUploadedFile[]) => void;
  onConfirmAndReconcile: () => void;
  isReconciling: boolean;
}

const ROLE_DEFINITIONS: Record<
  FileRole,
  { label: string; joinDescription: string; fields: { key: string; label: string; required: boolean }[] }
> = {
  invoices: {
    label: 'Invoices Register',
    joinDescription: 'Primary Key: InvoiceID. Joined with Payments where Payments.InvoiceRef = Invoices.InvoiceID.',
    fields: [
      { key: 'invoiceId', label: 'Invoice ID (Primary Join Key)', required: true },
      { key: 'invoiceDate', label: 'Invoice Date', required: false },
      { key: 'customerName', label: 'Customer Name', required: true },
      { key: 'invoiceAmountUSD', label: 'Invoice Amount (USD)', required: true },
    ],
  },
  payments: {
    label: 'Bank Cleared Payments',
    joinDescription: 'Foreign Key: InvoiceRef (matches Invoices.InvoiceID). Sums cleared payments per invoice.',
    fields: [
      { key: 'paymentId', label: 'Payment ID (Unique Identifier)', required: true },
      { key: 'invoiceRef', label: 'Invoice Reference (Join Key)', required: true },
      { key: 'paymentDate', label: 'Payment Date', required: false },
      { key: 'paidAmountUSD', label: 'Paid Amount (USD)', required: true },
      { key: 'paymentStatus', label: 'Payment Status (Cleared vs Pending)', required: true },
    ],
  },
  inventory_system: {
    label: 'Inventory ERP System Master',
    joinDescription: 'Composite Key: SKU + Warehouse. Matches physical stock audit records.',
    fields: [
      { key: 'sku', label: 'SKU Code (Composite Key)', required: true },
      { key: 'warehouse', label: 'Warehouse / Location (Composite Key)', required: true },
      { key: 'expectedQty', label: 'Expected System Qty (Units)', required: true },
      { key: 'unitCostUSD', label: 'Unit Cost (USD)', required: true },
    ],
  },
  inventory_count: {
    label: 'Physical Stock Count Audit',
    joinDescription: 'Composite Key: SKU + Warehouse. VarianceUnits = CountedQty - ExpectedQty.',
    fields: [
      { key: 'countId', label: 'Count Audit ID', required: false },
      { key: 'sku', label: 'SKU Code (Composite Key)', required: true },
      { key: 'warehouse', label: 'Warehouse / Location (Composite Key)', required: true },
      { key: 'countedQty', label: 'Physical Counted Qty (Units)', required: true },
      { key: 'countDate', label: 'Count Date', required: false },
    ],
  },
  hr_attendance: {
    label: 'Biometric Attendance Logs',
    joinDescription: 'Composite Key: EmployeeID + ReportMonth. Matches Payroll register.',
    fields: [
      { key: 'employeeId', label: 'Employee ID (Composite Key)', required: true },
      { key: 'reportMonth', label: 'Report Month / Period', required: true },
      { key: 'daysPresent', label: 'Days Present (Count)', required: true },
      { key: 'approvedLeaveDays', label: 'Approved Leave Days (Count)', required: true },
      { key: 'scheduledWorkDays', label: 'Scheduled Work Days (Count)', required: false },
    ],
  },
  hr_payroll: {
    label: 'Payroll Disbursement Register',
    joinDescription: 'Composite Key: EmployeeID + PayrollMonth. Evaluates unexplained day gaps.',
    fields: [
      { key: 'payrollId', label: 'Payroll Record ID', required: false },
      { key: 'employeeId', label: 'Employee ID (Composite Key)', required: true },
      { key: 'payrollMonth', label: 'Payroll Month / Period', required: true },
      { key: 'daysPaid', label: 'Days Paid (Count)', required: true },
      { key: 'dailyRateUSD', label: 'Daily Rate (USD)', required: true },
      { key: 'grossPayUSD', label: 'Gross Pay (USD)', required: true },
      { key: 'approvalStatus', label: 'Approval Status (Approved vs Draft)', required: true },
    ],
  },
  unassigned: {
    label: 'Unassigned / Ignore File',
    joinDescription: 'Will not be included in deterministic joins.',
    fields: [],
  },
};

export const MappingView: React.FC<MappingViewProps> = ({
  uploadedFiles,
  onFilesChange,
  onConfirmAndReconcile,
  isReconciling,
}) => {
  const [activeFileId, setActiveFileId] = useState<string>(
    uploadedFiles.length > 0 ? uploadedFiles[0].id : ''
  );

  const activeFile = uploadedFiles.find((f) => f.id === activeFileId) || uploadedFiles[0];

  const handleRoleChange = (fileId: string, newRole: FileRole) => {
    const updated = uploadedFiles.map((f) => {
      if (f.id === fileId) {
        return {
          ...f,
          assignedRole: newRole,
          status: newRole !== 'unassigned' ? ('mapped' as const) : ('parsed' as const),
        };
      }
      return f;
    });
    onFilesChange(updated);
  };

  const handleFieldMapChange = (fileId: string, canonicalField: string, sourceCol: string) => {
    const updated = uploadedFiles.map((f) => {
      if (f.id === fileId) {
        return {
          ...f,
          mapping: {
            ...f.mapping,
            [canonicalField]: sourceCol,
          },
        };
      }
      return f;
    });
    onFilesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#405CF5]">
              Step 2 of 3: Schema Discovery & Joins
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Human-In-The-Loop Confirmation</span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Confirm File Roles & Join Field Mappings
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Reconciliation never joins by row index. Review detected roles, verify primary and foreign keys,
            and explicitly authorize deterministic joins before calculations run.
          </p>
        </div>

        <button
          onClick={onConfirmAndReconcile}
          disabled={isReconciling || uploadedFiles.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
          <span>{isReconciling ? 'Reconciling Data...' : 'Confirm Mappings & Reconcile'}</span>
        </button>
      </div>

      {/* Main Layout: Left File Selector, Right Field Mapping Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: File List with Role Dropdown */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Uploaded Files ({uploadedFiles.length})
          </div>

          <div className="space-y-2">
            {uploadedFiles.map((file) => {
              const isSelected = activeFile?.id === file.id;
              const roleDef = ROLE_DEFINITIONS[file.assignedRole];
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`border rounded-lg p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#405CF5] bg-blue-50/30 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#111735] truncate max-w-[180px]">
                      {file.fileName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {file.rawRows.length} rows
                    </span>
                  </div>

                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Assigned Role:
                    </label>
                    <select
                      value={file.assignedRole}
                      onChange={(e) => handleRoleChange(file.id, e.target.value as FileRole)}
                      className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:border-[#405CF5] focus:outline-none"
                    >
                      <option value="invoices">Invoices (Finance)</option>
                      <option value="payments">Payments (Finance)</option>
                      <option value="inventory_system">Inventory ERP System</option>
                      <option value="inventory_count">Inventory Physical Count</option>
                      <option value="hr_attendance">HR Biometric Attendance</option>
                      <option value="hr_payroll">HR Payroll Register</option>
                      <option value="unassigned">Unassigned / Ignore</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Field Mappings & Join Explanations */}
        {activeFile && (
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#405CF5]">
                    Active File Configuration
                  </span>
                  <h3 className="text-base font-bold text-[#111735]">{activeFile.fileName}</h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Worksheet: {activeFile.selectedSheet} · Role:{' '}
                    {ROLE_DEFINITIONS[activeFile.assignedRole].label}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Row Index Joining Prohibited</span>
                </div>
              </div>

              {/* Join Key Explanation */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#111735] mb-1">
                  <Link className="w-3.5 h-3.5 text-[#405CF5]" />
                  <span>Join Key Logic & Business Rule</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {ROLE_DEFINITIONS[activeFile.assignedRole].joinDescription}
                </p>
              </div>

              {/* Field Mapping Grid */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Field Mappings
                </div>

                {ROLE_DEFINITIONS[activeFile.assignedRole].fields.map((field) => {
                  const mappedSourceCol = activeFile.mapping[field.key] || '';
                  return (
                    <div
                      key={field.key}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                    >
                      <div className="md:col-span-5">
                        <div className="text-xs font-bold text-[#111735]">
                          {field.label}
                          {field.required && <span className="text-rose-500 ml-1">*</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Target Field: {field.key}
                        </div>
                      </div>

                      <div className="hidden md:flex md:col-span-1 justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>

                      <div className="md:col-span-6">
                        <select
                          value={mappedSourceCol}
                          onChange={(e) =>
                            handleFieldMapChange(activeFile.id, field.key, e.target.value)
                          }
                          className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-mono focus:border-[#405CF5] focus:outline-none"
                        >
                          <option value="">-- Select Source Column --</option>
                          {activeFile.headers.map((h) => (
                            <option key={h} value={h}>
                              {h} ({activeFile.detectedTypes[h] || 'string'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Banner */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex justify-end">
                <button
                  onClick={onConfirmAndReconcile}
                  disabled={isReconciling}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg shadow-sm transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
                  <span>Confirm Mappings & Run Reconciliation</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
