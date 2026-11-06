import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DiscrepancyItem, ReconciliationResults } from '../types/reconciliation';
import { formatUSD } from '../utils/reconciliationEngine';

interface FinanceViewProps {
  results: ReconciliationResults;
  onSelectDiscrepancy: (item: DiscrepancyItem) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  results,
  onSelectDiscrepancy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const {
    invoices,
    unmatchedPayments,
    duplicateInvoices,
    duplicatePayments,
    pendingReceipts,
    totalInvoicedUSD,
    matchedClearedReceiptsUSD,
    grossOutstandingUSD,
    overpaymentsUSD,
    netDifferenceUSD,
  } = results.finance;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#405CF5]">
              Finance Ledger & Bank Matching
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Invoices.InvoiceID = Payments.InvoiceRef
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Accounts Receivable & Cash Settlement Analysis
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Deterministic matching of billing registers against bank-cleared receipts. Distinct PaymentID
            aggregation applied to prevent double counting. Pending receipts held in escrow.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Net Difference</span>
            <span className="font-bold text-[#111735]">{formatUSD(netDifferenceUSD)}</span>
          </div>
        </div>
      </div>

      {/* KPI 4-Card Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Billed USD</div>
          <div className="text-xl font-bold text-[#111735] font-mono tabular-nums mt-1">
            {formatUSD(totalInvoicedUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{invoices.length} Distinct Invoices</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Cleared Cash Receipts</div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {formatUSD(matchedClearedReceiptsUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Settled in Bank Ledger</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Gross Outstanding AR</div>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {formatUSD(grossOutstandingUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Unpaid & Partial Balances</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Customer Overpayments</div>
          <div className="text-xl font-bold text-[#E83DC4] font-mono tabular-nums mt-1">
            {formatUSD(overpaymentsUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Credit Balances / Escrow</div>
        </div>
      </div>

      {/* Flagged Bank Anomalies Strip (Duplicates & Unmatched) */}
      {(duplicateInvoices.length > 0 ||
        duplicatePayments.length > 0 ||
        unmatchedPayments.length > 0 ||
        pendingReceipts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Duplicate Keys Warning */}
          {(duplicateInvoices.length > 0 || duplicatePayments.length > 0) && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Duplicate Keys Prevented From Inflating Totals</span>
              </div>
              <p className="text-amber-800 text-[11px] mb-2 leading-relaxed">
                Distinct-ID aggregation applied. Duplicate occurrences:{' '}
                {duplicateInvoices.map((i) => i.invoiceId).join(', ') || 'None'}{' '}
                {duplicatePayments.length > 0 &&
                  `| Payment IDs: ${duplicatePayments.map((p) => p.paymentId).join(', ')}`}
              </p>
            </div>
          )}

          {/* Unmatched Cleared Receipts */}
          {unmatchedPayments.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Unmatched Receipts ({unmatchedPayments.length})</span>
              </div>
              <p className="text-rose-800 text-[11px] mb-2 leading-relaxed">
                Cash received with no matching customer invoice. Kept in unapplied cash suspense:
              </p>
              <div className="font-mono text-[11px] text-rose-900 font-medium">
                {unmatchedPayments.map((p) => `${p.paymentId}: ${formatUSD(p.paidAmountUSD)} (Ref: ${p.invoiceRef})`).join(', ')}
              </div>
            </div>
          )}

          {/* Pending Receipts */}
          {pendingReceipts.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Pending Receipts ({pendingReceipts.length})</span>
              </div>
              <p className="text-blue-800 text-[11px] mb-2 leading-relaxed">
                Status is Pending. Excluded from cleared cash until bank settlement:
              </p>
              <div className="font-mono text-[11px] text-blue-900 font-medium">
                {pendingReceipts.map((p) => `${p.paymentId} -> ${p.invoiceRef} (${formatUSD(p.paidAmountUSD)})`).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#405CF5]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
              Invoice Settlement Register ({invoices.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice or customer..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#405CF5]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#405CF5]"
            >
              <option value="All">All Statuses</option>
              <option value="Fully Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overpaid">Overpaid</option>
              <option value="Pending Receipt">Pending Receipt</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Invoice ID</th>
                <th className="py-2.5 px-4">Customer Name</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4 text-right">Invoiced (USD)</th>
                <th className="py-2.5 px-4 text-right">Cleared Paid (USD)</th>
                <th className="py-2.5 px-4 text-right">Balance (USD)</th>
                <th className="py-2.5 px-4">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredInvoices.map((inv) => {
                const isExpanded = expandedInvoiceId === inv.invoiceId;
                return (
                  <React.Fragment key={inv.invoiceId}>
                    <tr
                      onClick={() =>
                        setExpandedInvoiceId(isExpanded ? null : inv.invoiceId)
                      }
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400">
                        {inv.matchedPayments.length > 0 ? (
                          isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )
                        ) : null}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#111735]">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.invoiceId}</span>
                          {inv.isDuplicate && (
                            <span className="text-[9px] font-sans bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              DUP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-800">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans text-[11px]">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums">
                        {formatUSD(inv.invoiceAmountUSD)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-700 tabular-nums">
                        {formatUSD(inv.clearedPaidUSD)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold tabular-nums ${
                          inv.balanceUSD > 0
                            ? 'text-amber-700'
                            : inv.balanceUSD < 0
                            ? 'text-[#E83DC4]'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatUSD(inv.balanceUSD)}
                      </td>
                      <td className="py-3 px-4 font-sans whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            inv.status === 'Fully Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800'
                              : inv.status === 'Overpaid'
                              ? 'bg-pink-100 text-pink-800'
                              : inv.status === 'Pending Receipt'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>

                    {/* Matched Payments Sub-row */}
                    {isExpanded && inv.matchedPayments.length > 0 && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={8} className="p-3 pl-12 font-sans">
                          <div className="text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                            Matched Payment Transactions ({inv.matchedPayments.length})
                          </div>
                          <div className="space-y-1">
                            {inv.matchedPayments.map((p) => (
                              <div
                                key={p.paymentId}
                                className="flex items-center justify-between text-xs font-mono bg-white p-2 rounded border border-slate-200"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-[#405CF5]">{p.paymentId}</span>
                                  <span className="text-slate-500 font-sans text-[11px]">
                                    Date: {p.paymentDate}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                                      p.paymentStatus.toLowerCase() === 'cleared'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {p.paymentStatus}
                                  </span>
                                </div>
                                <span className="font-bold text-slate-800">
                                  {formatUSD(p.paidAmountUSD)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
