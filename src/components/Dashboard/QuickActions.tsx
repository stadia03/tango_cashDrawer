import { TrendingDown, ArrowDownLeft, Lock, Unlock } from 'lucide-react';
import type { TransactionType } from '../../types';

interface QuickActionsProps {
  isLocked: boolean;
  onOpenAddModal: (type: TransactionType) => void;
  onLockDrawer: () => void;
  onUnlockDrawer: () => void;
}

export function QuickActions({
  isLocked,
  onOpenAddModal,
  onLockDrawer,
  onUnlockDrawer,
}: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Record Expense Button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={() => onOpenAddModal('CASH_OUT')}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Record Expense</span>
          </button>

          {/* Extra Cash In Button */}
          <button
            type="button"
            disabled={isLocked}
            onClick={() => onOpenAddModal('CASH_IN')}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-medium rounded-lg text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-slate-200 transition disabled:opacity-40"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Extra Cash In</span>
          </button>
        </div>

        {/* Lock / Unlock Day Action */}
        <div className="w-full sm:w-auto flex justify-end">
          {isLocked ? (
            <button
              type="button"
              onClick={onUnlockDrawer}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-600" />
              <span>Unlock Day</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLockDrawer}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Close & Lock Day</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
