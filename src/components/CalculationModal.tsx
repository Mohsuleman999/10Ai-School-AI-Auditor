import React from 'react';
import { X, HelpCircle, ArrowRight } from 'lucide-react';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  metricName: string;
  formula: string;
  definition: string;
  steps: string[];
  example?: string;
}

export const CalculationModal: React.FC<CalculationModalProps> = ({
  isOpen,
  onClose,
  title,
  metricName,
  formula,
  definition,
  steps,
  example,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#405CF5]" />
            <h3 className="text-base font-semibold text-[#111735]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Metric Name
            </div>
            <div className="text-sm font-bold text-[#111735]">{metricName}</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Deterministic Mathematical Formula
            </div>
            <div className="bg-slate-900 text-slate-100 font-mono text-xs p-3 rounded-lg border border-slate-800">
              {formula}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Business Definition & Accounting Rule
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{definition}</p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Step-by-Step Calculation Flow
            </div>
            <div className="space-y-1.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <ArrowRight className="w-3.5 h-3.5 text-[#405CF5] shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {example && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-900 mb-1">Verified Training Example</div>
              <p className="text-xs text-blue-800 leading-relaxed font-mono">{example}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
