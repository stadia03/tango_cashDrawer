import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  DailyDrawer,
  DrawerTransaction,
  CouchPayment,
  CashDrawerSummary,
  CouchSyncStatus,
  TransactionType,
} from '../types';
import { getTodayStr, isPastDate, isToday } from '../utils/dates';
import { r2 } from '../utils/currency';
import {
  fetchDrawerForDate,
  updateOpeningBalance,
  lockDrawer,
  unlockDrawer,
  fetchTransactionsForDate,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  DEFAULT_STAFF_NAME,
} from '../services/storage.service';
import { fetchPaymentsFromCouchDb } from '../services/couchdb.service';

export function useCashDrawer() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [drawer, setDrawer] = useState<DailyDrawer>(() => ({
    date: getTodayStr(),
    openingBalance: 0,
    isLocked: false,
    createdAt: '',
    updatedAt: '',
  }));
  const [transactions, setTransactions] = useState<DrawerTransaction[]>([]);
  const [posPayments, setPosPayments] = useState<CouchPayment[]>([]);
  const [syncStatus, setSyncStatus] = useState<CouchSyncStatus>({
    state: 'idle',
    lastSyncTime: null,
    paymentCount: 0,
    totalCashAmount: 0,
    errorMessage: null,
  });

  // Reload drawer and manual transactions from MongoDB
  const reloadData = useCallback(async (date: string) => {
    try {
      const [drawerDoc, txnsList] = await Promise.all([
        fetchDrawerForDate(date),
        fetchTransactionsForDate(date),
      ]);
      setDrawer(drawerDoc);
      setTransactions(txnsList);
    } catch (err: any) {
      console.error('Failed to load data from MongoDB:', err);
    }
  }, []);

  // Sync payments from CouchDB
  const syncPosPayments = useCallback(async (date: string) => {
    setSyncStatus(prev => ({ ...prev, state: 'syncing', errorMessage: null }));
    try {
      const result = await fetchPaymentsFromCouchDb(date);
      setPosPayments(result.payments);
      setSyncStatus({
        state: result.errorMessage ? 'error' : 'success',
        lastSyncTime: new Date().toISOString(),
        paymentCount: result.payments.length,
        totalCashAmount: result.totalCashAmount,
        errorMessage: result.errorMessage || null,
      });
    } catch (err: any) {
      setSyncStatus(prev => ({
        ...prev,
        state: 'error',
        errorMessage: err.message || 'Sync failed',
      }));
    }
  }, []);

  // Summary calculations
  const summary: CashDrawerSummary = useMemo(() => {
    const openingBalance = drawer.openingBalance || 0;
    const posCashAmount = r2(
      posPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );
    const extraCashIn = r2(
      transactions
        .filter(t => t.type === 'CASH_IN')
        .reduce((sum, t) => sum + t.amount, 0)
    );
    const expensesOut = r2(
      transactions
        .filter(t => t.type === 'CASH_OUT')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const totalCashIn = r2(posCashAmount + extraCashIn);
    const closingBalance = r2(openingBalance + totalCashIn - expensesOut);

    return {
      date: selectedDate,
      openingBalance,
      posCashAmount,
      posPaymentCount: posPayments.length,
      extraCashIn,
      expensesOut,
      totalCashIn,
      closingBalance,
      isLocked: drawer.isLocked,
    };
  }, [drawer, transactions, posPayments, selectedDate]);

  // When date changes, reload from MongoDB and fetch CouchDB
  useEffect(() => {
    reloadData(selectedDate);
    syncPosPayments(selectedDate);
  }, [selectedDate, reloadData, syncPosPayments]);

  // Midnight day rollover monitor
  useEffect(() => {
    const interval = setInterval(() => {
      const actualToday = getTodayStr();
      if (selectedDate !== actualToday && isToday(selectedDate)) {
        lockDrawer(selectedDate, {
          notes: 'Day closed automatically at midnight.',
          closingBalance: summary.closingBalance,
          posCashAmount: summary.posCashAmount,
          posPaymentCount: summary.posPaymentCount,
          extraCashIn: summary.extraCashIn,
          expensesOut: summary.expensesOut,
          totalCashIn: summary.totalCashIn,
        });
        setSelectedDate(actualToday);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDate, summary]);

  // Periodic background CouchDB sync every 60 seconds if today
  useEffect(() => {
    if (!isToday(selectedDate)) return;

    const syncInterval = setInterval(() => {
      syncPosPayments(selectedDate);
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [selectedDate, syncPosPayments]);

  // Action handlers calling MongoDB
  const handleUpdateOpeningBalance = useCallback(
    async (amount: number) => {
      if (drawer.isLocked) return;
      try {
        const updated = await updateOpeningBalance(selectedDate, amount);
        setDrawer(updated);
      } catch (err: any) {
        alert(err.message);
      }
    },
    [drawer.isLocked, selectedDate]
  );

  const handleAddTransaction = useCallback(
    async (
      type: TransactionType,
      category: string,
      amount: number,
      recipient: string = '',
      voucherNo: string = '',
      notes: string = ''
    ) => {
      if (!isToday(selectedDate)) {
        throw new Error('Transactions can only be added for today.');
      }
      if (drawer.isLocked) {
        throw new Error('This day is locked.');
      }
      const newTxn = await addTransaction(
        selectedDate,
        type,
        category,
        amount,
        recipient,
        voucherNo,
        notes,
        DEFAULT_STAFF_NAME
      );
      setTransactions(prev => [newTxn, ...prev]);
    },
    [drawer.isLocked, selectedDate]
  );

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      if (!isToday(selectedDate)) {
        throw new Error('Historical day transactions cannot be deleted.');
      }
      if (drawer.isLocked) {
        throw new Error('This day is locked.');
      }
      await deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    },
    [drawer.isLocked, selectedDate]
  );

  const handleUpdateTransaction = useCallback(
    async (updated: DrawerTransaction) => {
      if (!isToday(selectedDate)) {
        throw new Error('Historical day transactions cannot be edited.');
      }
      if (drawer.isLocked) {
        throw new Error('This day is locked.');
      }
      const res = await updateTransaction(updated);
      setTransactions(prev => prev.map(t => (t.id === res.id ? res : t)));
    },
    [drawer.isLocked, selectedDate]
  );

  const handleLockDay = useCallback(
    async (notes?: string) => {
      const locked = await lockDrawer(selectedDate, {
        notes,
        closingBalance: summary.closingBalance,
        posCashAmount: summary.posCashAmount,
        posPaymentCount: summary.posPaymentCount,
        extraCashIn: summary.extraCashIn,
        expensesOut: summary.expensesOut,
        totalCashIn: summary.totalCashIn,
      });
      setDrawer(locked);
    },
    [selectedDate, summary]
  );

  const handleUnlockDay = useCallback(async () => {
    const unlocked = await unlockDrawer(selectedDate);
    setDrawer(unlocked);
  }, [selectedDate]);

  return {
    selectedDate,
    drawer,
    transactions,
    posPayments,
    summary,
    syncStatus,
    isPast: isPastDate(selectedDate),
    isTodayDate: isToday(selectedDate),
    syncPosPayments: (targetDate?: string) => syncPosPayments(targetDate || selectedDate),
    updateOpeningBalance: handleUpdateOpeningBalance,
    addTransaction: handleAddTransaction,
    deleteTransaction: handleDeleteTransaction,
    updateTransaction: handleUpdateTransaction,
    lockDay: handleLockDay,
    unlockDay: handleUnlockDay,
    selectDate: setSelectedDate,
    jumpToToday: () => setSelectedDate(getTodayStr()),
    refreshCurrentData: () => reloadData(selectedDate),
  };
}
