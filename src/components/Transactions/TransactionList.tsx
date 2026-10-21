import { useState, useMemo } from 'react';
import {
  TrendingDown,
  ArrowDownLeft,
  Search,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import type { DrawerTransaction, TransactionType } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatTime } from '../../utils/dates';

interface TransactionListProps {
  transactions: DrawerTransaction[];
  isLocked: boolean;
  isTodayDate: boolean;
  onEdit: (txn: DrawerTransaction) => void;
  onDelete: (id: string) => void;
  onOpenAddModal: (type: TransactionType) => void;
}

export function TransactionList({
  transactions,
  isLocked,
  isTodayDate,
  onEdit,
  onDelete,
  onOpenAddModal,
}: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL');

  const canModify = isTodayDate && !isLocked;

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'ALL' && t.type !== filterType) return false;

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesCategory = (t.category || '').toLowerCase().includes(query);
        const matchesRecipient = (t.recipient || '').toLowerCase().includes(query);
        const matchesVoucher = (t.voucherNo || '').toLowerCase().includes(query);
        const matchesNotes = (t.notes || '').toLowerCase().includes(query);
        return matchesCategory || matchesRecipient || matchesVoucher || matchesNotes;
      }

      return true;
    });
  }, [transactions, search, filterType]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Manual Cash Activity Ledger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Extra cash additions and daily expense payouts
          </p>
        </div>

        {canModify && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onOpenAddModal('CASH_OUT')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 text-rose-500" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={() => onOpenAddModal('CASH_IN')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add Cash In</span>
            </button>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search category, recipient..."
            className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto justify-end text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('CASH_OUT')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              filterType === 'CASH_OUT'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Expenses ({transactions.filter(t => t.type === 'CASH_OUT').length})
          </button>
          <button
            onClick={() => setFilterType('CASH_IN')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              filterType === 'CASH_IN'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cash In ({transactions.filter(t => t.type === 'CASH_IN').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-400 text-xs">
            No manual transactions recorded for this day.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4 font-medium">Time</th>
                <th className="py-2.5 px-4 font-medium">Type</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium">Recipient / Paid To</th>
                <th className="py-2.5 px-4 font-medium">Voucher #</th>
                <th className="py-2.5 px-4 font-medium">Description</th>
                <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                {canModify && <th className="py-2.5 px-4 font-medium text-center w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const isOut = t.type === 'CASH_OUT';
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">
                      {formatTime(t.timestamp)}
                    </td>
                    <td className="py-2.5 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700">
                          <TrendingDown className="w-3 h-3 text-rose-500" /> OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> IN
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {t.category}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {t.recipient || '--'}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {t.voucherNo || '--'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={t.notes}>
                      {t.notes || '--'}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono font-bold text-xs ${
                        isOut ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isOut ? `- ${formatINR(t.amount)}` : `+ ${formatINR(t.amount)}`}
                    </td>

                    {canModify && (
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(t)}
                            title="Edit entry"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            title="Delete entry"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
