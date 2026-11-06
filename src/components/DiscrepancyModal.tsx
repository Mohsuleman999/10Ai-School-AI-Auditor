import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, FileSpreadsheet, CheckCircle2, RotateCcw, User, MessageSquare } from 'lucide-react';
import { DiscrepancyItem } from '../types/reconciliation';

interface DiscrepancyModalProps {
  item: DiscrepancyItem | null;
  onClose: () => void;
  onApplyAction: (
    issueId: string,
    action: 'Approve' | 'Reject' | 'Mark Investigated' | 'Keep Open' | 'Reverse',
    reviewer: string,
    reason: string,
    chosenTreatment?: string
  ) => void;
}

export const DiscrepancyModal: React.FC<DiscrepancyModalProps> = ({
  item,
  onClose,
  onApplyAction,
}) => {
  const [reviewerName, setReviewerName] = useState('muhammad@10alytics.org');
  const [reason, setReason] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!item) return null;

  const isConflictingRecount = item.category === 'Conflicting Recount';
  const isApproved = item.status === 'Approved';

  const handleActionClick = (action: 'Approve' | 'Reject' | 'Mark Investigated' | 'Keep Open' | 'Reverse') => {
    if ((action === 'Approve' || action === 'Reject' || action === 'Reverse') && !reviewerName.trim()) {
      setErrorMsg('Reviewer name is required for compliance and audit logging.');
      return;
    }
    if ((action === 'Approve' || action === 'Reject') && !reason.trim()) {
      setErrorMsg('Please specify an audit justification reason for this decision.');
      return;
    }

    let treatment = item.proposedTreatment;
    if (isConflictingRecount && selectedVariant) {
      treatment = selectedVariant;
    }

    onApplyAction(item.id, action, reviewerName.trim(), reason.trim(), treatment);
    setReason('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-sm uppercase tracking-wide ${
                item.severity === 'High'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : item.severity === 'Medium'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              {item.domain} · {item.severity}
            </span>
            <h2 className="text-base font-bold text-[#111735]">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Side-by-Side original source vs calculation */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Ribbon */}
          <div className="flex items-center justify-between bg-slate-100 px-4 py-2.5 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Issue Reference:</span>
              <span className="font-mono font-semibold text-slate-800">{item.recordId}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">Current Status:</span>
              <span className="font-semibold text-[#111735]">{item.status}</span>
            </div>
            {item.approvedTreatment && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approved Treatment Active</span>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">{item.description}</p>

          {/* Grid: Left = Original Source Rows, Right = Calculation & Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Original Evidence */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <FileSpreadsheet className="w-4 h-4 text-[#405CF5]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
                  Original Source Row Evidence (Immutable)
                </h4>
              </div>

              <div className="space-y-3">
                {item.sourceRows.map((src, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded p-3 text-xs">
                    <div className="flex justify-between font-medium text-slate-700 mb-1.5 pb-1 border-b border-slate-100">
                      <span>{src.dataset}</span>
                      <span className="font-mono text-slate-500">
                        {src.fileName} · Row {src.rowNumber}
                      </span>
                    </div>
                    <pre className="font-mono text-[11px] text-slate-800 bg-slate-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(src.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Calculation Steps & Signed Difference */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <ShieldCheck className="w-4 h-4 text-[#E83DC4]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
                  Deterministic Calculation Breakdown
                </h4>
              </div>

              <div className="space-y-2.5">
                {item.calculationBreakdown.map((calc, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded p-2.5 text-xs">
                    <div className="text-slate-500 text-[11px] font-medium">{calc.label}</div>
                    <div className="font-mono text-[11px] text-slate-600 mb-1">{calc.formula}</div>
                    <div className="font-mono font-bold text-slate-900">{calc.result}</div>
                  </div>
                ))}

                <div className="bg-slate-900 text-white p-3 rounded text-xs space-y-1">
                  <div className="text-slate-400 text-[11px] uppercase tracking-wider">
                    Compared Variance / Sign
                  </div>
                  <div className="flex justify-between items-center font-mono">
                    <span>{item.comparedValues.label}:</span>
                    <span className="text-[#E83DC4] font-bold text-sm">
                      {item.comparedValues.signedDifference || item.comparedValues.val1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-3">
              <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Possible Explanations (Non-accusatory)
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-800">
                {item.possibleReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/60 rounded-lg p-3">
              <div className="font-bold text-blue-900 mb-1">Recommended Investigation Action</div>
              <p className="text-blue-800 leading-relaxed">{item.recommendedAction}</p>
            </div>
          </div>

          {/* Conflicting Count Option Picker (if applicable) */}
          {isConflictingRecount && (
            <div className="border border-indigo-200 bg-indigo-50/40 p-4 rounded-lg text-xs">
              <div className="font-bold text-indigo-950 mb-2">
                Physical Recount Resolution: Select Evidenced Supervisor Count
              </div>
              <p className="text-indigo-800 mb-3">
                ERP policy requires selecting one corroborated physical count ID as the analytical baseline.
                Repeated counts are never added together.
              </p>
              <div className="space-y-2">
                {item.sourceRows
                  .filter((r) => r.dataset === 'Physical Count')
                  .map((r, idx) => {
                    const cid = r.data.CountID || `CNT-${idx}`;
                    return (
                      <label
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition-colors ${
                          selectedVariant === cid || item.approvedTreatment === cid
                            ? 'bg-indigo-100 border-indigo-400 text-indigo-950 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="countVariant"
                            value={cid}
                            checked={selectedVariant === cid || (!selectedVariant && item.approvedTreatment === cid)}
                            onChange={() => setSelectedVariant(cid)}
                            className="text-[#405CF5] focus:ring-[#405CF5]"
                          />
                          <span>
                            {cid} · {r.data.CountedQty} units on {r.data.CountDate || '2026-10-30'}
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Auditor row {r.rowNumber}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Reviewer Action Form */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
              Analytical Treatment Decision & Audit Log
            </h4>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Proposed Analytical Treatment:</span>{' '}
              {item.proposedTreatment}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Reviewer Name / Email
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#405CF5]"
                  placeholder="e.g. muhammad@10alytics.org"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Audit Reason / Justification
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:border-[#405CF5]"
                  placeholder="e.g. Verified with warehouse manager; duplicate entry confirmed"
                />
              </div>
            </div>

            {errorMsg && <div className="text-rose-600 text-xs font-medium">{errorMsg}</div>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleActionClick('Keep Open')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Keep Open
            </button>
            <button
              onClick={() => handleActionClick('Mark Investigated')}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Mark Investigated
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <button
                onClick={() => handleActionClick('Reverse')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reverse Approval</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleActionClick('Reject')}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  Reject Proposal
                </button>
                <button
                  onClick={() => handleActionClick('Approve')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg shadow-xs transition-colors"
                >
                  Approve Proposed Analytical Treatment
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
