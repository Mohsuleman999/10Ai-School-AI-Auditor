import {
  DiscrepancyItem,
  FileRole,
  HRAttendanceRecord,
  HRPayrollRecord,
  InventoryCountRecord,
  InventorySystemRecord,
  InvoiceRecord,
  PaymentRecord,
  RawUploadedFile,
  ReconciledFinanceInvoice,
  ReconciledHREmployee,
  ReconciledInventoryItem,
  ReconciliationResults,
} from '../types/reconciliation';

export const formatUSD = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const toCents = (val: number): number => Math.round((val || 0) * 100);
export const fromCents = (cents: number): number => cents / 100;
export const addUSD = (a: number, b: number): number => fromCents(toCents(a) + toCents(b));
export const subUSD = (a: number, b: number): number => fromCents(toCents(a) - toCents(b));
export const multUSD = (qty: number, unitCost: number): number => {
  return fromCents(Math.round(qty * toCents(unitCost)));
};

export function cleanNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).replace(/[$,]/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function cleanString(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function runDeterministicReconciliation(
  uploadedFiles: RawUploadedFile[],
  approvedTreatments: Record<string, string> = {}
): ReconciliationResults {
  const discrepancies: DiscrepancyItem[] = [];

  // 1. Group records by file role
  let rawInvoices: { rec: InvoiceRecord; file: string; row: number }[] = [];
  let rawPayments: { rec: PaymentRecord; file: string; row: number }[] = [];
  let rawInvSystem: { rec: InventorySystemRecord; file: string; row: number }[] = [];
  let rawInvCounts: { rec: InventoryCountRecord; file: string; row: number }[] = [];
  let rawHRAttend: { rec: HRAttendanceRecord; file: string; row: number }[] = [];
  let rawHRPayroll: { rec: HRPayrollRecord; file: string; row: number }[] = [];

  let totalFiles = uploadedFiles.filter((f) => f.status !== 'error').length;
  let totalSourceRecords = 0;

  uploadedFiles.forEach((file) => {
    if (file.status === 'error') return;
    const m = file.mapping;
    totalSourceRecords += file.rawRows.length;

    file.rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      if (file.assignedRole === 'invoices') {
        const invId = cleanString(row[m.invoiceId || 'InvoiceID']);
        if (invId) {
          rawInvoices.push({
            rec: {
              invoiceId: invId,
              invoiceDate: cleanString(row[m.invoiceDate || 'InvoiceDate']),
              customerName: cleanString(row[m.customerName || 'CustomerName']),
              invoiceAmountUSD: cleanNumber(row[m.invoiceAmountUSD || 'InvoiceAmountUSD']),
              sourceFile: file.fileName,
              sourceRow: rowNum,
            },
            file: file.fileName,
            row: rowNum,
          });
        }
      } else if (file.assignedRole === 'payments') {
        const payId = cleanString(row[m.paymentId || 'PaymentID']);
        if (payId) {
          rawPayments.push({
            rec: {
              paymentId: payId,
              invoiceRef: cleanString(row[m.invoiceRef || 'InvoiceRef']),
              paymentDate: cleanString(row[m.paymentDate || 'PaymentDate']),
              paidAmountUSD: cleanNumber(row[m.paidAmountUSD || 'PaidAmountUSD']),
              paymentStatus: cleanString(row[m.paymentStatus || 'PaymentStatus']) || 'Cleared',
              sourceFile: file.fileName,
              sourceRow: rowNum,
            },
            file: file.fileName,
            row: rowNum,
          });
        }
      } else if (file.assignedRole === 'inventory_system') {
        const sku = cleanString(row[m.sku || 'SKU']);
        if (sku) {
          rawInvSystem.push({
            rec: {
              sku,
              warehouse: cleanString(row[m.warehouse || 'Warehouse']),
              expectedQty: cleanNumber(row[m.expectedQty || 'ExpectedQty']),
              unitCostUSD: cleanNumber(row[m.unitCostUSD || 'UnitCostUSD']),
              sourceFile: file.fileName,
              sourceRow: rowNum,
            },
            file: file.fileName,
            row: rowNum,
          });
        }
      } else if (file.assignedRole === 'inventory_count') {
        const countId = cleanString(row[m.countId || 'CountID']);
        const sku = cleanString(row[m.sku || 'SKU']);
        if (countId || sku) {
          rawInvCounts.push({
            rec: {
              countId: countId || `CNT-${idx + 1}`,
              sku,
              warehouse: cleanString(row[m.warehouse || 'Warehouse']),
              countedQty: cleanNumber(row[m.countedQty || 'CountedQty']),
              countDate: cleanString(row[m.countDate || 'CountDate']),
              sourceFile: file.fileName,
              sourceRow: rowNum,
            },
            file: file.fileName,
            row: rowNum,
          });
        }
      } else if (file.assignedRole === 'hr_attendance') {
        const empId = cleanString(row[m.employeeId || 'EmployeeID']);
        if (empId) {
          rawHRAttend.push({
            rec: {
              employeeId: empId,
              reportMonth: cleanString(row[m.reportMonth || 'ReportMonth']) || '2026-10',
              daysPresent: cleanNumber(row[m.daysPresent || 'DaysPresent']),
              approvedLeaveDays: cleanNumber(row[m.approvedLeaveDays || 'ApprovedLeaveDays']),
              scheduledWorkDays: cleanNumber(row[m.scheduledWorkDays || 'ScheduledWorkDays']),
              sourceFile: file.fileName,
              sourceRow: rowNum,
            },
            file: file.fileName,
            row: rowNum,
          });
        }
      } else if (file.assignedRole === 'hr_payroll') {
        const payrId = cleanString(row[m.payrollId || 'PayrollID']);
        const empId = cleanString(row[m.employeeId || 'EmployeeID']);
        if (payrId || empId) {
          rawHRPayroll.push({
            rec: {
              payrollId: payrId || `PAYR-${idx + 1}`,
              employeeId: empId,
              payrollMonth: cleanString(row[m.payrollMonth || 'PayrollMonth']) || '2026-10',
              daysPaid: cleanNumber(row[m.daysPaid || 'DaysPaid']),
              dailyRateUSD: cleanNumber(row[m.dailyRateUSD || 'DailyRateUSD']),
              grossPayUSD: cleanNumber(row[m.grossPayUSD || 'GrossPayUSD']),
              approvalStatus: cleanString(row[m.approvalStatus || 'ApprovalStatus']) || 'Approved',
              sourceFile: file.fileName,
              sourceRow: rowNum,
            },
            file: file.fileName,
            row: rowNum,
          });
        }
      }
    });
  });

  // ==========================================
  // 2. FINANCE RECONCILIATION ENGINE
  // ==========================================
  const invoiceCountMap = new Map<string, number>();
  const duplicateInvoiceRecs: InvoiceRecord[] = [];
  rawInvoices.forEach(({ rec }) => {
    const c = invoiceCountMap.get(rec.invoiceId) || 0;
    invoiceCountMap.set(rec.invoiceId, c + 1);
    if (c === 1) {
      duplicateInvoiceRecs.push(rec);
    }
  });

  // Detect duplicate invoices
  duplicateInvoiceRecs.forEach((dup) => {
    const matchingRows = rawInvoices.filter((r) => r.rec.invoiceId === dup.invoiceId);
    discrepancies.push({
      id: `DISC-FIN-DUP-INV-${dup.invoiceId}`,
      domain: 'Finance',
      recordId: dup.invoiceId,
      title: `Duplicate Invoice ID: ${dup.invoiceId}`,
      description: `Invoice ID ${dup.invoiceId} appears ${matchingRows.length} times in source files. Provisional distinct aggregation applied to prevent inflating billed totals.`,
      severity: 'High',
      status: approvedTreatments[`DISC-FIN-DUP-INV-${dup.invoiceId}`] ? 'Approved' : 'Open',
      category: 'Duplicate Key',
      sourceRows: matchingRows.map((m) => ({
        dataset: 'Invoices',
        fileName: m.file,
        rowNumber: m.row,
        data: m.rec,
      })),
      calculationBreakdown: [
        { label: 'Raw Invoice Count', formula: `Count of ${dup.invoiceId} in source`, result: `${matchingRows.length} records` },
        { label: 'Provisional Billed USD', formula: 'Distinct 1st instance billed amount', result: formatUSD(dup.invoiceAmountUSD) },
        { label: 'Prevented Inflation', formula: `(${matchingRows.length} - 1) * ${formatUSD(dup.invoiceAmountUSD)}`, result: formatUSD(dup.invoiceAmountUSD * (matchingRows.length - 1)) },
      ],
      comparedValues: {
        label: 'Instance count',
        val1: matchingRows.length,
        val2: 1,
        signedDifference: `+${matchingRows.length - 1} duplicates`,
      },
      possibleReasons: ['Accidental double-export from billing system', 'Multi-batch re-upload without deduplication'],
      recommendedAction: 'Verify billing journal and confirm primary master record; exclude redundant duplicate from ledger.',
      proposedTreatment: 'Exclude secondary duplicate record from analytical view, retaining only primary original.',
      approvedTreatment: approvedTreatments[`DISC-FIN-DUP-INV-${dup.invoiceId}`],
    });
  });

  // Payments duplicate check
  const paymentCountMap = new Map<string, number>();
  const duplicatePaymentRecs: PaymentRecord[] = [];
  rawPayments.forEach(({ rec }) => {
    const c = paymentCountMap.get(rec.paymentId) || 0;
    paymentCountMap.set(rec.paymentId, c + 1);
    if (c === 1) {
      duplicatePaymentRecs.push(rec);
    }
  });

  duplicatePaymentRecs.forEach((dup) => {
    const matchingRows = rawPayments.filter((r) => r.rec.paymentId === dup.paymentId);
    discrepancies.push({
      id: `DISC-FIN-DUP-PAY-${dup.paymentId}`,
      domain: 'Finance',
      recordId: dup.paymentId,
      title: `Duplicate Payment ID: ${dup.paymentId}`,
      description: `Payment ID ${dup.paymentId} for ${formatUSD(dup.paidAmountUSD)} appears ${matchingRows.length} times. Distinct Payment ID aggregation applied.`,
      severity: 'High',
      status: approvedTreatments[`DISC-FIN-DUP-PAY-${dup.paymentId}`] ? 'Approved' : 'Open',
      category: 'Duplicate Key',
      sourceRows: matchingRows.map((m) => ({
        dataset: 'Payments',
        fileName: m.file,
        rowNumber: m.row,
        data: m.rec,
      })),
      calculationBreakdown: [
        { label: 'Payment ID Occurrences', formula: `Count of ${dup.paymentId}`, result: `${matchingRows.length}` },
        { label: 'Provisional Cleared USD', formula: 'Distinct 1st instance cleared amount', result: formatUSD(dup.paidAmountUSD) },
        { label: 'Potential Over-Credit', formula: `${formatUSD(dup.paidAmountUSD * (matchingRows.length - 1))}`, result: 'Excluded from totals' },
      ],
      comparedValues: {
        label: 'Occurrences',
        val1: matchingRows.length,
        val2: 1,
        signedDifference: `+${matchingRows.length - 1} extra`,
      },
      possibleReasons: ['Re-processed transaction batch', 'Bank feed re-transmission duplicate'],
      recommendedAction: 'Cross-check bank statement reference to ensure no double settlement occurred.',
      proposedTreatment: 'Deduplicate payment ID; aggregate only once in cleared receipts.',
      approvedTreatment: approvedTreatments[`DISC-FIN-DUP-PAY-${dup.paymentId}`],
    });
  });

  // Distinct payments map by paymentId to prevent inflating totals
  const distinctPaymentsMap = new Map<string, PaymentRecord>();
  rawPayments.forEach(({ rec }) => {
    if (!distinctPaymentsMap.has(rec.paymentId)) {
      distinctPaymentsMap.set(rec.paymentId, rec);
    }
  });

  // Distinct invoices map by invoiceId
  const distinctInvoicesMap = new Map<string, { rec: InvoiceRecord; file: string; row: number }>();
  rawInvoices.forEach((item) => {
    if (!distinctInvoicesMap.has(item.rec.invoiceId)) {
      distinctInvoicesMap.set(item.rec.invoiceId, item);
    }
  });

  // Group payments by invoiceRef
  const paymentsByInvoice = new Map<string, PaymentRecord[]>();
  const unmatchedPayments: PaymentRecord[] = [];
  const pendingReceipts: PaymentRecord[] = [];

  Array.from(distinctPaymentsMap.values()).forEach((pay) => {
    if (!pay.invoiceRef || !distinctInvoicesMap.has(pay.invoiceRef)) {
      unmatchedPayments.push(pay);
      discrepancies.push({
        id: `DISC-FIN-ORPHAN-PAY-${pay.paymentId}`,
        domain: 'Finance',
        recordId: pay.paymentId,
        title: `Unmatched Payment Receipt: ${pay.paymentId}`,
        description: `Payment ${pay.paymentId} of ${formatUSD(pay.paidAmountUSD)} references invoice '${pay.invoiceRef}', which does not exist in the Invoices register.`,
        severity: 'High',
        status: approvedTreatments[`DISC-FIN-ORPHAN-PAY-${pay.paymentId}`] ? 'Approved' : 'Open',
        category: 'Unmatched Row',
        sourceRows: [
          {
            dataset: 'Payments',
            fileName: pay.sourceFile,
            rowNumber: pay.sourceRow,
            data: pay,
          },
        ],
        calculationBreakdown: [
          { label: 'Paid Amount USD', formula: 'Receipt amount', result: formatUSD(pay.paidAmountUSD) },
          { label: 'Invoice Match Status', formula: `Invoices.has('${pay.invoiceRef}')`, result: 'FALSE (Not Found)' },
        ],
        comparedValues: {
          label: 'Invoice Match',
          val1: pay.invoiceRef || 'BLANK',
          val2: 'Existing Invoice ID',
          signedDifference: 'Unmatched',
        },
        possibleReasons: ['Payment for pre-period invoice not in current batch', 'Typo in customer invoice reference', 'Unallocated deposit'],
        recommendedAction: 'Check general ledger accounts receivable suspense account for unallocated deposit.',
        proposedTreatment: 'Hold in unapplied cash register; exclude from matched invoice cleared cash.',
        approvedTreatment: approvedTreatments[`DISC-FIN-ORPHAN-PAY-${pay.paymentId}`],
      });
    } else {
      const list = paymentsByInvoice.get(pay.invoiceRef) || [];
      list.push(pay);
      paymentsByInvoice.set(pay.invoiceRef, list);
    }
  });

  const reconciledInvoices: ReconciledFinanceInvoice[] = [];
  let totalInvoicedUSD = 0;
  let matchedClearedReceiptsUSD = 0;
  let grossOutstandingUSD = 0;
  let overpaymentsUSD = 0;

  distinctInvoicesMap.forEach(({ rec, file, row }) => {
    totalInvoicedUSD = addUSD(totalInvoicedUSD, rec.invoiceAmountUSD);
    const relatedPayments = paymentsByInvoice.get(rec.invoiceId) || [];

    // Sum distinct cleared payments
    let clearedPaid = 0;
    let hasPending = false;

    relatedPayments.forEach((p) => {
      const statusLower = p.paymentStatus.toLowerCase().trim();
      if (statusLower === 'cleared') {
        clearedPaid = addUSD(clearedPaid, p.paidAmountUSD);
      } else if (statusLower === 'pending') {
        hasPending = true;
        pendingReceipts.push(p);
      }
    });

    const balance = subUSD(rec.invoiceAmountUSD, clearedPaid);
    let status: ReconciledFinanceInvoice['status'] = 'Unpaid';

    if (clearedPaid === 0 && hasPending) {
      status = 'Pending Receipt';
    } else if (clearedPaid === 0) {
      status = 'Unpaid';
      grossOutstandingUSD = addUSD(grossOutstandingUSD, balance);
    } else if (balance === 0) {
      status = 'Fully Paid';
    } else if (balance > 0) {
      status = 'Partially Paid';
      grossOutstandingUSD = addUSD(grossOutstandingUSD, balance);
    } else {
      status = 'Overpaid';
      overpaymentsUSD = addUSD(overpaymentsUSD, Math.abs(balance));
    }

    matchedClearedReceiptsUSD = addUSD(matchedClearedReceiptsUSD, clearedPaid);

    const isDup = (invoiceCountMap.get(rec.invoiceId) || 0) > 1;

    reconciledInvoices.push({
      invoiceId: rec.invoiceId,
      invoiceDate: rec.invoiceDate,
      customerName: rec.customerName,
      invoiceAmountUSD: rec.invoiceAmountUSD,
      clearedPaidUSD: clearedPaid,
      balanceUSD: balance,
      status,
      matchedPayments: relatedPayments,
      isDuplicate: isDup,
      notes: isDup ? 'Provisional distinct row (duplicate detected)' : '',
      sourceRow: row,
      sourceFile: file,
    });

    // Check for specific discrepancy flags
    if (status === 'Partially Paid') {
      discrepancies.push({
        id: `DISC-FIN-PARTIAL-${rec.invoiceId}`,
        domain: 'Finance',
        recordId: rec.invoiceId,
        title: `Partial Payment: ${rec.invoiceId} (${rec.customerName})`,
        description: `Invoice ${rec.invoiceId} of ${formatUSD(rec.invoiceAmountUSD)} has cleared payments of ${formatUSD(clearedPaid)}, leaving an outstanding balance of ${formatUSD(balance)}.`,
        severity: 'Medium',
        status: approvedTreatments[`DISC-FIN-PARTIAL-${rec.invoiceId}`] ? 'Approved' : 'Open',
        category: 'Partial Settlement',
        sourceRows: [
          { dataset: 'Invoices', fileName: file, rowNumber: row, data: rec },
          ...relatedPayments.map((p) => ({
            dataset: 'Payments',
            fileName: p.sourceFile,
            rowNumber: p.sourceRow,
            data: p,
          })),
        ],
        calculationBreakdown: [
          { label: 'Invoice Amount USD', formula: 'Invoices.InvoiceAmountUSD', result: formatUSD(rec.invoiceAmountUSD) },
          { label: 'Cleared Paid USD', formula: 'SUM(Payments.PaidAmountUSD WHERE Cleared)', result: formatUSD(clearedPaid) },
          { label: 'Balance Outstanding USD', formula: 'InvoiceAmountUSD - ClearedPaidUSD', result: formatUSD(balance) },
        ],
        comparedValues: {
          label: 'Outstanding Balance',
          val1: formatUSD(rec.invoiceAmountUSD),
          val2: formatUSD(clearedPaid),
          signedDifference: `+${formatUSD(balance)}`,
        },
        possibleReasons: ['Installment payment agreed', 'Customer withheld withholding tax or retention fee', 'Pending second tranche'],
        recommendedAction: 'Issue reminder notice to customer or verify whether credit note/withholding tax deduction applies.',
        proposedTreatment: 'Maintain gross outstanding balance in Accounts Receivable aging.',
        approvedTreatment: approvedTreatments[`DISC-FIN-PARTIAL-${rec.invoiceId}`],
      });
    } else if (status === 'Overpaid') {
      discrepancies.push({
        id: `DISC-FIN-OVER-${rec.invoiceId}`,
        domain: 'Finance',
        recordId: rec.invoiceId,
        title: `Overpayment: ${rec.invoiceId} (${rec.customerName})`,
        description: `Customer paid ${formatUSD(clearedPaid)} on an invoice of ${formatUSD(rec.invoiceAmountUSD)}, resulting in an overpayment credit of ${formatUSD(Math.abs(balance))}.`,
        severity: 'Medium',
        status: approvedTreatments[`DISC-FIN-OVER-${rec.invoiceId}`] ? 'Approved' : 'Open',
        category: 'Overpayment',
        sourceRows: [
          { dataset: 'Invoices', fileName: file, rowNumber: row, data: rec },
          ...relatedPayments.map((p) => ({
            dataset: 'Payments',
            fileName: p.sourceFile,
            rowNumber: p.sourceRow,
            data: p,
          })),
        ],
        calculationBreakdown: [
          { label: 'Invoice Amount USD', formula: 'Invoices.InvoiceAmountUSD', result: formatUSD(rec.invoiceAmountUSD) },
          { label: 'Cleared Paid USD', formula: 'SUM(Payments.PaidAmountUSD)', result: formatUSD(clearedPaid) },
          { label: 'Overpayment Credit USD', formula: 'ClearedPaidUSD - InvoiceAmountUSD', result: formatUSD(Math.abs(balance)) },
        ],
        comparedValues: {
          label: 'Customer Payment vs Invoiced',
          val1: formatUSD(clearedPaid),
          val2: formatUSD(rec.invoiceAmountUSD),
          signedDifference: `-${formatUSD(Math.abs(balance))} (Credit)`,
        },
        possibleReasons: ['Customer included wire transfer fee in principal', 'Double payment of invoice portion', 'Prepayment applied erroneously'],
        recommendedAction: 'Contact customer finance team; apply credit against next invoice or process refund voucher.',
        proposedTreatment: 'Book overpayment to Customer Credit Liability balance.',
        approvedTreatment: approvedTreatments[`DISC-FIN-OVER-${rec.invoiceId}`],
      });
    } else if (hasPending) {
      discrepancies.push({
        id: `DISC-FIN-PEND-${rec.invoiceId}`,
        domain: 'Finance',
        recordId: rec.invoiceId,
        title: `Pending Cash Receipt: ${rec.invoiceId}`,
        description: `Invoice ${rec.invoiceId} has a payment entry with status 'Pending'. A pending receipt is not cleared cash and cannot reduce outstanding receivable balance until bank settlement.`,
        severity: 'Info',
        status: approvedTreatments[`DISC-FIN-PEND-${rec.invoiceId}`] ? 'Approved' : 'Open',
        category: 'Pending Receipt',
        sourceRows: [
          { dataset: 'Invoices', fileName: file, rowNumber: row, data: rec },
          ...relatedPayments.map((p) => ({
            dataset: 'Payments',
            fileName: p.sourceFile,
            rowNumber: p.sourceRow,
            data: p,
          })),
        ],
        calculationBreakdown: [
          { label: 'Invoice Amount USD', formula: 'Invoices.InvoiceAmountUSD', result: formatUSD(rec.invoiceAmountUSD) },
          { label: 'Pending Payment USD', formula: 'Payments WHERE PaymentStatus == Pending', result: formatUSD(rec.invoiceAmountUSD) },
          { label: 'Cleared Recognized USD', formula: 'Cash recognition rule', result: '$0.00' },
        ],
        comparedValues: {
          label: 'Bank Cleared vs Stated',
          val1: 'Pending',
          val2: 'Cleared',
          signedDifference: 'Awaiting Settlement',
        },
        possibleReasons: ['Check in clearing transit', 'ACH clearance period pending', 'Gateway batch processing delay'],
        recommendedAction: 'Monitor bank statement for ACH/cheque settlement before posting to general ledger.',
        proposedTreatment: 'Keep invoice in open receivable until bank clearing confirmation arrives.',
        approvedTreatment: approvedTreatments[`DISC-FIN-PEND-${rec.invoiceId}`],
      });
    }
  });

  const netDifferenceUSD = subUSD(totalInvoicedUSD, matchedClearedReceiptsUSD);

  // ==========================================
  // 3. INVENTORY RECONCILIATION ENGINE
  // ==========================================
  // Composite key: SKU + '::' + Warehouse
  const getInvKey = (sku: string, wh: string) => `${cleanString(sku).toUpperCase()}::${cleanString(wh).toLowerCase()}`;

  const invSystemMap = new Map<string, { rec: InventorySystemRecord; file: string; row: number }>();
  rawInvSystem.forEach((item) => {
    const k = getInvKey(item.rec.sku, item.rec.warehouse);
    invSystemMap.set(k, item);
  });

  // Group physical counts by composite key
  const countsByCompositeKey = new Map<string, { rec: InventoryCountRecord; file: string; row: number }[]>();
  rawInvCounts.forEach((item) => {
    const k = getInvKey(item.rec.sku, item.rec.warehouse);
    const list = countsByCompositeKey.get(k) || [];
    list.push(item);
    countsByCompositeKey.set(k, list);
  });

  const reconciledInventory: ReconciledInventoryItem[] = [];
  const missingCountSkus: string[] = [];
  const conflictingCountSkus: string[] = [];
  const orphanCounts: InventoryCountRecord[] = [];

  let totalExpectedValueUSD = 0;
  let totalVarianceUnits = 0;
  let totalShortageUnits = 0;
  let totalSurplusUnits = 0;
  let totalVarianceValueUSD = 0;
  let shortageValueUSD = 0;
  let surplusValueUSD = 0;

  // Process system records
  invSystemMap.forEach(({ rec, file, row }, compositeKey) => {
    const expectedValue = multUSD(rec.expectedQty, rec.unitCostUSD);
    totalExpectedValueUSD = addUSD(totalExpectedValueUSD, expectedValue);

    const physicalList = countsByCompositeKey.get(compositeKey) || [];

    if (physicalList.length === 0) {
      // MISSING PHYSICAL COUNT
      missingCountSkus.push(rec.sku);
      reconciledInventory.push({
        sku: rec.sku,
        warehouse: rec.warehouse,
        expectedQty: rec.expectedQty,
        unitCostUSD: rec.unitCostUSD,
        countedQty: null,
        varianceUnits: null,
        varianceValueUSD: null,
        countStatus: 'Missing Count',
        countRecords: [],
        isConflictingRecount: false,
      });

      discrepancies.push({
        id: `DISC-INV-MISSING-${rec.sku}-${rec.warehouse}`,
        domain: 'Inventory',
        recordId: rec.sku,
        title: `Missing Physical Stock Count: ${rec.sku} (${rec.warehouse})`,
        description: `ERP system expects ${rec.expectedQty} units at ${formatUSD(rec.unitCostUSD)}/unit (${formatUSD(expectedValue)}), but no physical stock audit record exists for ${rec.warehouse}.`,
        severity: 'High',
        status: approvedTreatments[`DISC-INV-MISSING-${rec.sku}-${rec.warehouse}`] ? 'Approved' : 'Open',
        category: 'Missing Physical Count',
        sourceRows: [
          { dataset: 'Inventory System (ERP)', fileName: file, rowNumber: row, data: rec },
        ],
        calculationBreakdown: [
          { label: 'Expected Qty', formula: 'ERP System on-hand', result: `${rec.expectedQty} units` },
          { label: 'Counted Qty', formula: 'Warehouse count audit', result: 'MISSING (Null)' },
          { label: 'Inventory Value at Risk', formula: 'ExpectedQty * UnitCostUSD', result: formatUSD(expectedValue) },
        ],
        comparedValues: {
          label: 'Audit Count',
          val1: 'Missing',
          val2: `${rec.expectedQty} expected`,
          signedDifference: 'Uncounted',
        },
        possibleReasons: ['Item in inaccessible bin during count', 'Audit sheet page omitted during data entry', 'Cycle count scheduled for next day'],
        recommendedAction: 'Dispatch warehouse auditor for immediate spot count of SKU bin in designated warehouse.',
        proposedTreatment: 'Exclude from clean variance calculations until physical count certificate is filed.',
        approvedTreatment: approvedTreatments[`DISC-INV-MISSING-${rec.sku}-${rec.warehouse}`],
      });
    } else if (physicalList.length > 1) {
      // CONFLICTING RECOUNTS
      conflictingCountSkus.push(rec.sku);

      // Check if user approved a specific countId
      const treatmentKey = `DISC-INV-CONFLICT-${rec.sku}-${rec.warehouse}`;
      const approvedCountId = approvedTreatments[treatmentKey];

      const selectedCount = approvedCountId
        ? physicalList.find((p) => p.rec.countId === approvedCountId)?.rec
        : null;

      let varianceUnits: number | null = null;
      let varianceValueUSD: number | null = null;

      if (selectedCount) {
        varianceUnits = selectedCount.countedQty - rec.expectedQty;
        varianceValueUSD = multUSD(varianceUnits, rec.unitCostUSD);
        totalVarianceUnits += varianceUnits;
        totalVarianceValueUSD = addUSD(totalVarianceValueUSD, varianceValueUSD);
        if (varianceUnits < 0) {
          totalShortageUnits += Math.abs(varianceUnits);
          shortageValueUSD = addUSD(shortageValueUSD, Math.abs(varianceValueUSD));
        } else if (varianceUnits > 0) {
          totalSurplusUnits += varianceUnits;
          surplusValueUSD = addUSD(surplusValueUSD, varianceValueUSD);
        }
      }

      reconciledInventory.push({
        sku: rec.sku,
        warehouse: rec.warehouse,
        expectedQty: rec.expectedQty,
        unitCostUSD: rec.unitCostUSD,
        countedQty: selectedCount ? selectedCount.countedQty : null,
        varianceUnits,
        varianceValueUSD,
        countStatus: 'Conflicting Counts',
        countRecords: physicalList.map((p) => p.rec),
        isConflictingRecount: true,
        approvedCountId,
      });

      discrepancies.push({
        id: treatmentKey,
        domain: 'Inventory',
        recordId: rec.sku,
        title: `Conflicting Recounts: ${rec.sku} (${rec.warehouse})`,
        description: `Found ${physicalList.length} distinct physical counts for ${rec.sku} in ${rec.warehouse}: ${physicalList.map((p) => `${p.rec.countId}: ${p.rec.countedQty} units`).join(' vs ')}. Never add repeated counts together! Excluded from clean variance until verified.`,
        severity: 'High',
        status: approvedCountId ? 'Approved' : 'Open',
        category: 'Conflicting Recount',
        sourceRows: [
          { dataset: 'Inventory System (ERP)', fileName: file, rowNumber: row, data: rec },
          ...physicalList.map((p) => ({
            dataset: 'Physical Count',
            fileName: p.file,
            rowNumber: p.row,
            data: p.rec,
          })),
        ],
        calculationBreakdown: physicalList.map((p, i) => ({
          label: `Count Option ${i + 1} (${p.rec.countId})`,
          formula: `${p.rec.countedQty} counted - ${rec.expectedQty} expected`,
          result: `${p.rec.countedQty - rec.expectedQty > 0 ? '+' : ''}${p.rec.countedQty - rec.expectedQty} units (${formatUSD((p.rec.countedQty - rec.expectedQty) * rec.unitCostUSD)})`,
        })),
        comparedValues: {
          label: 'Conflicting Counts',
          val1: physicalList[0]?.rec.countedQty ?? 0,
          val2: physicalList[1]?.rec.countedQty ?? 0,
          signedDifference: `Diff: ${Math.abs((physicalList[0]?.rec.countedQty || 0) - (physicalList[1]?.rec.countedQty || 0))} units`,
        },
        possibleReasons: ['Two auditors independently counted same aisle', 'Recount performed after initial dispute without voiding first count'],
        recommendedAction: 'Review signed warehouse count sheets or approve the supervisor recount.',
        proposedTreatment: `Select evidenced valid count (${physicalList[physicalList.length - 1]?.rec.countId || 'latest'}) as analytical baseline.`,
        approvedTreatment: approvedCountId,
      });
    } else {
      // SINGLE UNAMBIGUOUS PHYSICAL COUNT
      const count = physicalList[0].rec;
      const varianceUnits = count.countedQty - rec.expectedQty;
      const varianceVal = multUSD(varianceUnits, rec.unitCostUSD);

      totalVarianceUnits += varianceUnits;
      totalVarianceValueUSD = addUSD(totalVarianceValueUSD, varianceVal);

      let countStatus: ReconciledInventoryItem['countStatus'] = 'Reconciled';
      if (varianceUnits < 0) {
        countStatus = 'Shortage';
        totalShortageUnits += Math.abs(varianceUnits);
        shortageValueUSD = addUSD(shortageValueUSD, Math.abs(varianceVal));
      } else if (varianceUnits > 0) {
        countStatus = 'Surplus';
        totalSurplusUnits += varianceUnits;
        surplusValueUSD = addUSD(surplusValueUSD, varianceVal);
      }

      reconciledInventory.push({
        sku: rec.sku,
        warehouse: rec.warehouse,
        expectedQty: rec.expectedQty,
        unitCostUSD: rec.unitCostUSD,
        countedQty: count.countedQty,
        varianceUnits,
        varianceValueUSD: varianceVal,
        countStatus,
        countRecords: [count],
        isConflictingRecount: false,
      });

      if (varianceUnits !== 0) {
        discrepancies.push({
          id: `DISC-INV-VAR-${rec.sku}-${rec.warehouse}`,
          domain: 'Inventory',
          recordId: rec.sku,
          title: `Stock ${varianceUnits < 0 ? 'Shortage' : 'Surplus'}: ${rec.sku} (${rec.warehouse})`,
          description: `SKU ${rec.sku} at ${rec.warehouse} has expected ${rec.expectedQty} units, counted ${count.countedQty} units. Difference is ${varianceUnits} units at ${formatUSD(rec.unitCostUSD)}/unit (${formatUSD(varianceVal)}).`,
          severity: Math.abs(varianceVal) > 200 ? 'High' : 'Medium',
          status: approvedTreatments[`DISC-INV-VAR-${rec.sku}-${rec.warehouse}`] ? 'Approved' : 'Open',
          category: varianceUnits < 0 ? 'Shortage' : 'Surplus',
          sourceRows: [
            { dataset: 'Inventory System (ERP)', fileName: file, rowNumber: row, data: rec },
            { dataset: 'Physical Count', fileName: physicalList[0].file, rowNumber: physicalList[0].row, data: count },
          ],
          calculationBreakdown: [
            { label: 'Expected Qty', formula: 'ERP on-hand', result: `${rec.expectedQty} units` },
            { label: 'Counted Qty', formula: 'Physical audit', result: `${count.countedQty} units` },
            { label: 'Variance Units', formula: 'CountedQty - ExpectedQty', result: `${varianceUnits > 0 ? '+' : ''}${varianceUnits} units` },
            { label: 'Unit Cost USD', formula: 'ERP UnitCostUSD', result: formatUSD(rec.unitCostUSD) },
            { label: 'Variance Value USD', formula: 'VarianceUnits * UnitCostUSD', result: formatUSD(varianceVal) },
          ],
          comparedValues: {
            label: 'Count vs Expected',
            val1: `${count.countedQty} counted`,
            val2: `${rec.expectedQty} expected`,
            signedDifference: `${varianceUnits > 0 ? '+' : ''}${varianceUnits} units (${formatUSD(varianceVal)})`,
          },
          possibleReasons: [
            varianceUnits < 0 ? 'Shrinkage, misplacement, or unposted dispatch note' : 'Unrecorded purchase receipt or return',
            'Cross-SKU barcode scanning error at packing station',
          ],
          recommendedAction: 'Check dispatch logs for unrecorded delivery notes; prepare inventory adjustment authorization.',
          proposedTreatment: 'Book inventory adjustment write-off/write-on to Inventory Shrinkage/Gain account.',
          approvedTreatment: approvedTreatments[`DISC-INV-VAR-${rec.sku}-${rec.warehouse}`],
        });
      }
    }
  });

  // Check for orphan physical counts (not in ERP)
  countsByCompositeKey.forEach((physicalList, compositeKey) => {
    if (!invSystemMap.has(compositeKey)) {
      physicalList.forEach(({ rec, file, row }) => {
        orphanCounts.push(rec);
        discrepancies.push({
          id: `DISC-INV-ORPHAN-${rec.countId}`,
          domain: 'Inventory',
          recordId: rec.sku,
          title: `Orphan Physical Count: ${rec.sku} (${rec.warehouse})`,
          description: `Physical count ${rec.countId} recorded ${rec.countedQty} units for SKU ${rec.sku} in ${rec.warehouse}, but no corresponding SKU exists in the ERP Inventory Master.`,
          severity: 'High',
          status: approvedTreatments[`DISC-INV-ORPHAN-${rec.countId}`] ? 'Approved' : 'Open',
          category: 'Orphan Count',
          sourceRows: [
            { dataset: 'Physical Count', fileName: file, rowNumber: row, data: rec },
          ],
          calculationBreakdown: [
            { label: 'Counted Qty', formula: 'Audit row', result: `${rec.countedQty} units` },
            { label: 'ERP Record', formula: `ERP.has('${rec.sku}')`, result: 'NOT FOUND' },
          ],
          comparedValues: {
            label: 'ERP Match',
            val1: rec.sku,
            val2: 'ERP Catalog',
            signedDifference: 'Missing Master Record',
          },
          possibleReasons: ['Consignment stock not owned by entity', 'Retired SKU barcode retained on physical carton', 'New product received prior to ERP master creation'],
          recommendedAction: 'Verify procurement invoice to see if SKU was newly cataloged without ERP item creation.',
          proposedTreatment: 'Segregate inventory in quarantine bay pending ERP catalog setup.',
          approvedTreatment: approvedTreatments[`DISC-INV-ORPHAN-${rec.countId}`],
        });
      });
    }
  });

  // ==========================================
  // 4. HR RECONCILIATION ENGINE
  // ==========================================
  // Composite key: EmployeeID + '::' + Month
  const getHrKey = (empId: string, month: string) => `${cleanString(empId).toUpperCase()}::${cleanString(month).trim()}`;

  const hrAttendMap = new Map<string, { rec: HRAttendanceRecord; file: string; row: number }>();
  rawHRAttend.forEach((item) => {
    const k = getHrKey(item.rec.employeeId, item.rec.reportMonth);
    hrAttendMap.set(k, item);
  });

  const hrPayrollMap = new Map<string, { rec: HRPayrollRecord; file: string; row: number }>();
  rawHRPayroll.forEach((item) => {
    const k = getHrKey(item.rec.employeeId, item.rec.payrollMonth);
    hrPayrollMap.set(k, item);
  });

  const allHrKeys = new Set([...hrAttendMap.keys(), ...hrPayrollMap.keys()]);
  const reconciledHR: ReconciledHREmployee[] = [];

  let unexplainedGapCount = 0;
  let totalUnexplainedDays = 0;
  let missingPayrollCount = 0;
  let missingAttendanceCount = 0;
  let unapprovedPayrollCount = 0;

  allHrKeys.forEach((k) => {
    const attendItem = hrAttendMap.get(k);
    const payrollItem = hrPayrollMap.get(k);

    const empId = attendItem?.rec.employeeId || payrollItem?.rec.employeeId || 'Unknown';
    const month = attendItem?.rec.reportMonth || payrollItem?.rec.payrollMonth || '2026-10';

    if (attendItem && !payrollItem) {
      // Missing payroll record
      missingPayrollCount++;
      reconciledHR.push({
        employeeId: empId,
        month,
        daysPresent: attendItem.rec.daysPresent,
        approvedLeaveDays: attendItem.rec.approvedLeaveDays,
        scheduledWorkDays: attendItem.rec.scheduledWorkDays,
        daysPaid: null,
        dailyRateUSD: null,
        grossPayUSD: null,
        approvalStatus: null,
        rawPaidDayGap: null,
        unexplainedDayGap: null,
        status: 'Missing Payroll',
        notes: `Attendance recorded (${attendItem.rec.daysPresent} present) but omitted from Payroll Register.`,
      });

      discrepancies.push({
        id: `DISC-HR-NOPAY-${empId}-${month}`,
        domain: 'HR',
        recordId: empId,
        title: `Attendance Without Payroll: ${empId} (${month})`,
        description: `Employee ${empId} has biometric attendance recorded (${attendItem.rec.daysPresent} days present, ${attendItem.rec.approvedLeaveDays} approved leave), but no payroll disbursement was scheduled.`,
        severity: 'High',
        status: approvedTreatments[`DISC-HR-NOPAY-${empId}-${month}`] ? 'Approved' : 'Open',
        category: 'Missing Payroll',
        sourceRows: [
          { dataset: 'Biometric Attendance', fileName: attendItem.file, rowNumber: attendItem.row, data: attendItem.rec },
        ],
        calculationBreakdown: [
          { label: 'Days Present', formula: 'Biometric logs', result: `${attendItem.rec.daysPresent} days` },
          { label: 'Payroll Record', formula: `Payroll.has('${empId}')`, result: 'MISSING' },
        ],
        comparedValues: {
          label: 'Payroll Status',
          val1: 'Unpaid / Omitted',
          val2: `${attendItem.rec.daysPresent} days present`,
          signedDifference: 'Missing Payroll',
        },
        possibleReasons: ['Employee onboarding missed in payroll batch cutoff', 'Contractor paid through Accounts Payable rather than payroll', 'Bank account change hold'],
        recommendedAction: 'Process supplementary off-cycle payroll run to avoid statutory compensation violation.',
        proposedTreatment: 'Issue off-cycle supplementary payment voucher.',
        approvedTreatment: approvedTreatments[`DISC-HR-NOPAY-${empId}-${month}`],
      });
    } else if (!attendItem && payrollItem) {
      // Missing attendance record
      missingAttendanceCount++;
      reconciledHR.push({
        employeeId: empId,
        month,
        daysPresent: null,
        approvedLeaveDays: null,
        scheduledWorkDays: null,
        daysPaid: payrollItem.rec.daysPaid,
        dailyRateUSD: payrollItem.rec.dailyRateUSD,
        grossPayUSD: payrollItem.rec.grossPayUSD,
        approvalStatus: payrollItem.rec.approvalStatus,
        rawPaidDayGap: null,
        unexplainedDayGap: null,
        status: 'Missing Attendance',
        notes: `Payroll disbursed (${payrollItem.rec.daysPaid} days, ${formatUSD(payrollItem.rec.grossPayUSD)}) but no attendance record found.`,
      });

      discrepancies.push({
        id: `DISC-HR-NOATTEND-${empId}-${month}`,
        domain: 'HR',
        recordId: empId,
        title: `Payroll Without Attendance: ${empId} (${month})`,
        description: `Payroll record ${payrollItem.rec.payrollId} disbursed ${payrollItem.rec.daysPaid} days (${formatUSD(payrollItem.rec.grossPayUSD)}) to ${empId}, but no biometric attendance was provided.`,
        severity: 'High',
        status: approvedTreatments[`DISC-HR-NOATTEND-${empId}-${month}`] ? 'Approved' : 'Open',
        category: 'Missing Attendance',
        sourceRows: [
          { dataset: 'Payroll Register', fileName: payrollItem.file, rowNumber: payrollItem.row, data: payrollItem.rec },
        ],
        calculationBreakdown: [
          { label: 'Days Paid', formula: 'Payroll.DaysPaid', result: `${payrollItem.rec.daysPaid} days` },
          { label: 'Gross Pay USD', formula: 'Payroll.GrossPayUSD', result: formatUSD(payrollItem.rec.grossPayUSD) },
          { label: 'Attendance Record', formula: `Attendance.has('${empId}')`, result: 'NOT SUPPLIED' },
        ],
        comparedValues: {
          label: 'Attendance Verification',
          val1: 'Missing Log',
          val2: `${payrollItem.rec.daysPaid} days paid`,
          signedDifference: 'Unverified Days',
        },
        possibleReasons: ['Remote worker or executive exempt from biometric clock-in', 'Faulty biometric scanner at branch', 'Ghost worker record error'],
        recommendedAction: 'Request manual timesheet sign-off from department director before finalizing ledger audit.',
        proposedTreatment: 'Flag for line-manager timesheet validation.',
        approvedTreatment: approvedTreatments[`DISC-HR-NOATTEND-${empId}-${month}`],
      });
    } else if (attendItem && payrollItem) {
      const attend = attendItem.rec;
      const pay = payrollItem.rec;

      const rawPaidDayGap = pay.daysPaid - attend.daysPresent;
      const unexplainedDayGap = pay.daysPaid - (attend.daysPresent + attend.approvedLeaveDays);

      let status: ReconciledHREmployee['status'] = 'Reconciled';
      let notes = 'Attendance and payroll match exactly.';

      if (pay.approvalStatus.toLowerCase().trim() !== 'approved') {
        unapprovedPayrollCount++;
        status = 'Unapproved Payroll';
        notes = `Payroll approval status is '${pay.approvalStatus}'. Not yet officially approved.`;

        discrepancies.push({
          id: `DISC-HR-STATUS-${empId}-${month}`,
          domain: 'HR',
          recordId: empId,
          title: `Unapproved Payroll Entry: ${empId} (${month})`,
          description: `Payroll record ${pay.payrollId} for ${empId} is marked as '${pay.approvalStatus}'. Only 'Approved' payroll disbursements should be cleared for banking transmission.`,
          severity: 'Medium',
          status: approvedTreatments[`DISC-HR-STATUS-${empId}-${month}`] ? 'Approved' : 'Open',
          category: 'Unapproved Payroll',
          sourceRows: [
            { dataset: 'Payroll Register', fileName: payrollItem.file, rowNumber: payrollItem.row, data: pay },
          ],
          calculationBreakdown: [
            { label: 'Approval Status', formula: 'Payroll.ApprovalStatus', result: pay.approvalStatus },
            { label: 'Disbursement Amount', formula: 'GrossPayUSD', result: formatUSD(pay.grossPayUSD) },
          ],
          comparedValues: {
            label: 'Approval Verification',
            val1: pay.approvalStatus,
            val2: 'Approved',
            signedDifference: 'Unapproved Status',
          },
          possibleReasons: ['Draft payroll pending head-of-department final approval', 'Dispute over bonus calculation'],
          recommendedAction: 'Route to HR Director for sign-off or revert payroll status to draft in ERP.',
          proposedTreatment: 'Hold payment batch until formal executive sign-off is logged.',
          approvedTreatment: approvedTreatments[`DISC-HR-STATUS-${empId}-${month}`],
        });
      } else if (unexplainedDayGap !== 0) {
        unexplainedGapCount++;
        totalUnexplainedDays += Math.abs(unexplainedDayGap);
        status = 'Unexplained Gap';
        notes = `Unexplained gap of ${unexplainedDayGap > 0 ? '+' : ''}${unexplainedDayGap} days after accounting for ${attend.approvedLeaveDays} approved leave days.`;

        discrepancies.push({
          id: `DISC-HR-GAP-${empId}-${month}`,
          domain: 'HR',
          recordId: empId,
          title: `Unexplained Payroll Day Gap: ${empId} (${month})`,
          description: `Employee ${empId} was paid for ${pay.daysPaid} days, but biometric records show ${attend.daysPresent} days present with ${attend.approvedLeaveDays} approved leave days. Unexplained difference: ${unexplainedDayGap > 0 ? '+' : ''}${unexplainedDayGap} days.`,
          severity: 'High',
          status: approvedTreatments[`DISC-HR-GAP-${empId}-${month}`] ? 'Approved' : 'Open',
          category: 'Unexplained Day Gap',
          sourceRows: [
            { dataset: 'Biometric Attendance', fileName: attendItem.file, rowNumber: attendItem.row, data: attend },
            { dataset: 'Payroll Register', fileName: payrollItem.file, rowNumber: payrollItem.row, data: pay },
          ],
          calculationBreakdown: [
            { label: 'Days Present', formula: 'Biometric check-ins', result: `${attend.daysPresent} days` },
            { label: 'Approved Leave Days', formula: 'HR approved leave', result: `${attend.approvedLeaveDays} days` },
            { label: 'Total Legitimate Days', formula: 'DaysPresent + ApprovedLeaveDays', result: `${attend.daysPresent + attend.approvedLeaveDays} days` },
            { label: 'Days Paid', formula: 'Payroll.DaysPaid', result: `${pay.daysPaid} days` },
            { label: 'Raw Day Gap', formula: 'DaysPaid - DaysPresent', result: `${rawPaidDayGap > 0 ? '+' : ''}${rawPaidDayGap} days` },
            { label: 'Unexplained Day Gap', formula: 'DaysPaid - (DaysPresent + ApprovedLeaveDays)', result: `${unexplainedDayGap > 0 ? '+' : ''}${unexplainedDayGap} days` },
            { label: 'Financial Impact USD', formula: `UnexplainedDays * DailyRateUSD (${formatUSD(pay.dailyRateUSD)})`, result: formatUSD(unexplainedDayGap * pay.dailyRateUSD) },
          ],
          comparedValues: {
            label: 'Paid vs Explained Days',
            val1: `${pay.daysPaid} days paid`,
            val2: `${attend.daysPresent + attend.approvedLeaveDays} explained days`,
            signedDifference: `${unexplainedDayGap > 0 ? '+' : ''}${unexplainedDayGap} days (${formatUSD(unexplainedDayGap * pay.dailyRateUSD)})`,
          },
          possibleReasons: ['Overtime paid as equivalent full days without leave log', 'Unrecorded official travel or training attendance', 'Manual payroll adjustment error'],
          recommendedAction: 'Verify whether travel or training days were approved outside the biometric portal; adjust payroll in next pay period if overpaid.',
          proposedTreatment: 'Flag for HR payroll reconciliation audit; do not automatically deduct pay without employee consultation.',
          approvedTreatment: approvedTreatments[`DISC-HR-GAP-${empId}-${month}`],
        });
      } else if (rawPaidDayGap !== 0 && unexplainedDayGap === 0) {
        status = 'Explained by Leave';
        notes = `Raw gap of ${rawPaidDayGap > 0 ? '+' : ''}${rawPaidDayGap} days is fully reconciled by ${attend.approvedLeaveDays} approved paid leave days.`;
      }

      reconciledHR.push({
        employeeId: empId,
        month,
        daysPresent: attend.daysPresent,
        approvedLeaveDays: attend.approvedLeaveDays,
        scheduledWorkDays: attend.scheduledWorkDays,
        daysPaid: pay.daysPaid,
        dailyRateUSD: pay.dailyRateUSD,
        grossPayUSD: pay.grossPayUSD,
        approvalStatus: pay.approvalStatus,
        rawPaidDayGap,
        unexplainedDayGap,
        status,
        notes,
      });
    }
  });

  const duplicateKeysCount = duplicateInvoiceRecs.length + duplicatePaymentRecs.length;
  const unmatchedRowsCount = unmatchedPayments.length + orphanCounts.length + missingPayrollCount + missingAttendanceCount;
  const unresolvedIssuesCount = discrepancies.filter((d) => d.status === 'Open' || d.status === 'Under Review').length;

  return {
    timestamp: new Date().toISOString(),
    finance: {
      invoices: reconciledInvoices,
      unmatchedPayments,
      duplicateInvoices: duplicateInvoiceRecs,
      duplicatePayments: duplicatePaymentRecs,
      pendingReceipts,
      totalInvoicedUSD,
      matchedClearedReceiptsUSD,
      grossOutstandingUSD,
      overpaymentsUSD,
      netDifferenceUSD,
    },
    inventory: {
      items: reconciledInventory,
      missingCountSkus,
      conflictingCountSkus,
      orphanCounts,
      totalExpectedValueUSD,
      totalVarianceUnits,
      totalShortageUnits,
      totalSurplusUnits,
      totalVarianceValueUSD,
      shortageValueUSD,
      surplusValueUSD,
    },
    hr: {
      employees: reconciledHR,
      unexplainedGapCount,
      totalUnexplainedDays,
      missingPayrollCount,
      missingAttendanceCount,
      unapprovedPayrollCount,
    },
    discrepancies,
    kpiSummary: {
      filesUploaded: totalFiles,
      sourceRecords: totalSourceRecords,
      duplicateKeys: duplicateKeysCount,
      unmatchedRows: unmatchedRowsCount,
      unresolvedIssues: unresolvedIssuesCount,
      totalInvoicedUSD,
      matchedClearedReceiptsUSD,
      grossOutstandingUSD,
      overpaymentsUSD,
      inventoryShortageUnits: totalShortageUnits,
      hrUnexplainedDayGaps: unexplainedGapCount,
    },
  };
}
