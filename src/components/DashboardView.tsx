import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { DiscrepancyItem, ReconciliationResults } from '../types/reconciliation';
import { formatUSD } from '../utils/reconciliationEngine';
import { ActiveTab } from './Sidebar';
import { CalculationModal } from './CalculationModal';

interface DashboardViewProps {
  results: ReconciliationResults;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectDiscrepancy: (item: DiscrepancyItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  results,
  onSelectTab,
  onSelectDiscrepancy,
}) => {
  const [calcModalInfo, setCalcModalInfo] = useState<{
    isOpen: boolean;
    title: string;
    metricName: string;
    formula: string;
    definition: string;
    steps: string[];
    example?: string;
  }>({
    isOpen: false,
    title: '',
    metricName: '',
    formula: '',
    definition: '',
    steps: [],
  });

  const kpis = results.kpiSummary;

  const showCalcModal = (metricKey: string) => {
    switch (metricKey) {
      case 'invoiced':
        setCalcModalInfo({
          isOpen: true,
          title: 'Total Invoiced USD Calculation',
          metricName: 'Total Invoiced (USD)',
          formula: 'SUM(Invoices.InvoiceAmountUSD)',
          definition:
            'Aggregates distinct valid customer invoices in the billing register. Secondary duplicate instances of the same InvoiceID are excluded to prevent artificial revenue inflation.',
          steps: [
            'Filter uploaded Invoices for valid positive currency amounts',
            'Deduplicate by InvoiceID keeping first chronological record',
            'Sum cent-safe integer values and format in en-US USD',
          ],
          example: 'INV-101 through INV-125 summed distinct: $27,770.00 USD',
        });
        break;
      case 'cleared':
        setCalcModalInfo({
          isOpen: true,
          title: 'Matched Cleared Receipts USD Calculation',
          metricName: 'Matched Cleared Receipts (USD)',
          formula: 'SUM(Payments.PaidAmountUSD WHERE PaymentStatus == Cleared AND InvoiceRef IN Invoices)',
          definition:
            'Sums verified cash deposits settled through the bank that match an existing customer invoice. Pending receipts and unallocated deposits are strictly excluded from matched cash.',
          steps: [
            'Filter Payments where PaymentStatus equals "Cleared" (case-insensitive)',
            'Match Payments.InvoiceRef = Invoices.InvoiceID',
            'Deduplicate distinct PaymentIDs to avoid duplicate bank feed double-counting',
            'Sum cleared payments applied against billed ledger',
          ],
          example: 'Matches cleared receipts across active invoices: $25,400.00 USD',
        });
        break;
      case 'outstanding':
        setCalcModalInfo({
          isOpen: true,
          title: 'Gross Outstanding USD Calculation',
          metricName: 'Gross Outstanding Receivables (USD)',
          formula: 'SUM(MAX(InvoiceAmountUSD - ClearedPaidUSD, 0))',
          definition:
            'Total unpaid balance remaining across all partially paid and unpaid invoices. Overpayments do not reduce gross receivables in accordance with US GAAP separation of assets and liabilities.',
          steps: [
            'For each invoice, compute BalanceUSD = InvoiceAmountUSD - ClearedPaidUSD',
            'Take MAX(BalanceUSD, 0) for each invoice',
            'Sum positive unpaid balances',
          ],
          example: 'INV-104 ($100.00) + INV-108 ($1,750.00) + INV-109 ($920.00) = $2,770.00 USD',
        });
        break;
      case 'overpayments':
        setCalcModalInfo({
          isOpen: true,
          title: 'Overpayments USD Calculation',
          metricName: 'Customer Overpayments / Unapplied Credits (USD)',
          formula: 'SUM(MAX(ClearedPaidUSD - InvoiceAmountUSD, 0))',
          definition:
            'Identifies surplus cash paid by clients beyond the invoice principal, recognized as customer deposit liabilities rather than netted revenue.',
          steps: [
            'Calculate BalanceUSD for each invoice',
            'Identify invoices where ClearedPaidUSD > InvoiceAmountUSD',
            'Aggregate excess credit amounts into customer liability register',
          ],
          example: 'INV-106 billed $2,150.00, paid $2,200.00 -> $50.00 USD customer credit',
        });
        break;
      case 'shortage':
        setCalcModalInfo({
          isOpen: true,
          title: 'Inventory Shortage Units Calculation',
          metricName: 'Total Inventory Physical Shortage (Units)',
          formula: 'SUM(ABS(CountedQty - ExpectedQty) WHERE CountedQty < ExpectedQty)',
          definition:
            'Measures physical stock deficits where physical count is strictly less than ERP perpetual inventory on-hand. Missing counts and conflicting recounts are quarantined pending audit approval.',
          steps: [
            'Match ERP item to physical stock count on composite key SKU + Warehouse',
            'Compute VarianceUnits = CountedQty - ExpectedQty',
            'Isolate negative variances (shortages) and exclude uncorroborated recounts',
          ],
          example: 'SKU-017 at Ikeja (-3 units) + SKU-022 at Ikeja (-2 units) = 5 shortage units',
        });
        break;
      case 'hr_gap':
        setCalcModalInfo({
          isOpen: true,
          title: 'HR Unexplained Day Gaps Calculation',
          metricName: 'Unexplained Payroll Day Gaps (Count)',
          formula: 'DaysPaid - (DaysPresent + ApprovedLeaveDays) != 0',
          definition:
            'Identifies discrepancies where disbursed payroll days exceed or fall short of the sum of verified biometric check-ins and formal HR-approved paid leave.',
          steps: [
            'Match EmployeeID and Month between Biometric Attendance and Payroll Register',
            'Compute RawPaidDayGap = DaysPaid - DaysPresent',
            'Adjust for authorized paid leave: UnexplainedGap = DaysPaid - (DaysPresent + ApprovedLeaveDays)',
            'Flag non-zero gaps for HR payroll audit',
          ],
          example: 'EMP-023: 26 days paid - (22 present + 0 leave) = +4 unexplained days',
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Data Quality Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E83DC4]">
              10AI School by 10Alytics
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Reconciliation Run: {new Date(results.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Executive Reconciliation Dashboard
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Real-time deterministic reconciliation across Accounts Receivable, Warehouse Inventory, and
            Biometric Payroll. All figures are formatted in US Dollars (USD) and verified against source records.
          </p>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-lg shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Files Ingested</div>
            <div className="text-base font-bold text-[#111735] font-mono tabular-nums">
              {kpis.filesUploaded} files
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Records</div>
            <div className="text-base font-bold text-[#111735] font-mono tabular-nums">
              {kpis.sourceRecords.toLocaleString()} rows
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Unresolved Issues</div>
            <div className="text-base font-bold text-rose-600 font-mono tabular-nums">
              {kpis.unresolvedIssues}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoiced (USD)
            </span>
            <button
              onClick={() => showCalcModal('invoiced')}
              className="text-slate-400 hover:text-[#405CF5] transition-colors p-0.5"
              title="How calculated?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold text-[#111735] font-mono tabular-nums">
            {formatUSD(kpis.totalInvoicedUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Distinct Billed Ledger</span>
            <span className="font-mono">{results.finance.invoices.length} invoices</span>
          </div>
        </div>

        {/* Matched Cleared Cash */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Matched Cleared Cash
            </span>
            <button
              onClick={() => showCalcModal('cleared')}
              className="text-slate-400 hover:text-[#405CF5] transition-colors p-0.5"
              title="How calculated?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {formatUSD(kpis.matchedClearedReceiptsUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Bank Cleared Settlement</span>
            <span className="font-mono text-emerald-600 font-semibold">
              {(
                (kpis.matchedClearedReceiptsUSD / (kpis.totalInvoicedUSD || 1)) *
                100
              ).toFixed(1)}
              % rate
            </span>
          </div>
        </div>

        {/* Gross Outstanding Receivables */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gross Outstanding (USD)
            </span>
            <button
              onClick={() => showCalcModal('outstanding')}
              className="text-slate-400 hover:text-[#405CF5] transition-colors p-0.5"
              title="How calculated?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {formatUSD(kpis.grossOutstandingUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Uncollected Customer Balances</span>
            <button
              onClick={() => onSelectTab('finance')}
              className="text-[#405CF5] hover:underline flex items-center"
            >
              <span>View list</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Overpayments Credit */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overpayments (USD)
            </span>
            <button
              onClick={() => showCalcModal('overpayments')}
              className="text-slate-400 hover:text-[#405CF5] transition-colors p-0.5"
              title="How calculated?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="text-2xl font-bold text-[#E83DC4] font-mono tabular-nums">
            {formatUSD(kpis.overpaymentsUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Customer Credit Liability</span>
            <span className="font-mono">e.g. INV-106</span>
          </div>
        </div>
      </div>

      {/* Operational Cross-Domain KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Inventory Shortage Units */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>Stock Shortage</span>
              <button onClick={() => showCalcModal('shortage')}>
                <HelpCircle className="w-3 h-3 text-slate-400 hover:text-[#405CF5]" />
              </button>
            </div>
            <div className="text-xl font-bold text-rose-700 font-mono tabular-nums mt-0.5">
              -{kpis.inventoryShortageUnits} units
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Value: {formatUSD(results.inventory.shortageValueUSD)}
            </div>
          </div>
          <button
            onClick={() => onSelectTab('inventory')}
            className="p-2 text-slate-400 hover:text-[#405CF5] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* HR Unexplained Day Gaps */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <span>HR Unexplained Gaps</span>
              <button onClick={() => showCalcModal('hr_gap')}>
                <HelpCircle className="w-3 h-3 text-slate-400 hover:text-[#405CF5]" />
              </button>
            </div>
            <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">
              {kpis.hrUnexplainedDayGaps} employees
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Net gap: {results.hr.totalUnexplainedDays} days
            </div>
          </div>
          <button
            onClick={() => onSelectTab('hr')}
            className="p-2 text-slate-400 hover:text-[#405CF5] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Duplicate Keys */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Duplicate Keys</div>
            <div className="text-xl font-bold text-slate-800 font-mono tabular-nums mt-0.5">
              {kpis.duplicateKeys} detected
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Provisional distinct aggregation</div>
          </div>
          <button
            onClick={() => onSelectTab('discrepancies')}
            className="p-2 text-slate-400 hover:text-[#405CF5] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Unmatched Rows */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Unmatched Records</div>
            <div className="text-xl font-bold text-slate-800 font-mono tabular-nums mt-0.5">
              {kpis.unmatchedRows} rows
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Orphan receipts & uncounted SKUs</div>
          </div>
          <button
            onClick={() => onSelectTab('discrepancies')}
            className="p-2 text-slate-400 hover:text-[#405CF5] hover:bg-slate-50 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Middle Section: Department Status Breakdown & Urgent Action List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Department Visual Overview (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#111735]">
                Reconciliation Breakdown by Domain
              </h3>
              <p className="text-xs text-slate-500">
                Summary status across Finance, Inventory, and HR operations.
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Cent-Safe Deterministic Math
            </span>
          </div>

          {/* Finance Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#405CF5]" />
                Finance · Invoice Settlement Status
              </span>
              <span className="font-mono text-slate-500">
                {results.finance.invoices.length} Invoices
              </span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    (results.finance.invoices.filter((i) => i.status === 'Fully Paid').length /
                      (results.finance.invoices.length || 1)) *
                    100
                  }%`,
                }}
                className="bg-emerald-500 h-full"
                title="Fully Paid"
              />
              <div
                style={{
                  width: `${
                    (results.finance.invoices.filter((i) => i.status === 'Partially Paid').length /
                      (results.finance.invoices.length || 1)) *
                    100
                  }%`,
                }}
                className="bg-amber-400 h-full"
                title="Partially Paid"
              />
              <div
                style={{
                  width: `${
                    (results.finance.invoices.filter((i) => i.status === 'Unpaid').length /
                      (results.finance.invoices.length || 1)) *
                    100
                  }%`,
                }}
                className="bg-rose-400 h-full"
                title="Unpaid"
              />
              <div
                style={{
                  width: `${
                    (results.finance.invoices.filter((i) => i.status === 'Pending Receipt').length /
                      (results.finance.invoices.length || 1)) *
                    100
                  }%`,
                }}
                className="bg-blue-300 h-full"
                title="Pending Receipt"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Fully Paid ({results.finance.invoices.filter((i) => i.status === 'Fully Paid').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Partially Paid ({results.finance.invoices.filter((i) => i.status === 'Partially Paid').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                Unpaid ({results.finance.invoices.filter((i) => i.status === 'Unpaid').length})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
                Pending Receipt ({results.finance.invoices.filter((i) => i.status === 'Pending Receipt').length})
              </span>
            </div>
          </div>

          {/* Inventory Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#E83DC4]" />
                Inventory · Stock Count Completeness
              </span>
              <span className="font-mono text-slate-500">
                {results.inventory.items.length} ERP SKUs
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Matched Clean</div>
                <div className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                  {results.inventory.items.filter((i) => i.countStatus === 'Reconciled').length} SKUs
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Shortage / Surplus</div>
                <div className="text-base font-bold text-amber-700 font-mono tabular-nums">
                  {results.inventory.items.filter((i) => i.countStatus === 'Shortage' || i.countStatus === 'Surplus').length} SKUs
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Missing / Conflicting</div>
                <div className="text-base font-bold text-rose-700 font-mono tabular-nums">
                  {results.inventory.items.filter((i) => i.countStatus === 'Missing Count' || i.countStatus === 'Conflicting Counts').length} SKUs
                </div>
              </div>
            </div>
          </div>

          {/* HR Attendance vs Payroll */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#405CF5]" />
                HR · Attendance vs Paid Days
              </span>
              <span className="font-mono text-slate-500">
                {results.hr.employees.length} Staff Records
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Reconciled & Leave</div>
                <div className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                  {results.hr.employees.filter((e) => e.status === 'Reconciled' || e.status === 'Explained by Leave').length} Staff
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Unexplained Day Gaps</div>
                <div className="text-base font-bold text-rose-700 font-mono tabular-nums">
                  {results.hr.unexplainedGapCount} Staff
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Unapproved Payroll</div>
                <div className="text-base font-bold text-amber-700 font-mono tabular-nums">
                  {results.hr.unapprovedPayrollCount} Staff
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Urgent Action Discrepancy Items (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-[#111735]">Urgent Anomalies</h3>
              </div>
              <button
                onClick={() => onSelectTab('discrepancies')}
                className="text-xs text-[#405CF5] hover:underline font-medium"
              >
                View all ({results.discrepancies.length})
              </button>
            </div>

            <div className="space-y-3">
              {results.discrepancies
                .filter((d) => d.status === 'Open' && d.severity === 'High')
                .slice(0, 4)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectDiscrepancy(item)}
                    className="p-3 border border-slate-200 hover:border-[#405CF5] rounded-lg cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-[#111735] mb-1">
                      <span className="truncate max-w-[160px]">{item.recordId}</span>
                      <span className="text-[10px] uppercase font-bold text-rose-700 font-mono">
                        {item.domain}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{item.title}</p>
                    <div className="mt-2 text-[10px] font-mono text-[#405CF5] flex items-center justify-between">
                      <span>{item.comparedValues.signedDifference || 'Action Required'}</span>
                      <span className="font-sans font-medium hover:underline">Review &rarr;</span>
                    </div>
                  </div>
                ))}

              {results.discrepancies.filter((d) => d.status === 'Open' && d.severity === 'High')
                .length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  No open high-severity anomalies.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onSelectTab('ask_ai')}
              className="w-full py-2 px-3 text-xs font-semibold text-[#111735] bg-gradient-to-r from-blue-50 to-pink-50 hover:from-blue-100 hover:to-pink-100 border border-slate-200 rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>Ask AI About These Anomalies</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#E83DC4]" />
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Calculation Explanations Modal */}
      <CalculationModal
        isOpen={calcModalInfo.isOpen}
        onClose={() => setCalcModalInfo({ ...calcModalInfo, isOpen: false })}
        title={calcModalInfo.title}
        metricName={calcModalInfo.metricName}
        formula={calcModalInfo.formula}
        definition={calcModalInfo.definition}
        steps={calcModalInfo.steps}
        example={calcModalInfo.example}
      />
    </div>
  );
};
