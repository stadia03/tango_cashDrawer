import { useState } from 'react';
import { X, TrendingDown, ArrowDownLeft, Check } from 'lucide-react';
import type { TransactionType, DrawerTransaction } from '../../types';
import { DEFAULT_STAFF_NAME } from '../../services/storage.service';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  editingTransaction?: DrawerTransaction | null;
  onSave: (
    type: TransactionType,
    category: string,
    amount: number,
    recipient: string,
    voucherNo: string,
    notes: string
  ) => void;
  onUpdate?: (updated: DrawerTransaction) => void;
}

const CASH_OUT_CATEGORIES = [
  'Kitchen & Groceries',
  'Staff Advance',
  'Maintenance & Repairs',
  'Diesel & Generator Fuel',
  'Local Vendor Payout',
  'Stationery & Office Supplies',
  'Guest Refund',
  'Miscellaneous Expense',
];

const CASH_IN_CATEGORIES = [
  'Float Addition',
  'Petty Cash Deposit',
  'Manual Guest Payment',
  'Refund Received',
  'Miscellaneous Income',
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export function TransactionModal({
  isOpen,
  onClose,
  defaultType = 'CASH_OUT',
  editingTransaction,
  onSave,
  onUpdate,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(() => editingTransaction?.type || defaultType);
  const [category, setCategory] = useState<string>(() => {
    if (editingTransaction?.category) return editingTransaction.category;
    return defaultType === 'CASH_OUT' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0];
  });
  const [amount, setAmount] = useState(() => (editingTransaction?.amount ? editingTransaction.amount.toString() : ''));
  const [recipient, setRecipient] = useState(() => editingTransaction?.recipient || '');
  const [voucherNo, setVoucherNo] = useState(() => editingTransaction?.voucherNo || '');
  const [notes, setNotes] = useState(() => editingTransaction?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'CASH_OUT' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]);
  };

  const handleQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    if (editingTransaction && onUpdate) {
      onUpdate({
        ...editingTransaction,
        type,
        category: category.trim(),
        amount: parsedAmount,
        recipient: recipient.trim(),
        voucherNo: voucherNo.trim(),
        notes: notes.trim(),
        staffName: DEFAULT_STAFF_NAME,
      });
    } else {
      onSave(
        type,
        category.trim(),
        parsedAmount,
        recipient.trim(),
        voucherNo.trim(),
        notes.trim()
      );
    }
    onClose();
  };

  if (!isOpen) return null;

  const currentCategories = type === 'CASH_OUT' ? CASH_OUT_CATEGORIES : CASH_IN_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-slate-800 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {editingTransaction
                ? 'Edit Transaction'
                : type === 'CASH_OUT'
                ? 'Record Expense (Cash Out)'
                : 'Record Extra Cash In'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Staff: {DEFAULT_STAFF_NAME}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle */}
          {!editingTransaction && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleTypeChange('CASH_OUT')}
                className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                  type === 'CASH_OUT'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                <span>Expense / Out</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('CASH_IN')}
                className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                  type === 'CASH_IN'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Extra Cash / In</span>
              </button>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 font-mono focus:outline-hidden focus:border-slate-800"
                autoFocus
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2 py-0.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
                >
                  +{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-slate-800"
            >
              {currentCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient & Voucher */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                {type === 'CASH_OUT' ? 'Paid To / Vendor' : 'Received From'}
              </label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder={type === 'CASH_OUT' ? 'e.g. Market' : 'e.g. Guest'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Voucher / Bill #
              </label>
              <input
                type="text"
                value={voucherNo}
                onChange={e => setVoucherNo(e.target.value)}
                placeholder="e.g. V-102"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason or item details..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-slate-800 resize-none"
            />
          </div>

          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

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
              <Check className="w-3.5 h-3.5" />
              <span>{editingTransaction ? 'Save Changes' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
