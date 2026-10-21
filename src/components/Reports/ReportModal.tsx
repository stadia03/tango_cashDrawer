import { useState } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { getTodayStr, shiftDate, formatDisplayDate } from '../../utils/dates';
import { generateDateRangePdfReport } from '../../services/pdf.service';
import { fetchPaymentsFromCouchDb } from '../../services/couchdb.service';
import type { CouchPayment } from '../../types';

import { fetchDateRangeReports } from '../../services/storage.service';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const today = getTodayStr();
  const [fromDate, setFromDate] = useState(shiftDate(today, -7));
  const [toDate, setToDate] = useState(today);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleQuickRange = (days: number) => {
    setToDate(today);
    setFromDate(shiftDate(today, -days));
  };

  const handleThisMonth = () => {
    const d = new Date();
    const firstDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    setFromDate(firstDay);
    setToDate(today);
  };

  const handleGeneratePdf = async () => {
    if (fromDate > toDate) {
      alert('From Date must be on or before To Date.');
      return;
    }

    setIsGenerating(true);

    try {
      const posPaymentsByDate: Record<string, CouchPayment[]> = {};
      let curr = new Date(fromDate);
      const end = new Date(toDate);
      const dateList: string[] = [];

      while (curr <= end) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dateList.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }

      // Fetch MongoDB data and CouchDB payments in parallel
      const [mongoData] = await Promise.all([
        fetchDateRangeReports(fromDate, toDate),
        Promise.all(
          dateList.map(async d => {
            try {
              const res = await fetchPaymentsFromCouchDb(d);
              posPaymentsByDate[d] = res.payments;
            } catch {
              posPaymentsByDate[d] = [];
            }
          })
        ),
      ]);

      generateDateRangePdfReport(
        fromDate,
        toDate,
        mongoData.drawers || [],
        mongoData.transactions || [],
        posPaymentsByDate
      );
      onClose();
    } catch (err: any) {
      alert(`Error generating PDF report: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-slate-800 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Date Range PDF Report</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Export consolidated cash drawer audit</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickRange(0)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                Today Only
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(6)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={handleThisMonth}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(29)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition"
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-slate-800"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            Selected Period: <strong>{formatDisplayDate(fromDate)}</strong> to{' '}
            <strong>{formatDisplayDate(toDate)}</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
