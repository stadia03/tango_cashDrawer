import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import type { CashDrawerSummary } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatDisplayDate } from '../../utils/dates';
import { DEFAULT_STAFF_NAME } from '../../services/storage.service';

interface LockDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: CashDrawerSummary;
  onConfirmLock: (notes: string) => void;
}

export function LockDayModal({
  isOpen,
  onClose,
  summary,
  onConfirmLock,
}: LockDayModalProps) {
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmLock(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-slate-800 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Close & Lock Day</h3>
            <p className="text-xs text-slate-400 mt-0.5">{formatDisplayDate(summary.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Opening Balance:</span>
              <span className="font-mono text-slate-900 font-semibold">{formatINR(summary.openingBalance)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>POS Cash Received:</span>
              <span className="font-mono text-slate-900 font-semibold">+{formatINR(summary.posCashAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Extra Cash In:</span>
              <span className="font-mono text-slate-900 font-semibold">+{formatINR(summary.extraCashIn)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Expenses / Cash Out:</span>
              <span className="font-mono text-slate-900 font-semibold">-{formatINR(summary.expensesOut)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-800">Final Closing Cash:</span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {formatINR(summary.closingBalance)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Closing Notes (Staff: {DEFAULT_STAFF_NAME})
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Day closed by Sarojit. Shift cash reconciled."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Once locked, manual entries for this day can no longer be edited or deleted without supervisor unlock.
          </p>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Confirm & Lock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
