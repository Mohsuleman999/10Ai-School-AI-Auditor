export type FileRole =
  | 'invoices'
  | 'payments'
  | 'inventory_system'
  | 'inventory_count'
  | 'hr_attendance'
  | 'hr_payroll'
  | 'unassigned';

export interface RawUploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  sheets: string[];
  selectedSheet: string;
  headers: string[];
  detectedTypes: Record<string, 'string' | 'number' | 'date'>;
  rawRows: Record<string, any>[];
  suggestedRole: FileRole;
  assignedRole: FileRole;
  mapping: Record<string, string>; // canonicalField -> sourceColumn
  status: 'parsed' | 'mapped' | 'error';
  errorMessage?: string;
}

export interface InvoiceRecord {
  invoiceId: string;
  invoiceDate: string;
  customerName: string;
  invoiceAmountUSD: number;
  sourceFile: string;
  sourceRow: number;
}

export interface PaymentRecord {
  paymentId: string;
  invoiceRef: string;
  paymentDate: string;
  paidAmountUSD: number;
  paymentStatus: 'Cleared' | 'Pending' | 'Failed' | string;
  sourceFile: string;
  sourceRow: number;
}

export interface InventorySystemRecord {
  sku: string;
  warehouse: string;
  expectedQty: number;
  unitCostUSD: number;
  sourceFile: string;
  sourceRow: number;
}

export interface InventoryCountRecord {
  countId: string;
  sku: string;
  warehouse: string;
  countedQty: number;
  countDate: string;
  sourceFile: string;
  sourceRow: number;
}

export interface HRAttendanceRecord {
  employeeId: string;
  reportMonth: string;
  daysPresent: number;
  approvedLeaveDays: number;
  scheduledWorkDays: number;
  sourceFile: string;
  sourceRow: number;
}

export interface HRPayrollRecord {
  payrollId: string;
  employeeId: string;
  payrollMonth: string;
  daysPaid: number;
  dailyRateUSD: number;
  grossPayUSD: number;
  approvalStatus: 'Approved' | 'Draft' | 'Rejected' | string;
  sourceFile: string;
  sourceRow: number;
}

export type DiscrepancySeverity = 'High' | 'Medium' | 'Low' | 'Info';
export type DiscrepancyDomain = 'Finance' | 'Inventory' | 'HR';
export type DiscrepancyStatus =
  | 'Open'
  | 'Under Review'
  | 'Investigated'
  | 'Approved'
  | 'Rejected'
  | 'Resolved';

export interface DiscrepancyItem {
  id: string;
  domain: DiscrepancyDomain;
  recordId: string; // e.g. INV-104, SKU-017, EMP-023
  title: string;
  description: string;
  severity: DiscrepancySeverity;
  status: DiscrepancyStatus;
  category: string;
  sourceRows: {
    dataset: string;
    fileName: string;
    rowNumber: number;
    data: Record<string, any>;
  }[];
  calculationBreakdown: {
    label: string;
    formula: string;
    result: string;
  }[];
  comparedValues: {
    label: string;
    val1: string | number;
    val2: string | number;
    signedDifference?: string | number;
  };
  possibleReasons: string[];
  recommendedAction: string;
  proposedTreatment: string;
  approvedTreatment?: string;
  reviewerName?: string;
  reviewTimestamp?: string;
  reviewReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  reviewer: string;
  issueId: string;
  issueTitle: string;
  domain: DiscrepancyDomain;
  actionTaken: 'Approve' | 'Reject' | 'Mark Investigated' | 'Keep Open' | 'Reverse';
  treatmentApplied: string;
  reason: string;
  kpiImpactBeforeAfter: {
    metric: string;
    before: string;
    after: string;
  };
  originalEvidenceSnippet: string;
}

export interface ReconciledFinanceInvoice {
  invoiceId: string;
  invoiceDate: string;
  customerName: string;
  invoiceAmountUSD: number;
  clearedPaidUSD: number;
  balanceUSD: number;
  status: 'Fully Paid' | 'Partially Paid' | 'Unpaid' | 'Overpaid' | 'Pending Receipt';
  matchedPayments: PaymentRecord[];
  isDuplicate: boolean;
  notes: string;
  sourceRow: number;
  sourceFile: string;
}

export interface ReconciledInventoryItem {
  sku: string;
  warehouse: string;
  expectedQty: number;
  unitCostUSD: number;
  countedQty: number | null;
  varianceUnits: number | null;
  varianceValueUSD: number | null;
  countStatus: 'Reconciled' | 'Shortage' | 'Surplus' | 'Missing Count' | 'Conflicting Counts' | 'Orphan Count';
  countRecords: InventoryCountRecord[];
  isConflictingRecount: boolean;
  approvedCountId?: string;
}

export interface ReconciledHREmployee {
  employeeId: string;
  month: string;
  daysPresent: number | null;
  approvedLeaveDays: number | null;
  scheduledWorkDays: number | null;
  daysPaid: number | null;
  dailyRateUSD: number | null;
  grossPayUSD: number | null;
  approvalStatus: string | null;
  rawPaidDayGap: number | null; // DaysPaid - DaysPresent
  unexplainedDayGap: number | null; // DaysPaid - (DaysPresent + ApprovedLeaveDays)
  status:
    | 'Reconciled'
    | 'Explained by Leave'
    | 'Unexplained Gap'
    | 'Missing Payroll'
    | 'Missing Attendance'
    | 'Unapproved Payroll';
  notes: string;
}

export interface ReconciliationResults {
  timestamp: string;
  finance: {
    invoices: ReconciledFinanceInvoice[];
    unmatchedPayments: PaymentRecord[];
    duplicateInvoices: InvoiceRecord[];
    duplicatePayments: PaymentRecord[];
    pendingReceipts: PaymentRecord[];
    totalInvoicedUSD: number;
    matchedClearedReceiptsUSD: number;
    grossOutstandingUSD: number;
    overpaymentsUSD: number;
    netDifferenceUSD: number;
  };
  inventory: {
    items: ReconciledInventoryItem[];
    missingCountSkus: string[];
    conflictingCountSkus: string[];
    orphanCounts: InventoryCountRecord[];
    totalExpectedValueUSD: number;
    totalVarianceUnits: number;
    totalShortageUnits: number;
    totalSurplusUnits: number;
    totalVarianceValueUSD: number;
    shortageValueUSD: number;
    surplusValueUSD: number;
  };
  hr: {
    employees: ReconciledHREmployee[];
    unexplainedGapCount: number;
    totalUnexplainedDays: number;
    missingPayrollCount: number;
    missingAttendanceCount: number;
    unapprovedPayrollCount: number;
  };
  discrepancies: DiscrepancyItem[];
  kpiSummary: {
    filesUploaded: number;
    sourceRecords: number;
    duplicateKeys: number;
    unmatchedRows: number;
    unresolvedIssues: number;
    totalInvoicedUSD: number;
    matchedClearedReceiptsUSD: number;
    grossOutstandingUSD: number;
    overpaymentsUSD: number;
    inventoryShortageUnits: number;
    hrUnexplainedDayGaps: number;
  };
}
