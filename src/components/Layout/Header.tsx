import { useState } from 'react';
import {
  RefreshCw,
  Lock,
  Unlock,
  FileText,
  Settings,
  LogOut,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  User,
} from 'lucide-react';
import type { CouchSyncStatus, CashDrawerSummary, DailyDrawer, CouchPayment, DrawerTransaction } from '../../types';
import { formatDisplayDate, shiftDate, isToday } from '../../utils/dates';
import { generateDailyDrawerPdfReport } from '../../services/pdf.service';
import { DEFAULT_STAFF_NAME } from '../../services/storage.service';

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onJumpToday: () => void;
  syncStatus: CouchSyncStatus;
  onSync: () => void;
  summary: CashDrawerSummary;
  drawer: DailyDrawer;
  posPayments: CouchPayment[];
  transactions: DrawerTransaction[];
  onOpenReportModal: () => void;
  onOpenSettingsModal: () => void;
  onLockDrawer: () => void;
  onUnlockDrawer: () => void;
  onLogout: () => void;
}

export function Header({
  selectedDate,
  onSelectDate,
  onJumpToday,
  syncStatus,
  onSync,
  summary,
  drawer,
  posPayments,
  transactions,
  onOpenReportModal,
  onOpenSettingsModal,
  onLockDrawer,
  onUnlockDrawer,
  onLogout,
}: HeaderProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const isCurrentDayToday = isToday(selectedDate);

  const handlePrevDay = () => {
    onSelectDate(shiftDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    onSelectDate(shiftDate(selectedDate, 1));
  };

  const handleDownloadDayPdf = () => {
    generateDailyDrawerPdfReport(summary, drawer, posPayments, transactions);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Brand & Property */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white">
                    Waves Cash Drawer
                  </h1>
                  {summary.isLocked ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Port Blair</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{DEFAULT_STAFF_NAME}</span>
                  </span>
                  <span>•</span>
                  {/* CouchDB Sync Status */}
                  <button
                    onClick={onSync}
                    title="Sync with CouchDB"
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        syncStatus.state === 'syncing'
                          ? 'bg-amber-400 animate-pulse'
                          : syncStatus.state === 'error'
                          ? 'bg-rose-500'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="text-[11px]">
                      {syncStatus.state === 'syncing'
                        ? 'Syncing...'
                        : syncStatus.state === 'error'
                        ? 'Sync error'
                        : `Synced (${syncStatus.paymentCount})`}
                    </span>
                    <RefreshCw
                      className={`w-2.5 h-2.5 ml-0.5 text-slate-400 ${
                        syncStatus.state === 'syncing' ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile actions */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={onOpenReportModal}
                className="p-1.5 text-slate-400 hover:text-white"
                title="Report"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSettingsModal}
                className="p-1.5 text-slate-400 hover:text-white"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-rose-400 hover:text-rose-300"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 w-full md:w-auto justify-between md:justify-center">
            <button
              onClick={handlePrevDay}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative px-2">
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white px-2 py-0.5 rounded transition"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDisplayDate(selectedDate)}</span>
              </button>

              {isDatePickerOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl z-50 text-slate-100">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => {
                      if (e.target.value) {
                        onSelectDate(e.target.value);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleNextDay}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isCurrentDayToday && (
              <button
                onClick={onJumpToday}
                className="ml-1.5 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              >
                Today
              </button>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={handleDownloadDayPdf}
              title="Daily PDF"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Daily PDF</span>
            </button>

            <button
              onClick={onOpenReportModal}
              title="Date Range Report"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Range PDF</span>
            </button>

            {summary.isLocked ? (
              <button
                onClick={onUnlockDrawer}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
              >
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span>Unlock</span>
              </button>
            ) : (
              <button
                onClick={onLockDrawer}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Lock Day</span>
              </button>
            )}

            <button
              onClick={onOpenSettingsModal}
              title="Settings"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
