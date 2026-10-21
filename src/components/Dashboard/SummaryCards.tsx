import { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Edit2,
  Receipt,
  Check,
} from 'lucide-react';
import type { CashDrawerSummary } from '../../types';
import { formatINR } from '../../utils/currency';

interface SummaryCardsProps {
  summary: CashDrawerSummary;
  onUpdateOpeningBalance: (val: number) => void;
  onOpenPosPaymentsModal: () => void;
}

export function SummaryCards({
  summary,
  onUpdateOpeningBalance,
  onOpenPosPaymentsModal,
}: SummaryCardsProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(summary.openingBalance.toString());

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput);
    if (!isNaN(val) && val >= 0) {
      onUpdateOpeningBalance(val);
    }
    setIsEditingBalance(false);
  };

  return (
    <div className="space-y-3">
      {/* 4 Inflow/Outflow Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Opening Balance */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Opening Balance
            </span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>

          {isEditingBalance ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                value={balanceInput}
                onChange={e => setBalanceInput(e.target.value)}
                className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-lg px-2 py-1 focus:outline-hidden focus:border-slate-800"
                autoFocus
              />
              <button
                onClick={handleSaveBalance}
                className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {formatINR(summary.openingBalance)}
              </span>
              {!summary.isLocked && (
                <button
                  onClick={() => {
                    setBalanceInput(summary.openingBalance.toString());
                    setIsEditingBalance(true);
                  }}
                  title="Edit opening balance"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1">Cash in drawer at day start</p>
        </div>

        {/* 2. Today's POS Cash (Port Blair) */}
        <div
          onClick={onOpenPosPaymentsModal}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs cursor-pointer hover:border-slate-400 transition group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Today&apos;s POS Cash
            </span>
            <Receipt className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatINR(summary.posCashAmount)}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {summary.posPaymentCount} bills
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Port Blair • Cash</span>
            <span className="text-slate-600 font-medium group-hover:underline">View List →</span>
          </p>
        </div>

        {/* 3. Extra Cash Received (Manual In) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Extra Cash In
            </span>
            <ArrowDownLeft className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatINR(summary.extraCashIn)}
            </span>
            <span className="text-xs font-medium text-slate-500">Manual Inflow</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Deposits & float top-ups</p>
        </div>

        {/* 4. Cash Out / Expenses */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cash Out / Expenses
            </span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatINR(summary.expensesOut)}
            </span>
            <span className="text-xs font-medium text-slate-500">Payouts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Petty cash & purchases</p>
        </div>
      </div>

      {/* Main Closing Balance Summary Banner */}
      <div className="bg-slate-900 rounded-xl p-4 sm:p-5 text-white shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Closing Cash in Drawer
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
              {formatINR(summary.closingBalance)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2">
              <span>Opening: {formatINR(summary.openingBalance)}</span>
              <span>+</span>
              <span>Total In: {formatINR(summary.totalCashIn)}</span>
              <span>-</span>
              <span>Expenses: {formatINR(summary.expensesOut)}</span>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Net Cash Added Today
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-100 font-mono mt-0.5 flex items-center sm:justify-end gap-1">
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
              <span>{formatINR(summary.totalCashIn - summary.expensesOut)}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Net flow = Total In ({formatINR(summary.totalCashIn)}) - Expenses ({formatINR(summary.expensesOut)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
