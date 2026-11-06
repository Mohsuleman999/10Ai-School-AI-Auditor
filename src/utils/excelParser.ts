import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { FileRole, RawUploadedFile } from '../types/reconciliation';

export interface ParseResult {
  file: RawUploadedFile;
  error?: string;
}

export function detectFieldType(values: any[]): 'string' | 'number' | 'date' {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonNulls.length === 0) return 'string';

  let numCount = 0;
  let dateCount = 0;

  for (const v of nonNulls.slice(0, 30)) {
    if (typeof v === 'number') {
      numCount++;
      continue;
    }
    const cleanStr = String(v).trim();
    // Currency removal e.g. "$1,200.50"
    const parsedNum = Number(cleanStr.replace(/[$,]/g, ''));
    if (!isNaN(parsedNum) && cleanStr !== '') {
      numCount++;
      continue;
    }
    if (!isNaN(Date.parse(cleanStr)) && /[-/]\d/.test(cleanStr)) {
      dateCount++;
    }
  }

  if (numCount > nonNulls.length * 0.7) return 'number';
  if (dateCount > nonNulls.length * 0.7) return 'date';
  return 'string';
}

export function suggestFileRole(headers: string[]): {
  role: FileRole;
  mapping: Record<string, string>;
} {
  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const findHeader = (candidates: string[]): string | undefined => {
    for (let i = 0; i < lowerHeaders.length; i++) {
      for (const cand of candidates) {
        if (lowerHeaders[i].includes(cand)) {
          return headers[i];
        }
      }
    }
    return undefined;
  };

  // 1. Invoices
  if (findHeader(['invoiceid', 'invoicenum']) || (findHeader(['invoiceamount', 'invamt']) && findHeader(['customer']))) {
    const invoiceId = findHeader(['invoiceid', 'invoicenum', 'invoiceno']) || headers[0];
    const invoiceDate = findHeader(['invoicedate', 'invdate', 'date']) || '';
    const customerName = findHeader(['customername', 'customer', 'client']) || '';
    const invoiceAmountUSD = findHeader(['invoiceamountusd', 'invoiceamount', 'amountusd', 'amount', 'total']) || '';
    return {
      role: 'invoices',
      mapping: { invoiceId, invoiceDate, customerName, invoiceAmountUSD },
    };
  }

  // 2. Payments
  if (findHeader(['paymentid', 'payid']) || (findHeader(['invoiceref', 'invref']) && findHeader(['paidamount', 'paymentstatus']))) {
    const paymentId = findHeader(['paymentid', 'payid', 'paymentno']) || headers[0];
    const invoiceRef = findHeader(['invoiceref', 'invref', 'invoiceid', 'reference']) || '';
    const paymentDate = findHeader(['paymentdate', 'paydate', 'date']) || '';
    const paidAmountUSD = findHeader(['paidamountusd', 'paidamount', 'amountpaid', 'amount', 'paid']) || '';
    const paymentStatus = findHeader(['paymentstatus', 'status']) || '';
    return {
      role: 'payments',
      mapping: { paymentId, invoiceRef, paymentDate, paidAmountUSD, paymentStatus },
    };
  }

  // 3. Inventory System (ERP)
  if (findHeader(['expectedqty', 'systemqty', 'onhand', 'expected']) && findHeader(['sku'])) {
    const sku = findHeader(['sku', 'itemcode', 'productid']) || '';
    const warehouse = findHeader(['warehouse', 'location', 'site']) || '';
    const expectedQty = findHeader(['expectedqty', 'systemqty', 'expected', 'qty']) || '';
    const unitCostUSD = findHeader(['unitcostusd', 'unitcost', 'costusd', 'cost']) || '';
    return {
      role: 'inventory_system',
      mapping: { sku, warehouse, expectedQty, unitCostUSD },
    };
  }

  // 4. Inventory Physical Count
  if (findHeader(['countedqty', 'physicalqty', 'countid', 'counted']) && (findHeader(['sku']) || findHeader(['warehouse']))) {
    const countId = findHeader(['countid', 'auditid', 'id']) || '';
    const sku = findHeader(['sku', 'itemcode', 'productid']) || '';
    const warehouse = findHeader(['warehouse', 'location', 'site']) || '';
    const countedQty = findHeader(['countedqty', 'physicalqty', 'counted', 'actualqty']) || '';
    const countDate = findHeader(['countdate', 'date', 'auditdate']) || '';
    return {
      role: 'inventory_count',
      mapping: { countId, sku, warehouse, countedQty, countDate },
    };
  }

  // 5. HR Attendance
  if (findHeader(['dayspresent', 'presentdays']) || (findHeader(['employeeid', 'empid']) && findHeader(['scheduledworkdays', 'reportmonth']))) {
    const employeeId = findHeader(['employeeid', 'empid', 'staffid', 'id']) || '';
    const reportMonth = findHeader(['reportmonth', 'month', 'period']) || '';
    const daysPresent = findHeader(['dayspresent', 'present', 'workeddays']) || '';
    const approvedLeaveDays = findHeader(['approvedleavedays', 'leavedays', 'leave', 'approvedleave']) || '';
    const scheduledWorkDays = findHeader(['scheduledworkdays', 'workdays', 'scheduleddays']) || '';
    return {
      role: 'hr_attendance',
      mapping: { employeeId, reportMonth, daysPresent, approvedLeaveDays, scheduledWorkDays },
    };
  }

  // 6. HR Payroll
  if (findHeader(['payrollid', 'grosspayusd', 'dailyrateusd']) || (findHeader(['employeeid', 'empid']) && findHeader(['dayspaid', 'gross']))) {
    const payrollId = findHeader(['payrollid', 'payid', 'id']) || '';
    const employeeId = findHeader(['employeeid', 'empid', 'staffid']) || '';
    const payrollMonth = findHeader(['payrollmonth', 'month', 'period']) || '';
    const daysPaid = findHeader(['dayspaid', 'paidday', 'days']) || '';
    const dailyRateUSD = findHeader(['dailyrateusd', 'dailyrate', 'rateusd', 'rate']) || '';
    const grossPayUSD = findHeader(['grosspayusd', 'grosspay', 'grossusd', 'gross']) || '';
    const approvalStatus = findHeader(['approvalstatus', 'status']) || '';
    return {
      role: 'hr_payroll',
      mapping: { payrollId, employeeId, payrollMonth, daysPaid, dailyRateUSD, grossPayUSD, approvalStatus },
    };
  }

  return { role: 'unassigned', mapping: {} };
}

