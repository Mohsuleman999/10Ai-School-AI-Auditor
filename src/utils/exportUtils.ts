import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { AuditLogEntry, DiscrepancyItem, ReconciliationResults } from '../types/reconciliation';
import { formatUSD } from './reconciliationEngine';

export function downloadExcelReconciliationWorkbook(
  results: ReconciliationResults,
  auditLogs: AuditLogEntry[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryData = [
    ['LedgerLens Reconciliation Executive Summary', '10AI School by 10Alytics'],
    ['Generated Date', new Date().toLocaleString()],
    ['', ''],
    ['Metric', 'Value (USD / Count)', 'Calculation Basis'],
    ['Total Invoiced USD', formatUSD(results.finance.totalInvoicedUSD), 'SUM(distinct valid invoices)'],
    ['Matched Cleared Receipts USD', formatUSD(results.finance.matchedClearedReceiptsUSD), 'SUM(distinct matched cleared payments)'],
    ['Gross Outstanding USD', formatUSD(results.finance.grossOutstandingUSD), 'SUM(MAX(InvoiceAmount - ClearedPaid, 0))'],
    ['Overpayments USD', formatUSD(results.finance.overpaymentsUSD), 'SUM(MAX(ClearedPaid - InvoiceAmount, 0))'],
    ['Net Billing Difference USD', formatUSD(results.finance.netDifferenceUSD), 'Total Invoiced - Matched Cleared'],
    ['', ''],
    ['Total Inventory Expected Value USD', formatUSD(results.inventory.totalExpectedValueUSD), 'SUM(ExpectedQty * UnitCostUSD)'],
    ['Inventory Net Variance Value USD', formatUSD(results.inventory.totalVarianceValueUSD), 'SUM(VarianceUnits * UnitCostUSD)'],
    ['Inventory Shortage Units', results.inventory.totalShortageUnits, 'Physical Count < Expected'],
    ['Inventory Shortage Value USD', formatUSD(results.inventory.shortageValueUSD), 'Financial loss from shortages'],
    ['Inventory Surplus Units', results.inventory.totalSurplusUnits, 'Physical Count > Expected'],
    ['Inventory Surplus Value USD', formatUSD(results.inventory.surplusValueUSD), 'Unrecorded physical stock'],
    ['', ''],
    ['HR Unexplained Day Gaps', results.hr.unexplainedGapCount, 'DaysPaid != (DaysPresent + LeaveDays)'],
    ['Total Unexplained Days Paid', results.hr.totalUnexplainedDays, 'Net unexplained payroll days'],
    ['Missing Payroll Records', results.hr.missingPayrollCount, 'Present but omitted from payroll'],
    ['Missing Attendance Records', results.hr.missingAttendanceCount, 'Paid without attendance record'],
    ['Unapproved Payroll Entries', results.hr.unapprovedPayrollCount, 'Status != Approved'],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // 2. Finance Reconciliation Sheet
  const financeRows = results.finance.invoices.map((inv) => ({
    'Invoice ID': inv.invoiceId,
    'Invoice Date': inv.invoiceDate,
    'Customer Name': inv.customerName,
    'Invoice Amount USD': inv.invoiceAmountUSD,
    'Cleared Paid USD': inv.clearedPaidUSD,
    'Balance USD': inv.balanceUSD,
    'Status': inv.status,
    'Matched Payments Count': inv.matchedPayments.length,
    'Duplicate Row Detected': inv.isDuplicate ? 'YES' : 'NO',
    'Source File': inv.sourceFile,
    'Source Row': inv.sourceRow,
  }));
  const wsFinance = XLSX.utils.json_to_sheet(financeRows);
  XLSX.utils.book_append_sheet(wb, wsFinance, 'Finance Invoices');

  // 3. Inventory Variance Sheet
  const inventoryRows = results.inventory.items.map((item) => ({
    'SKU': item.sku,
    'Warehouse': item.warehouse,
    'Expected Qty': item.expectedQty,
    'Counted Qty': item.countedQty !== null ? item.countedQty : 'MISSING',
    'Variance Units': item.varianceUnits !== null ? item.varianceUnits : 'N/A',
    'Unit Cost USD': item.unitCostUSD,
    'Variance Value USD': item.varianceValueUSD !== null ? item.varianceValueUSD : 'N/A',
    'Count Status': item.countStatus,
    'Conflicting Recounts': item.isConflictingRecount ? 'YES' : 'NO',
    'Approved Count ID': item.approvedCountId || 'None',
  }));
  const wsInventory = XLSX.utils.json_to_sheet(inventoryRows);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory Audit');

  // 4. HR Attendance vs Payroll Sheet
  const hrRows = results.hr.employees.map((emp) => ({
    'Employee ID': emp.employeeId,
    'Month': emp.month,
    'Days Present': emp.daysPresent !== null ? emp.daysPresent : 'MISSING',
    'Approved Leave Days': emp.approvedLeaveDays !== null ? emp.approvedLeaveDays : 'MISSING',
    'Scheduled Work Days': emp.scheduledWorkDays !== null ? emp.scheduledWorkDays : 'N/A',
    'Days Paid': emp.daysPaid !== null ? emp.daysPaid : 'MISSING',
    'Daily Rate USD': emp.dailyRateUSD !== null ? emp.dailyRateUSD : 'N/A',
    'Gross Pay USD': emp.grossPayUSD !== null ? emp.grossPayUSD : 'N/A',
    'Approval Status': emp.approvalStatus || 'N/A',
    'Raw Paid Day Gap': emp.rawPaidDayGap !== null ? emp.rawPaidDayGap : 'N/A',
    'Unexplained Day Gap': emp.unexplainedDayGap !== null ? emp.unexplainedDayGap : 'N/A',
    'Audit Status': emp.status,
    'Notes': emp.notes,
  }));
  const wsHR = XLSX.utils.json_to_sheet(hrRows);
  XLSX.utils.book_append_sheet(wb, wsHR, 'HR Attendance & Payroll');

  // 5. Discrepancy Register Sheet
  const discRows = results.discrepancies.map((d) => ({
    'Issue ID': d.id,
    'Domain': d.domain,
    'Category': d.category,
    'Record Ref': d.recordId,
    'Title': d.title,
    'Severity': d.severity,
    'Status': d.status,
    'Difference / Flag': d.comparedValues.signedDifference || '',
    'Possible Reasons': d.possibleReasons.join('; '),
    'Recommended Action': d.recommendedAction,
    'Proposed Treatment': d.proposedTreatment,
    'Approved Treatment': d.approvedTreatment || '',
    'Reviewer': d.reviewerName || '',
    'Reviewed At': d.reviewTimestamp || '',
  }));
  const wsDisc = XLSX.utils.json_to_sheet(discRows);
  XLSX.utils.book_append_sheet(wb, wsDisc, 'Discrepancy Register');

  // 6. Audit Trail Sheet
  const auditRows = auditLogs.map((log) => ({
    'Log ID': log.id,
    'Timestamp': log.timestamp,
    'Reviewer': log.reviewer,
    'Domain': log.domain,
    'Issue ID': log.issueId,
    'Issue Title': log.issueTitle,
    'Action Taken': log.actionTaken,
    'Treatment Applied': log.treatmentApplied,
    'Review Reason': log.reason,
    'KPI Metric Changed': log.kpiImpactBeforeAfter.metric,
    'Before Value': log.kpiImpactBeforeAfter.before,
    'After Value': log.kpiImpactBeforeAfter.after,
  }));
  const wsAudit = XLSX.utils.json_to_sheet(auditRows);
  XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Trail');

  // Trigger download
  XLSX.writeFile(wb, `LedgerLens_Reconciliation_Report_${Date.now()}.xlsx`);
}

export function downloadDiscrepanciesCSV(discrepancies: DiscrepancyItem[]) {
  const data = discrepancies.map((d) => ({
    IssueID: d.id,
    Domain: d.domain,
    Category: d.category,
    RecordReference: d.recordId,
    Title: d.title,
    Severity: d.severity,
    Status: d.status,
    ComparedValue1: d.comparedValues.val1,
    ComparedValue2: d.comparedValues.val2,
    Difference: d.comparedValues.signedDifference || '',
    Description: d.description,
    RecommendedAction: d.recommendedAction,
    ProposedTreatment: d.proposedTreatment,
    ApprovedTreatment: d.approvedTreatment || '',
    Reviewer: d.reviewerName || '',
    ReviewTimestamp: d.reviewTimestamp || '',
    ReviewReason: d.reviewReason || '',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LedgerLens_Discrepancies_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadAuditLogCSV(auditLogs: AuditLogEntry[]) {
  const data = auditLogs.map((log) => ({
    LogID: log.id,
    Timestamp: log.timestamp,
    Reviewer: log.reviewer,
    Domain: log.domain,
    IssueID: log.issueId,
    IssueTitle: log.issueTitle,
    ActionTaken: log.actionTaken,
    TreatmentApplied: log.treatmentApplied,
    JustificationReason: log.reason,
    KPIMetric: log.kpiImpactBeforeAfter.metric,
    KPIBefore: log.kpiImpactBeforeAfter.before,
    KPIAfter: log.kpiImpactBeforeAfter.after,
    EvidenceSnippet: log.originalEvidenceSnippet,
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LedgerLens_Audit_Trail_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function triggerPrintReport() {
  window.print();
}
