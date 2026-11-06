import { RawUploadedFile } from '../types/reconciliation';

export const SAMPLE_TRAINING_FILES: RawUploadedFile[] = [
  {
    id: 'sample-invoices',
    fileName: '10AI_Invoices_Oct2026.xlsx',
    fileSize: 18450,
    sheets: ['Invoices_Register'],
    selectedSheet: 'Invoices_Register',
    headers: ['InvoiceID', 'InvoiceDate', 'CustomerName', 'InvoiceAmountUSD'],
    detectedTypes: {
      InvoiceID: 'string',
      InvoiceDate: 'date',
      CustomerName: 'string',
      InvoiceAmountUSD: 'number',
    },
    suggestedRole: 'invoices',
    assignedRole: 'invoices',
    mapping: {
      invoiceId: 'InvoiceID',
      invoiceDate: 'InvoiceDate',
      customerName: 'CustomerName',
      invoiceAmountUSD: 'InvoiceAmountUSD',
    },
    status: 'mapped',
    rawRows: [
      { InvoiceID: 'INV-101', InvoiceDate: '2026-10-01', CustomerName: 'Global Logistics Inc', InvoiceAmountUSD: 4500.00 },
      { InvoiceID: 'INV-102', InvoiceDate: '2026-10-03', CustomerName: 'Apex Manufacturing', InvoiceAmountUSD: 3200.00 },
      { InvoiceID: 'INV-103', InvoiceDate: '2026-10-05', CustomerName: 'BlueWave Trading', InvoiceAmountUSD: 1800.00 },
      { InvoiceID: 'INV-104', InvoiceDate: '2026-10-08', CustomerName: 'Zenith Holdings', InvoiceAmountUSD: 1200.00 },
      { InvoiceID: 'INV-105', InvoiceDate: '2026-10-10', CustomerName: 'Horizon Retail Ltd', InvoiceAmountUSD: 5600.00 },
      { InvoiceID: 'INV-106', InvoiceDate: '2026-10-12', CustomerName: 'Crestview Partners', InvoiceAmountUSD: 2150.00 },
      { InvoiceID: 'INV-107', InvoiceDate: '2026-10-15', CustomerName: 'Vanguard Enterprises', InvoiceAmountUSD: 850.00 },
      { InvoiceID: 'INV-108', InvoiceDate: '2026-10-18', CustomerName: 'Sterling Goods', InvoiceAmountUSD: 3750.00 },
      { InvoiceID: 'INV-109', InvoiceDate: '2026-10-20', CustomerName: 'Solaris Tech Ltd', InvoiceAmountUSD: 920.00 },
      { InvoiceID: 'INV-110', InvoiceDate: '2026-10-22', CustomerName: 'Cascade Systems', InvoiceAmountUSD: 2400.00 },
      { InvoiceID: 'INV-111', InvoiceDate: '2026-10-24', CustomerName: 'Orion Distribution', InvoiceAmountUSD: 1650.00 },
      { InvoiceID: 'INV-112', InvoiceDate: '2026-10-26', CustomerName: 'Summit Supplies', InvoiceAmountUSD: 4100.00 },
      { InvoiceID: 'INV-112', InvoiceDate: '2026-10-26', CustomerName: 'Summit Supplies', InvoiceAmountUSD: 4100.00 }, // Duplicate test
      { InvoiceID: 'INV-125', InvoiceDate: '2026-10-28', CustomerName: 'Echo Innovations', InvoiceAmountUSD: 1500.00 },
    ],
  },
  {
    id: 'sample-payments',
    fileName: '10AI_Payments_Oct2026.xlsx',
    fileSize: 19800,
    sheets: ['Bank_Cleared_Payments'],
    selectedSheet: 'Bank_Cleared_Payments',
    headers: ['PaymentID', 'InvoiceRef', 'PaymentDate', 'PaidAmountUSD', 'PaymentStatus'],
    detectedTypes: {
      PaymentID: 'string',
      InvoiceRef: 'string',
      PaymentDate: 'date',
      PaidAmountUSD: 'number',
      PaymentStatus: 'string',
    },
    suggestedRole: 'payments',
    assignedRole: 'payments',
    mapping: {
      paymentId: 'PaymentID',
      invoiceRef: 'InvoiceRef',
      paymentDate: 'PaymentDate',
      paidAmountUSD: 'PaidAmountUSD',
      paymentStatus: 'PaymentStatus',
    },
    status: 'mapped',
    rawRows: [
      { PaymentID: 'PAY-001', InvoiceRef: 'INV-101', PaymentDate: '2026-10-05', PaidAmountUSD: 4500.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-002', InvoiceRef: 'INV-102', PaymentDate: '2026-10-06', PaidAmountUSD: 3200.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-003', InvoiceRef: 'INV-103', PaymentDate: '2026-10-10', PaidAmountUSD: 1800.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-004', InvoiceRef: 'INV-104', PaymentDate: '2026-10-12', PaidAmountUSD: 600.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-005', InvoiceRef: 'INV-104', PaymentDate: '2026-10-15', PaidAmountUSD: 500.00, PaymentStatus: 'Cleared' }, // partial 1100
      { PaymentID: 'PAY-006', InvoiceRef: 'INV-105', PaymentDate: '2026-10-18', PaidAmountUSD: 5600.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-007', InvoiceRef: 'INV-106', PaymentDate: '2026-10-19', PaidAmountUSD: 2200.00, PaymentStatus: 'Cleared' }, // overpaid 50
      { PaymentID: 'PAY-008', InvoiceRef: 'INV-107', PaymentDate: '2026-10-22', PaidAmountUSD: 850.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-009', InvoiceRef: 'INV-108', PaymentDate: '2026-10-25', PaidAmountUSD: 2000.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-010', InvoiceRef: 'INV-110', PaymentDate: '2026-10-27', PaidAmountUSD: 2400.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-011', InvoiceRef: 'INV-111', PaymentDate: '2026-10-28', PaidAmountUSD: 1650.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-011', InvoiceRef: 'INV-111', PaymentDate: '2026-10-28', PaidAmountUSD: 1650.00, PaymentStatus: 'Cleared' }, // Duplicate PAY-011 test
      { PaymentID: 'PAY-012', InvoiceRef: 'INV-112', PaymentDate: '2026-10-29', PaidAmountUSD: 4100.00, PaymentStatus: 'Cleared' },
      { PaymentID: 'PAY-013', InvoiceRef: 'INV-125', PaymentDate: '2026-10-30', PaidAmountUSD: 1500.00, PaymentStatus: 'Pending' }, // Pending receipt
      { PaymentID: 'PAY-999', InvoiceRef: 'INV-999', PaymentDate: '2026-10-31', PaidAmountUSD: 800.00, PaymentStatus: 'Cleared' }, // Unmatched receipt
    ],
  },
  {
    id: 'sample-inventory-system',
    fileName: '10AI_ERP_Inventory_Master.xlsx',
    fileSize: 16200,
    sheets: ['ERP_Stock_Balance'],
    selectedSheet: 'ERP_Stock_Balance',
    headers: ['SKU', 'Warehouse', 'ExpectedQty', 'UnitCostUSD'],
    detectedTypes: {
      SKU: 'string',
      Warehouse: 'string',
      ExpectedQty: 'number',
      UnitCostUSD: 'number',
    },
    suggestedRole: 'inventory_system',
    assignedRole: 'inventory_system',
    mapping: {
      sku: 'SKU',
      warehouse: 'Warehouse',
      expectedQty: 'ExpectedQty',
      unitCostUSD: 'UnitCostUSD',
    },
    status: 'mapped',
    rawRows: [
      { SKU: 'SKU-010', Warehouse: 'Ikeja', ExpectedQty: 120, UnitCostUSD: 45.00 },
      { SKU: 'SKU-012', Warehouse: 'Lekki', ExpectedQty: 80, UnitCostUSD: 65.00 },
      { SKU: 'SKU-015', Warehouse: 'Ikeja', ExpectedQty: 200, UnitCostUSD: 30.00 },
      { SKU: 'SKU-017', Warehouse: 'Ikeja', ExpectedQty: 55, UnitCostUSD: 98.00 }, // test -3 units, -$294.00
      { SKU: 'SKU-020', Warehouse: 'Lekki', ExpectedQty: 150, UnitCostUSD: 40.00 },
      { SKU: 'SKU-022', Warehouse: 'Ikeja', ExpectedQty: 90, UnitCostUSD: 110.00 },
      { SKU: 'SKU-025', Warehouse: 'Lekki', ExpectedQty: 40, UnitCostUSD: 180.00 },
      { SKU: 'SKU-028', Warehouse: 'Ikeja', ExpectedQty: 75, UnitCostUSD: 52.00 },
      { SKU: 'SKU-029', Warehouse: 'Lekki', ExpectedQty: 60, UnitCostUSD: 75.00 }, // missing physical count
      { SKU: 'SKU-031', Warehouse: 'Ikeja', ExpectedQty: 100, UnitCostUSD: 85.00 }, // conflicting counts
    ],
  },
  {
    id: 'sample-inventory-count',
    fileName: '10AI_Physical_Stock_Audit.xlsx',
    fileSize: 15800,
    sheets: ['Warehouse_Physical_Count'],
    selectedSheet: 'Warehouse_Physical_Count',
    headers: ['CountID', 'SKU', 'Warehouse', 'CountedQty', 'CountDate'],
    detectedTypes: {
      CountID: 'string',
      SKU: 'string',
      Warehouse: 'string',
      CountedQty: 'number',
      CountDate: 'date',
    },
    suggestedRole: 'inventory_count',
    assignedRole: 'inventory_count',
    mapping: {
      countId: 'CountID',
      sku: 'SKU',
      warehouse: 'Warehouse',
      countedQty: 'CountedQty',
      countDate: 'CountDate',
    },
    status: 'mapped',
    rawRows: [
      { CountID: 'CNT-001', SKU: 'SKU-010', Warehouse: 'Ikeja', CountedQty: 120, CountDate: '2026-10-30' },
      { CountID: 'CNT-002', SKU: 'SKU-012', Warehouse: 'Lekki', CountedQty: 80, CountDate: '2026-10-30' },
      { CountID: 'CNT-003', SKU: 'SKU-015', Warehouse: 'Ikeja', CountedQty: 205, CountDate: '2026-10-30' }, // +5
      { CountID: 'CNT-004', SKU: 'SKU-017', Warehouse: 'Ikeja', CountedQty: 52, CountDate: '2026-10-30' }, // 52 vs 55
      { CountID: 'CNT-005', SKU: 'SKU-020', Warehouse: 'Lekki', CountedQty: 150, CountDate: '2026-10-30' },
      { CountID: 'CNT-006', SKU: 'SKU-022', Warehouse: 'Ikeja', CountedQty: 88, CountDate: '2026-10-30' }, // -2
      { CountID: 'CNT-007', SKU: 'SKU-025', Warehouse: 'Lekki', CountedQty: 40, CountDate: '2026-10-30' },
      { CountID: 'CNT-008', SKU: 'SKU-028', Warehouse: 'Ikeja', CountedQty: 75, CountDate: '2026-10-30' },
      { CountID: 'CNT-009A', SKU: 'SKU-031', Warehouse: 'Ikeja', CountedQty: 95, CountDate: '2026-10-30' }, // conflicting A
      { CountID: 'CNT-009B', SKU: 'SKU-031', Warehouse: 'Ikeja', CountedQty: 98, CountDate: '2026-10-30' }, // conflicting B
      { CountID: 'CNT-999', SKU: 'SKU-999', Warehouse: 'Lekki', CountedQty: 25, CountDate: '2026-10-30' }, // orphan count
    ],
  },
  {
    id: 'sample-hr-attendance',
    fileName: '10AI_Biometric_Attendance_Oct2026.xlsx',
    fileSize: 17300,
    sheets: ['Oct2026_Attendance'],
    selectedSheet: 'Oct2026_Attendance',
    headers: ['EmployeeID', 'ReportMonth', 'DaysPresent', 'ApprovedLeaveDays', 'ScheduledWorkDays'],
    detectedTypes: {
      EmployeeID: 'string',
      ReportMonth: 'string',
      DaysPresent: 'number',
      ApprovedLeaveDays: 'number',
      ScheduledWorkDays: 'number',
    },
    suggestedRole: 'hr_attendance',
    assignedRole: 'hr_attendance',
    mapping: {
      employeeId: 'EmployeeID',
      reportMonth: 'ReportMonth',
      daysPresent: 'DaysPresent',
      approvedLeaveDays: 'ApprovedLeaveDays',
      scheduledWorkDays: 'ScheduledWorkDays',
    },
    status: 'mapped',
    rawRows: [
      { EmployeeID: 'EMP-010', ReportMonth: '2026-10', DaysPresent: 21, ApprovedLeaveDays: 1, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-012', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-015', ReportMonth: '2026-10', DaysPresent: 20, ApprovedLeaveDays: 2, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-017', ReportMonth: '2026-10', DaysPresent: 19, ApprovedLeaveDays: 3, ScheduledWorkDays: 22 }, // 19+3=22
      { EmployeeID: 'EMP-020', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-022', ReportMonth: '2026-10', DaysPresent: 21, ApprovedLeaveDays: 1, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-023', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 }, // 22 vs 26 paid!
      { EmployeeID: 'EMP-025', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-028', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 },
      { EmployeeID: 'EMP-029', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 }, // missing payroll
      { EmployeeID: 'EMP-030', ReportMonth: '2026-10', DaysPresent: 22, ApprovedLeaveDays: 0, ScheduledWorkDays: 22 }, // draft payroll
    ],
  },
  {
    id: 'sample-hr-payroll',
    fileName: '10AI_Payroll_Register_Oct2026.xlsx',
    fileSize: 18100,
    sheets: ['Payroll_Disbursements'],
    selectedSheet: 'Payroll_Disbursements',
    headers: ['PayrollID', 'EmployeeID', 'PayrollMonth', 'DaysPaid', 'DailyRateUSD', 'GrossPayUSD', 'ApprovalStatus'],
    detectedTypes: {
      PayrollID: 'string',
      EmployeeID: 'string',
      PayrollMonth: 'string',
      DaysPaid: 'number',
      DailyRateUSD: 'number',
      GrossPayUSD: 'number',
      ApprovalStatus: 'string',
    },
    suggestedRole: 'hr_payroll',
    assignedRole: 'hr_payroll',
    mapping: {
      payrollId: 'PayrollID',
      employeeId: 'EmployeeID',
      payrollMonth: 'PayrollMonth',
      daysPaid: 'DaysPaid',
      dailyRateUSD: 'DailyRateUSD',
      grossPayUSD: 'GrossPayUSD',
      approvalStatus: 'ApprovalStatus',
    },
    status: 'mapped',
    rawRows: [
      { PayrollID: 'PAYR-001', EmployeeID: 'EMP-010', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 120.00, GrossPayUSD: 2640.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-002', EmployeeID: 'EMP-012', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 130.00, GrossPayUSD: 2860.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-003', EmployeeID: 'EMP-015', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 110.00, GrossPayUSD: 2420.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-004', EmployeeID: 'EMP-017', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 140.00, GrossPayUSD: 3080.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-005', EmployeeID: 'EMP-020', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 125.00, GrossPayUSD: 2750.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-006', EmployeeID: 'EMP-022', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 115.00, GrossPayUSD: 2530.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-007', EmployeeID: 'EMP-023', PayrollMonth: '2026-10', DaysPaid: 26, DailyRateUSD: 150.00, GrossPayUSD: 3900.00, ApprovalStatus: 'Approved' }, // gap +4
      { PayrollID: 'PAYR-008', EmployeeID: 'EMP-025', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 135.00, GrossPayUSD: 2970.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-009', EmployeeID: 'EMP-028', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 120.00, GrossPayUSD: 2640.00, ApprovalStatus: 'Approved' },
      { PayrollID: 'PAYR-010', EmployeeID: 'EMP-030', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 145.00, GrossPayUSD: 3190.00, ApprovalStatus: 'Draft' }, // unapproved draft
      { PayrollID: 'PAYR-999', EmployeeID: 'EMP-999', PayrollMonth: '2026-10', DaysPaid: 22, DailyRateUSD: 160.00, GrossPayUSD: 3520.00, ApprovalStatus: 'Approved' }, // missing attendance
    ],
  },
];
