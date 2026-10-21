import { useState } from 'react';
import { useCashDrawer } from './hooks/useCashDrawer';
import { getStoredSession, clearSession } from './services/auth.service';
import { Header } from './components/Layout/Header';
import { SummaryCards } from './components/Dashboard/SummaryCards';
import { QuickActions } from './components/Dashboard/QuickActions';
import { LockDayModal } from './components/Dashboard/LockDayModal';
import { TransactionModal } from './components/Transactions/TransactionModal';
import { TransactionList } from './components/Transactions/TransactionList';
import { PosPaymentsListModal } from './components/Transactions/PosPaymentsListModal';
import { ReportModal } from './components/Reports/ReportModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { LoginModal } from './components/Auth/LoginModal';
import type { TransactionType, DrawerTransaction } from './types';
import { formatDisplayDate, isToday } from './utils/dates';
import { Lock, AlertCircle } from 'lucide-react';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getStoredSession();
  });

  const {
    selectedDate,
    drawer,
    transactions,
    posPayments,
    summary,
    syncStatus,
    isTodayDate,
    syncPosPayments,
    updateOpeningBalance,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    lockDay,
    unlockDay,
    selectDate,
    jumpToToday,
    refreshCurrentData,
  } = useCashDrawer();

  // Modals state
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);
  const [txnDefaultType, setTxnDefaultType] = useState<TransactionType>('CASH_OUT');
  const [editingTxn, setEditingTxn] = useState<DrawerTransaction | null>(null);

  const [isPosListOpen, setIsPosListOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  const handleOpenAddTxn = (type: TransactionType) => {
    setEditingTxn(null);
    setTxnDefaultType(type);
    setIsAddTxnOpen(true);
  };

  const handleOpenEditTxn = (txn: DrawerTransaction) => {
    setEditingTxn(txn);
    setTxnDefaultType(txn.type);
    setIsAddTxnOpen(true);
  };

  const handleSaveTransaction = (
    type: TransactionType,
    category: string,
    amount: number,
    recipient: string,
    voucherNo: string,
    notes: string
  ) => {
    addTransaction(type, category, amount, recipient, voucherNo, notes);
  };

  if (!isAuthenticated) {
    return <LoginModal onSuccess={handleLoginSuccess} />;
  }

  const isCurrentDayToday = isToday(selectedDate);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        selectedDate={selectedDate}
        onSelectDate={selectDate}
        onJumpToday={jumpToToday}
        syncStatus={syncStatus}
        onSync={syncPosPayments}
        summary={summary}
        drawer={drawer}
        posPayments={posPayments}
        transactions={transactions}
        onOpenReportModal={() => setIsReportOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        onLockDrawer={() => setIsLockModalOpen(true)}
        onUnlockDrawer={unlockDay}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* Date Status Notice for Historical Days */}
        {!isCurrentDayToday && (
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Viewing historical records for <strong>{formatDisplayDate(selectedDate)}</strong>.
                {drawer.isLocked && ' (Locked - Read Only)'}
              </span>
            </div>
            <button
              onClick={jumpToToday}
              className="px-2.5 py-1 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition"
            >
              Return to Today
            </button>
          </div>
        )}

        {isCurrentDayToday && drawer.isLocked && (
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700 shadow-2xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Today&apos;s drawer is <strong>locked</strong>. Transactions cannot be added, edited, or deleted.
              </span>
            </div>
            <button
              onClick={unlockDay}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium rounded-lg transition"
            >
              Unlock Day
            </button>
          </div>
        )}

        {/* Financial Summary Cards */}
        <SummaryCards
          summary={summary}
          onUpdateOpeningBalance={updateOpeningBalance}
          onOpenPosPaymentsModal={() => setIsPosListOpen(true)}
        />

        {/* Action Bar */}
        <QuickActions
          isLocked={drawer.isLocked}
          onOpenAddModal={handleOpenAddTxn}
          onLockDrawer={() => setIsLockModalOpen(true)}
          onUnlockDrawer={unlockDay}
        />

        {/* Transactions Ledger */}
        <TransactionList
          transactions={transactions}
          isLocked={drawer.isLocked}
          isTodayDate={isTodayDate}
          onEdit={handleOpenEditTxn}
          onDelete={deleteTransaction}
          onOpenAddModal={handleOpenAddTxn}
        />
      </main>

      {/* Clean Footer */}
      <footer className="py-3 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        Waves Cash Drawer • Port Blair Front Desk • Staff: Sarojit
      </footer>

      {/* Modals */}
      <TransactionModal
        key={`txn-${editingTxn?.id || 'new'}-${isAddTxnOpen}`}
        isOpen={isAddTxnOpen}
        onClose={() => setIsAddTxnOpen(false)}
        defaultType={txnDefaultType}
        editingTransaction={editingTxn}
        onSave={handleSaveTransaction}
        onUpdate={updateTransaction}
      />

      <PosPaymentsListModal
        isOpen={isPosListOpen}
        onClose={() => setIsPosListOpen(false)}
        date={selectedDate}
        payments={posPayments}
        syncStatus={syncStatus}
        onSync={() => syncPosPayments(selectedDate)}
      />

      <LockDayModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        summary={summary}
        onConfirmLock={lockDay}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <SettingsModal
        key={`settings-${isSettingsOpen}`}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          refreshCurrentData();
          syncPosPayments(selectedDate);
        }}
      />
    </div>
  );
}

export default App;
