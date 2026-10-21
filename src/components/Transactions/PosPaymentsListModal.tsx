import { Receipt, RefreshCw, X, ShieldCheck } from 'lucide-react';
import type { CouchPayment, CouchSyncStatus } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatTime, formatDisplayDate } from '../../utils/dates';

interface PosPaymentsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  payments: CouchPayment[];
  syncStatus: CouchSyncStatus;
  onSync: () => void;
}

export function PosPaymentsListModal({
  isOpen,
  onClose,
  date,
  payments,
  syncStatus,
  onSync,
}: PosPaymentsListModalProps) {
  if (!isOpen) return null;

  const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 text-slate-800 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                HMS POS Cash Payments
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Read-Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDisplayDate(date)} • Port Blair • Method: Cash
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Summary Bar */}
        <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="text-xs text-slate-700">
            Total <strong>{payments.length}</strong> cash payments • Total:{' '}
            <strong className="text-slate-900 font-mono text-sm">{formatINR(totalAmount)}</strong>
          </div>

          <button
            onClick={onSync}
            disabled={syncStatus.state === 'syncing'}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 shadow-2xs transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3 h-3 ${syncStatus.state === 'syncing' ? 'animate-spin' : ''}`}
            />
            <span>{syncStatus.state === 'syncing' ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* Payments List Table */}
        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-slate-200">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No Cash Payments found for this day</p>
              <p className="text-slate-400 mt-0.5">
                Payments with paymentDate matching today, method &quot;Cash&quot;, and location &quot;Port Blair&quot; appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-2 px-3 font-medium">Payment Date/Time</th>
                  <th className="py-2 px-3 font-medium">Receipt #</th>
                  <th className="py-2 px-3 font-medium">Booking #</th>
                  <th className="py-2 px-3 font-medium">Cashier</th>
                  <th className="py-2 px-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-slate-500 font-mono">
                      {formatTime(p.paymentDate || p.createdAt)}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800">
                      {p.receiptNumber || 'N/A'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-medium">
                      {p.bookingNumber ? `#${p.bookingNumber}` : '--'}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {p.createdBy || 'Staff'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Permanent CouchDB records cannot be edited or deleted.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