export async function parseUploadedFile(file: File): Promise<ParseResult> {
  const fileName = file.name;
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  try {
    if (isCsv) {
      return new Promise((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            const rawRows = results.data as Record<string, any>[];
            const headers = results.meta.fields || [];
            const detectedTypes: Record<string, 'string' | 'number' | 'date'> = {};

            headers.forEach((h) => {
              detectedTypes[h] = detectFieldType(rawRows.map((r) => r[h]));
            });

            const { role, mapping } = suggestFileRole(headers);

            const uploadedFile: RawUploadedFile = {
              id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
              fileName,
              fileSize: file.size,
              sheets: ['Sheet1'],
              selectedSheet: 'Sheet1',
              headers,
              detectedTypes,
              rawRows,
              suggestedRole: role,
              assignedRole: role,
              mapping,
              status: role !== 'unassigned' ? 'mapped' : 'parsed',
            };

            resolve({ file: uploadedFile });
          },
          error: (err) => {
            resolve({
              file: createErrorFile(fileName, file.size, err.message),
              error: err.message,
            });
          },
        });
      });
    } else {
      // Excel file .xlsx or .xls
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheetNames = workbook.SheetNames;

      if (sheetNames.length === 0) {
        return {
          file: createErrorFile(fileName, file.size, 'No sheets found in Excel file'),
          error: 'No sheets found',
        };
      }

      const selectedSheet = sheetNames[0];
      const worksheet = workbook.Sheets[selectedSheet];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      // Extract headers from first row
      const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
      const detectedTypes: Record<string, 'string' | 'number' | 'date'> = {};

      headers.forEach((h) => {
        detectedTypes[h] = detectFieldType(rawRows.map((r) => r[h]));
      });

      const { role, mapping } = suggestFileRole(headers);

      const uploadedFile: RawUploadedFile = {
        id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        fileName,
        fileSize: file.size,
        sheets: sheetNames,
        selectedSheet,
        headers,
        detectedTypes,
        rawRows,
        suggestedRole: role,
        assignedRole: role,
        mapping,
        status: role !== 'unassigned' ? 'mapped' : 'parsed',
      };

      return { file: uploadedFile };
    }
  } catch (err: any) {
    return {
      file: createErrorFile(fileName, file.size, err.message || 'Parsing error'),
      error: err.message || 'Parsing error',
    };
  }
}

export function parseExcelSheet(
  buffer: ArrayBuffer,
  sheetName: string
): { headers: string[]; rawRows: Record<string, any>[]; detectedTypes: Record<string, 'string' | 'number' | 'date'> } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
  const detectedTypes: Record<string, 'string' | 'number' | 'date'> = {};
  headers.forEach((h) => {
    detectedTypes[h] = detectFieldType(rawRows.map((r) => r[h]));
  });
  return { headers, rawRows, detectedTypes };
}

function createErrorFile(fileName: string, fileSize: number, errorMessage: string): RawUploadedFile {
  return {
    id: 'file-err-' + Date.now(),
    fileName,
    fileSize,
    sheets: [],
    selectedSheet: '',
    headers: [],
    detectedTypes: {},
    rawRows: [],
    suggestedRole: 'unassigned',
    assignedRole: 'unassigned',
    mapping: {},
    status: 'error',
    errorMessage,
  };
}
