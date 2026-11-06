import React, { useMemo, useState } from 'react';
import { ActiveTab, Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { MappingView } from './components/MappingView';
import { DiscrepancyView } from './components/DiscrepancyView';
import { FinanceView } from './components/FinanceView';
import { InventoryView } from './components/InventoryView';
import { HRView } from './components/HRView';
import { AskAIView } from './components/AskAIView';
import { ReportView } from './components/ReportView';
import { AuditView } from './components/AuditView';
import { DiscrepancyModal } from './components/DiscrepancyModal';
import {
  AuditLogEntry,
  DiscrepancyItem,
  RawUploadedFile,
} from './types/reconciliation';
import { SAMPLE_TRAINING_FILES } from './utils/sampleData';
import { formatUSD, runDeterministicReconciliation } from './utils/reconciliationEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [uploadedFiles, setUploadedFiles] = useState<RawUploadedFile[]>(SAMPLE_TRAINING_FILES);
  const [approvedTreatments, setApprovedTreatments] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'INIT-AUDIT-001',
      timestamp: '2026-11-06T10:00:00.000Z',
      reviewer: 'System Validator',
      issueId: 'SYSTEM-START',
      issueTitle: 'Deterministic Ingestion Initialized',
      domain: 'Finance',
      actionTaken: 'Approve',
      treatmentApplied: 'Provisional distinct-ID aggregation enforced for duplicates',
      reason: 'Prevent double-counting in Accounts Receivable and Bank Cash',
      kpiImpactBeforeAfter: {
        metric: 'Revenue & Cash Inflation',
        before: 'Unfiltered Multi-row',
        after: 'Cent-Safe Distinct ID',
      },
      originalEvidenceSnippet: 'INV-112 and PAY-011 duplicate protection active',
    },
  ]);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyItem | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  // Compute deterministic reconciliation results
  const results = useMemo(() => {
    return runDeterministicReconciliation(uploadedFiles, approvedTreatments);
  }, [uploadedFiles, approvedTreatments]);

  const handleReconcile = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
    }, 400);
  };

  const handleApplyDiscrepancyAction = (
    issueId: string,
    action: 'Approve' | 'Reject' | 'Mark Investigated' | 'Keep Open' | 'Reverse',
    reviewer: string,
    reason: string,
    chosenTreatment?: string
  ) => {
    const item = results.discrepancies.find((d) => d.id === issueId);
    if (!item) return;

    const beforeKPI = results.kpiSummary.unresolvedIssues.toString();

    if (action === 'Approve') {
      const treatment = chosenTreatment || item.proposedTreatment;
      const newTreatments = { ...approvedTreatments, [issueId]: treatment };
      setApprovedTreatments(newTreatments);

      const logEntry: AuditLogEntry = {
        id: 'AUDIT-' + Date.now(),
        timestamp: new Date().toISOString(),
        reviewer,
        issueId,
        issueTitle: item.title,
        domain: item.domain,
        actionTaken: 'Approve',
        treatmentApplied: treatment,
        reason,
        kpiImpactBeforeAfter: {
          metric: 'Unresolved Issues Count',
          before: beforeKPI,
          after: Math.max(0, results.kpiSummary.unresolvedIssues - 1).toString(),
        },
        originalEvidenceSnippet: JSON.stringify(item.sourceRows[0]?.data || {}),
      };
      setAuditLogs((prev) => [logEntry, ...prev]);
    } else if (action === 'Reverse') {
      const newTreatments = { ...approvedTreatments };
      delete newTreatments[issueId];
      setApprovedTreatments(newTreatments);

      const logEntry: AuditLogEntry = {
        id: 'AUDIT-' + Date.now(),
        timestamp: new Date().toISOString(),
        reviewer,
        issueId,
        issueTitle: item.title,
        domain: item.domain,
        actionTaken: 'Reverse',
        treatmentApplied: 'Reverted treatment; returned anomaly to Open status',
        reason: reason || 'Reviewer requested reversal of analytical decision',
        kpiImpactBeforeAfter: {
          metric: 'Unresolved Issues Count',
          before: beforeKPI,
          after: (results.kpiSummary.unresolvedIssues + 1).toString(),
        },
        originalEvidenceSnippet: 'Reversal applied to derived analytical view',
      };
      setAuditLogs((prev) => [logEntry, ...prev]);
    } else if (action === 'Reject') {
      const logEntry: AuditLogEntry = {
        id: 'AUDIT-' + Date.now(),
        timestamp: new Date().toISOString(),
        reviewer,
        issueId,
        issueTitle: item.title,
        domain: item.domain,
        actionTaken: 'Reject',
        treatmentApplied: 'Proposal Rejected: Keep under manual operational inquiry',
        reason,
        kpiImpactBeforeAfter: {
          metric: 'Issue Status',
          before: item.status,
          after: 'Rejected',
        },
        originalEvidenceSnippet: JSON.stringify(item.sourceRows[0]?.data || {}),
      };
      setAuditLogs((prev) => [logEntry, ...prev]);
    }

    setSelectedDiscrepancy(null);
  };

  const handleReverseAuditAction = (logId: string, issueId: string) => {
    handleApplyDiscrepancyAction(
      issueId,
      'Reverse',
      'Auditor (Manual Reversal)',
      'Reversed from audit trail screen'
    );
  };

  const handleLoadSampleData = () => {
    setUploadedFiles(SAMPLE_TRAINING_FILES);
    handleReconcile();
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-[#111735] overflow-hidden">
      {/* Left Sidebar (Hidden on print) */}
      <div className="no-print h-full flex">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unresolvedCount={results.kpiSummary.unresolvedIssues}
          filesCount={uploadedFiles.length}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header (Hidden on print) */}
        <div className="no-print">
          <Header
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onReconcile={handleReconcile}
            isReconciling={isReconciling}
            totalRecords={results.kpiSummary.sourceRecords}
            unresolvedCount={results.kpiSummary.unresolvedIssues}
          />
        </div>

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                results={results}
                onSelectTab={setActiveTab}
                onSelectDiscrepancy={setSelectedDiscrepancy}
              />
            )}

            {activeTab === 'upload' && (
              <UploadView
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onProceedToMapping={() => setActiveTab('mappings')}
                onLoadSampleData={handleLoadSampleData}
              />
            )}

            {activeTab === 'mappings' && (
              <MappingView
                uploadedFiles={uploadedFiles}
                onFilesChange={setUploadedFiles}
                onConfirmAndReconcile={() => {
                  handleReconcile();
                  setActiveTab('dashboard');
                }}
                isReconciling={isReconciling}
              />
            )}

            {activeTab === 'discrepancies' && (
              <DiscrepancyView
                discrepancies={results.discrepancies}
                onSelectDiscrepancy={setSelectedDiscrepancy}
                onApplyAction={handleApplyDiscrepancyAction}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceView
                results={results}
                onSelectDiscrepancy={setSelectedDiscrepancy}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                results={results}
                onSelectDiscrepancy={setSelectedDiscrepancy}
              />
            )}

            {activeTab === 'hr' && (
              <HRView
                results={results}
                onSelectDiscrepancy={setSelectedDiscrepancy}
              />
            )}

            {activeTab === 'ask_ai' && (
              <AskAIView
                results={results}
                onSelectDiscrepancy={setSelectedDiscrepancy}
              />
            )}

            {activeTab === 'reports' && (
              <ReportView
                results={results}
                auditLogs={auditLogs}
              />
            )}

            {activeTab === 'audit' && (
              <AuditView
                auditLogs={auditLogs}
                onReverseAction={handleReverseAuditAction}
              />
            )}
          </div>
        </main>
      </div>

      {/* Side-by-side Evidence & Treatment Inspection Modal */}
      <DiscrepancyModal
        item={selectedDiscrepancy}
        onClose={() => setSelectedDiscrepancy(null)}
        onApplyAction={handleApplyDiscrepancyAction}
      />
    </div>
  );
}
