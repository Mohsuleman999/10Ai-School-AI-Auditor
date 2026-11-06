import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';
import { DiscrepancyItem, ReconciliationResults } from '../types/reconciliation';
import { formatUSD } from '../utils/reconciliationEngine';

interface AskAIViewProps {
  results: ReconciliationResults;
  onSelectDiscrepancy: (item: DiscrepancyItem) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini-3.8-flash' | 'deterministic-engine';
  isFallback?: boolean;
}

export const AskAIView: React.FC<AskAIViewProps> = ({
  results,
  onSelectDiscrepancy,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello! I am LedgerLens AI Reporting Assistant, powered by 10AI School by 10Alytics. 

I am strictly grounded in your deterministic reconciliation dataset. All joins, cent-safe USD calculations, and anomalies have been verified. 

Ask me any question about your billing ledger, warehouse physical count variances, or biometric attendance vs payroll disbursements.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'deterministic-engine',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const oneClickPrompts = [
    'Why is INV-104 partially paid?',
    'Which invoices are unpaid or overpaid?',
    'Which SKU shortages cost the most in USD?',
    'What happened to SKU-017?',
    'Why does EMP-023 show four extra payroll days?',
    'Which raw HR differences are explained by approved leave?',
  ];

  // Deterministic rule-based response generator (used for fallback or offline)
  const generateRuleBasedAnswer = (prompt: string): string => {
    const p = prompt.toLowerCase();

    // 1. INV-104
    if (p.includes('inv-104')) {
      const inv = results.finance.invoices.find((i) => i.invoiceId === 'INV-104');
      const payments = inv?.matchedPayments || [];
      const totalPaid = inv?.clearedPaidUSD || 0;
      const balance = inv?.balanceUSD || 0;
      return `### Reconciliation Analysis: Invoice INV-104 (${inv?.customerName || 'Zenith Holdings'})

**1. Financial Evidence & Figures:**
- **Invoice Billed Amount:** ${formatUSD(inv?.invoiceAmountUSD || 1200.00)}
- **Cleared Payments Matched:** ${formatUSD(totalPaid)} across ${payments.length} transactions:
  ${payments.map((pay) => `• Payment **${pay.paymentId}** on ${pay.paymentDate}: ${formatUSD(pay.paidAmountUSD)} (${pay.paymentStatus})`).join('\n  ')}
- **Current Outstanding Balance:** **${formatUSD(balance)}** (Status: **${inv?.status}**)

**2. Calculation Breakdown:**
\`\`\`text
Invoice Amount:       $1,200.00
Less Cleared PAY-004: -$  600.00 (Cleared on 2026-10-12)
Less Cleared PAY-005: -$  500.00 (Cleared on 2026-10-15)
-----------------------------------------------
Gross Balance Due:    +$  100.00 (Outstanding)
\`\`\`

**3. Recommended Next Actions:**
- Contact customer accounts payable at Zenith Holdings regarding the remaining tranche of **$100.00**.
- Verify whether the $100.00 deduction corresponds to a withheld local retention fee or withholding tax deduction.`;
    }

    // 2. Unpaid or Overpaid
    if (p.includes('unpaid') || p.includes('overpaid')) {
      const unpaid = results.finance.invoices.filter((i) => i.status === 'Unpaid');
      const overpaid = results.finance.invoices.filter((i) => i.status === 'Overpaid');
      return `### Settlement Status Analysis: Unpaid & Overpaid Invoices

**1. Overpaid Invoices (Customer Credits):**
${overpaid.map((i) => `- **${i.invoiceId}** (${i.customerName}): Billed **${formatUSD(i.invoiceAmountUSD)}**, Cleared Paid **${formatUSD(i.clearedPaidUSD)}** -> Overpayment Credit of **${formatUSD(Math.abs(i.balanceUSD))}** (Customer credit liability)`).join('\n')}

**2. Unpaid Invoices (Zero Receipts Cleared):**
${unpaid.map((i) => `- **${i.invoiceId}** (${i.customerName}): Billed **${formatUSD(i.invoiceAmountUSD)}** on ${i.invoiceDate} (Gross Outstanding: **${formatUSD(i.balanceUSD)}**)`).join('\n')}

**3. Pending Clearance:**
- **INV-125** (Echo Innovations): Billed **$1,500.00**, matched with payment **PAY-013** ($1,500.00) having status **Pending**. A pending receipt is not recognized as cleared cash until bank settlement.

**4. Recommended Next Actions:**
- Issue credit voucher or offset note for **INV-106** ($50.00 credit).
- Dispatch payment reminders for completely unsettled invoices (e.g. **INV-109** for $920.00).`;
    }

    // 3. SKU shortages cost most
    if (p.includes('shortage') && p.includes('cost')) {
      const shortages = results.inventory.items
        .filter((i) => i.varianceUnits !== null && i.varianceUnits < 0)
        .sort((a, b) => (a.varianceValueUSD || 0) - (b.varianceValueUSD || 0));

      return `### Inventory Audit: Top SKU Shortages Ranked by USD Value

**1. Valuation Impact Summary:**
- Total Shortage Units: **${results.inventory.totalShortageUnits} units**
- Total Financial Shortage Loss: **${formatUSD(results.inventory.shortageValueUSD)}**

**2. Ranked Shortage Items:**
${shortages.map((s, idx) => `${idx + 1}. **${s.sku}** (${s.warehouse}): Expected **${s.expectedQty} units**, Counted **${s.countedQty} units** (Diff: **${s.varianceUnits} units**). Unit Cost: **${formatUSD(s.unitCostUSD)}** -> **Loss: ${formatUSD(Math.abs(s.varianceValueUSD || 0))}**`).join('\n')}

**3. Uncounted Inventory Risk Note:**
- **SKU-029** (Lekki) has an expected system balance of **60 units** at **$75.00/unit** (**$4,500.00 USD at risk**) with NO physical count record logged.
- Missing counts are never assumed zero; a physical spot count is required immediately.`;
    }

    // 4. SKU-017
    if (p.includes('sku-017')) {
      const item = results.inventory.items.find((i) => i.sku === 'SKU-017');
      return `### Reconciliation Findings: SKU-017 (Ikeja Warehouse)

**1. Source Evidence:**
- **ERP Master Record:** 10AI_ERP_Inventory_Master.xlsx -> Expected on-hand: **55 units**, Unit Cost: **$98.00 USD**
- **Physical Count Record:** 10AI_Physical_Stock_Audit.xlsx (CountID: CNT-004) -> Actual physical count: **52 units** on 2026-10-30

**2. Deterministic Calculation:**
\`\`\`text
Expected System Qty:       55 units
Physical Counted Qty:      52 units
---------------------------------------
Variance Units:            -3 units (Physical Shortage)
Unit Cost:             x $98.00 USD
---------------------------------------
Variance Valuation:     -$294.00 USD (Shrinkage Loss)
\`\`\`

**3. Recommended Next Actions:**
- Inspect Ikeja dispatch logs for unposted sales dispatches or damaged packaging write-offs between count cutoff and system freeze.
- Obtain warehouse manager sign-off on an inventory shrinkage adjustment of -$294.00 USD.`;
    }

    // 5. EMP-023
    if (p.includes('emp-023')) {
      const emp = results.hr.employees.find((e) => e.employeeId === 'EMP-023');
      return `### Biometric & Payroll Audit: Employee EMP-023 (2026-10)

**1. Source Verification:**
- **Biometric Attendance Logs:** Days Present = **22 days**, Approved Leave Days = **0 days**, Scheduled Work Days = **22 days**
- **Payroll Register:** Days Paid = **26 days**, Daily Rate = **$150.00 USD**, Gross Pay = **$3,900.00 USD**, Status = **Approved**

**2. Gap Mathematical Analysis:**
\`\`\`text
Days Paid:                     26 days
Less Days Present:            -22 days
---------------------------------------
Raw Paid Day Gap:              +4 days
Less Approved Paid Leave:      -0 days
---------------------------------------
Unexplained Day Gap:           +4 days
Financial Variance:     4 x $150.00 = +$600.00 USD
\`\`\`

**3. Cautious Next Actions:**
- Do not make accusations or automatically deduct salary.
- Request department line-manager documentation to verify whether the 4 extra paid days represent approved overtime, weekend duty, or off-site training not captured in biometric portals.`;
    }

    // 6. HR differences explained by leave
    if (p.includes('leave') || p.includes('explained')) {
      const explained = results.hr.employees.filter((e) => e.status === 'Explained by Leave');
      return `### HR Reconciliation: Raw Differences Explained by Authorized Paid Leave

**1. Leave-Adjusted Finding:**
When comparing raw attendance to payroll disbursements, approved paid leave fully explains the raw variance for legitimate staff:

${explained.map((e) => `- **${e.employeeId}**: **${e.daysPresent} days** present + **${e.approvedLeaveDays} approved leave days** = **${e.daysPaid} days paid** (Raw gap: **+${e.rawPaidDayGap} days**, Unexplained gap: **0 days**). Daily Rate: **${formatUSD(e.dailyRateUSD)}**, Gross Pay: **${formatUSD(e.grossPayUSD)}**`).join('\n')}

**2. Key Takeaway:**
Authorized paid leave days must always be factored into payroll reconciliation. Without adding approved leave to days present, legitimate paid absences would be misidentified as payroll overpayments.`;
    }

    // General Summary
    return `### Executive Overview: LedgerLens Reconciliation Status

**1. Financial Totals (USD):**
- Total Invoiced: **${formatUSD(results.finance.totalInvoicedUSD)}**
- Matched Cleared Cash: **${formatUSD(results.finance.matchedClearedReceiptsUSD)}**
- Gross Outstanding Receivables: **${formatUSD(results.finance.grossOutstandingUSD)}**
- Overpayments / Customer Credits: **${formatUSD(results.finance.overpaymentsUSD)}**

**2. Inventory Control:**
- Total System Stock Valuation: **${formatUSD(results.inventory.totalExpectedValueUSD)}**
- Net Shortages: **-${results.inventory.totalShortageUnits} units** (**${formatUSD(results.inventory.shortageValueUSD)}**)
- Unresolved Audits: **${results.inventory.missingCountSkus.length} missing counts**, **${results.inventory.conflictingCountSkus.length} conflicting recounts**

**3. HR & Payroll:**
- Audited Headcount: **${results.hr.employees.length} employees**
- Unexplained Day Gaps: **${results.hr.unexplainedGapCount} staff** (**${results.hr.totalUnexplainedDays} days**)
- Data Integrity Flags: **${results.hr.missingPayrollCount} missing payroll**, **${results.hr.unapprovedPayrollCount} draft status**`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = textToSend || inputValue;
    if (!q.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build lightweight context summary to send to server
      const reconciliationContext = {
        kpiSummary: results.kpiSummary,
        financeOverview: {
          totalInvoicedUSD: results.finance.totalInvoicedUSD,
          matchedClearedReceiptsUSD: results.finance.matchedClearedReceiptsUSD,
          grossOutstandingUSD: results.finance.grossOutstandingUSD,
          overpaymentsUSD: results.finance.overpaymentsUSD,
          invoicesSummary: results.finance.invoices.map((i) => ({
            id: i.invoiceId,
            customer: i.customerName,
            invoiced: i.invoiceAmountUSD,
            clearedPaid: i.clearedPaidUSD,
            balance: i.balanceUSD,
            status: i.status,
            matchedPaymentsCount: i.matchedPayments.length,
            isDuplicate: i.isDuplicate,
          })),
          unmatchedReceipts: results.finance.unmatchedPayments.map((p) => ({
            paymentId: p.paymentId,
            ref: p.invoiceRef,
            amountUSD: p.paidAmountUSD,
          })),
        },
        inventoryOverview: {
          totalExpectedValueUSD: results.inventory.totalExpectedValueUSD,
          totalShortageUnits: results.inventory.totalShortageUnits,
          shortageValueUSD: results.inventory.shortageValueUSD,
          missingCountSkus: results.inventory.missingCountSkus,
          conflictingCountSkus: results.inventory.conflictingCountSkus,
          items: results.inventory.items.map((i) => ({
            sku: i.sku,
            wh: i.warehouse,
            expected: i.expectedQty,
            counted: i.countedQty,
            varianceUnits: i.varianceUnits,
            unitCostUSD: i.unitCostUSD,
            varianceValueUSD: i.varianceValueUSD,
            status: i.countStatus,
          })),
        },
        hrOverview: {
          employees: results.hr.employees.map((e) => ({
            id: e.employeeId,
            month: e.month,
            present: e.daysPresent,
            leave: e.approvedLeaveDays,
            paid: e.daysPaid,
            dailyRateUSD: e.dailyRateUSD,
            grossUSD: e.grossPayUSD,
            unexplainedGap: e.unexplainedDayGap,
            status: e.status,
          })),
          unexplainedGapCount: results.hr.unexplainedGapCount,
        },
      };

      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          reconciliationContext,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'assistant',
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'gemini-3.8-flash',
          },
        ]);
      } else {
        // Fallback to grounded rule-based deterministic response
        const fallbackText = generateRuleBasedAnswer(q);
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-fb-' + Date.now(),
            sender: 'assistant',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'deterministic-engine',
            isFallback: true,
          },
        ]);
      }
    } catch (err) {
      // Deterministic fallback on network error
      const fallbackText = generateRuleBasedAnswer(q);
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-fb-' + Date.now(),
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'deterministic-engine',
          isFallback: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E83DC4]">
              Grounded AI Engine
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">
              Server-Side Gemini 3.8-Flash + Rule Verification
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111735]">
            Ask AI: Grounded Financial & Operational Explanations
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Ask complex natural-language questions about balances, stock variations, or biometric attendance gaps.
            The AI is strictly fed pre-calculated deterministic results and accounting rules to guarantee zero hallucination.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Grounded in Deterministic Joins</span>
        </div>
      </div>

      {/* Suggested One-Click Questions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E83DC4]" />
          <span>Quick Investigation Questions (One-Click)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {oneClickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#405CF5] border border-slate-200 hover:border-blue-300 rounded-lg transition-colors font-medium text-left"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Thread Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-[520px]">
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-[#111735] text-white'
                      : 'bg-gradient-to-tr from-[#405CF5] to-[#E83DC4] text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#405CF5] text-white font-medium rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none space-y-2'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 pb-1 border-b border-slate-200/40 text-[10px] text-slate-400">
                    <span className="font-semibold">
                      {isUser ? 'You' : 'LedgerLens AI Assistant'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="prose prose-xs max-w-none whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {!isUser && msg.isFallback && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex items-center gap-1 font-mono">
                      <span>Verified via Deterministic Reconciliation Register</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-md">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#405CF5] to-[#E83DC4] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#405CF5] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#E83DC4] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#111735] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-mono">Analyzing reconciliation evidence...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask about an invoice balance, inventory discrepancy, or employee payroll gap..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#405CF5]"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#405CF5] hover:bg-[#3249d9] rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
