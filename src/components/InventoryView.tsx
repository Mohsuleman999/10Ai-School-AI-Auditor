import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Search,
  Filter,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DiscrepancyItem, ReconciliationResults } from '../types/reconciliation';
import { formatUSD } from '../utils/reconciliationEngine';

interface InventoryViewProps {
  results: ReconciliationResults;
  onSelectDiscrepancy: (item: DiscrepancyItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  results,
  onSelectDiscrepancy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const {
    items,
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
  } = results.inventory;

  const warehouses = Array.from(new Set(items.map((i) => i.warehouse))).filter(Boolean);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWh = warehouseFilter === 'All' || item.warehouse === warehouseFilter;
    const matchesStatus = statusFilter === 'All' || item.countStatus === statusFilter;
    return matchesSearch && matchesWh && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E83DC4]">
              Inventory Control & Stock Audit
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Composite Key: SKU + Warehouse
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Perpetual Inventory vs Physical Count Reconciliation
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Variance = CountedQty - ExpectedQty; Valuation = Variance * UnitCostUSD. Conflicting repeated counts
            are never added together and are quarantined until supervisor confirmation. Missing counts are never assumed zero.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
            <span className="text-slate-400 block text-[10px] uppercase">Net Variance Value</span>
            <span
              className={`font-bold ${
                totalVarianceValueUSD < 0
                  ? 'text-rose-600'
                  : totalVarianceValueUSD > 0
                  ? 'text-emerald-600'
                  : 'text-slate-700'
              }`}
            >
              {formatUSD(totalVarianceValueUSD)}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total System Valuation</div>
          <div className="text-xl font-bold text-[#111735] font-mono tabular-nums mt-1">
            {formatUSD(totalExpectedValueUSD)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{items.length} ERP Catalog SKUs</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Stock Shortage Loss</div>
          <div className="text-xl font-bold text-rose-700 font-mono tabular-nums mt-1">
            -{totalShortageUnits} units ({formatUSD(shortageValueUSD)})
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Shrinkage / Missing Units</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Stock Surplus Gain</div>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            +{totalSurplusUnits} units ({formatUSD(surplusValueUSD)})
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Unrecorded Stock Gain</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase text-slate-400">Unresolved Audit SKUs</div>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {missingCountSkus.length + conflictingCountSkus.length} SKUs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {missingCountSkus.length} missing, {conflictingCountSkus.length} conflicting
          </div>
        </div>
      </div>

      {/* Quarantined Audit Registers */}
      {(missingCountSkus.length > 0 || conflictingCountSkus.length > 0 || orphanCounts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {missingCountSkus.length > 0 && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Missing Count Register ({missingCountSkus.length})</span>
              </div>
              <p className="text-rose-800 text-[11px] mb-2 leading-relaxed">
                ERP SKUs with NO physical count record (never assume 0):
              </p>
              <div className="font-mono text-[11px] font-bold text-rose-900">
                {missingCountSkus.join(', ')}
              </div>
            </div>
          )}

          {conflictingCountSkus.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Conflicting Recounts ({conflictingCountSkus.length})</span>
              </div>
              <p className="text-amber-800 text-[11px] mb-2 leading-relaxed">
                Multiple independent audit counts found. Excluded from totals until verified:
              </p>
              <div className="font-mono text-[11px] font-bold text-amber-900">
                {conflictingCountSkus.join(', ')}
              </div>
            </div>
          )}

          {orphanCounts.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Orphan Physical Counts ({orphanCounts.length})</span>
              </div>
              <p className="text-blue-800 text-[11px] mb-2 leading-relaxed">
                Counted in warehouse but missing from ERP catalog:
              </p>
              <div className="font-mono text-[11px] font-bold text-blue-900">
                {orphanCounts.map((o) => `${o.countId}: ${o.sku} (${o.warehouse})`).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Inventory Variance Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#E83DC4]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111735]">
              Stock Audit Register ({items.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search SKU..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#405CF5]"
              />
            </div>

            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#405CF5]"
            >
              <option value="All">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-[#405CF5]"
            >
              <option value="All">All Statuses</option>
              <option value="Reconciled">Reconciled</option>
              <option value="Shortage">Shortage</option>
              <option value="Surplus">Surplus</option>
              <option value="Missing Count">Missing Count</option>
              <option value="Conflicting Counts">Conflicting Counts</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">SKU Code</th>
                <th className="py-2.5 px-4">Warehouse</th>
                <th className="py-2.5 px-4 text-right">Expected Qty</th>
                <th className="py-2.5 px-4 text-right">Counted Qty</th>
                <th className="py-2.5 px-4 text-right">Variance Units</th>
                <th className="py-2.5 px-4 text-right">Unit Cost (USD)</th>
                <th className="py-2.5 px-4 text-right">Variance USD</th>
                <th className="py-2.5 px-4">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredItems.map((item) => {
                const isShortage = item.varianceUnits !== null && item.varianceUnits < 0;
                const isSurplus = item.varianceUnits !== null && item.varianceUnits > 0;
                return (
                  <tr key={`${item.sku}-${item.warehouse}`} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#111735]">{item.sku}</td>
                    <td className="py-3 px-4 font-sans text-slate-700">{item.warehouse}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-800">
                      {item.expectedQty} units
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {item.countedQty !== null ? (
                        <span className="font-semibold text-slate-900">{item.countedQty} units</span>
                      ) : (
                        <span className="text-rose-600 font-sans text-[11px] font-semibold">
                          MISSING
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold tabular-nums ${
                        isShortage
                          ? 'text-rose-600'
                          : isSurplus
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.varianceUnits !== null ? (
                        `${item.varianceUnits > 0 ? '+' : ''}${item.varianceUnits} units`
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 tabular-nums">
                      {formatUSD(item.unitCostUSD)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold tabular-nums ${
                        isShortage
                          ? 'text-rose-600'
                          : isSurplus
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.varianceValueUSD !== null ? formatUSD(item.varianceValueUSD) : '—'}
                    </td>
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          item.countStatus === 'Reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.countStatus === 'Shortage'
                            ? 'bg-rose-100 text-rose-800'
                            : item.countStatus === 'Surplus'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.countStatus}
                        {item.approvedCountId && ' (Approved)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
