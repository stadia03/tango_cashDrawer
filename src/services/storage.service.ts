import type { DailyDrawer, DrawerTransaction, LockDrawerPayload } from '../types';

export const DEFAULT_STAFF_NAME = 'Sarojit';

/**
 * Fetches or initializes a DailyDrawer document from MongoDB
 */
export async function fetchDrawerForDate(dateStr: string): Promise<DailyDrawer> {
  const res = await fetch(`/api/drawers/${encodeURIComponent(dateStr)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch drawer (${res.status})`);
  }
  return res.json();
}

/**
 * Updates opening balance in MongoDB (only if not locked)
 */
export async function updateOpeningBalance(dateStr: string, amount: number): Promise<DailyDrawer> {
  const res = await fetch(`/api/drawers/${encodeURIComponent(dateStr)}/opening-balance`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update opening balance');
  }
  return res.json();
}

/**
 * Locks a day in MongoDB
 */
export async function lockDrawer(
  dateStr: string,
  payload?: string | LockDrawerPayload
): Promise<DailyDrawer> {
  const body = typeof payload === 'string' ? { notes: payload } : (payload || {});
  const res = await fetch(`/api/drawers/${encodeURIComponent(dateStr)}/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to lock day');
  }
  return res.json();
}

/**
 * Unlocks a day in MongoDB
 */
export async function unlockDrawer(dateStr: string): Promise<DailyDrawer> {
  const res = await fetch(`/api/drawers/${encodeURIComponent(dateStr)}/unlock`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to unlock day');
  }
  return res.json();
}

/**
 * Fetches manual transactions for a specific date from MongoDB
 */
export async function fetchTransactionsForDate(dateStr: string): Promise<DrawerTransaction[]> {
  const res = await fetch(`/api/transactions?date=${encodeURIComponent(dateStr)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch transactions');
  }
  return res.json();
}

/**
 * Adds a manual transaction in MongoDB
 */
export async function addTransaction(
  dateStr: string,
  type: 'CASH_IN' | 'CASH_OUT',
  category: string,
  amount: number,
  recipient: string = '',
  voucherNo: string = '',
  notes: string = '',
  staffName: string = DEFAULT_STAFF_NAME
): Promise<DrawerTransaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: dateStr,
      type,
      category,
      amount,
      recipient,
      voucherNo,
      notes,
      staffName,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add transaction');
  }
  return res.json();
}

/**
 * Updates a manual transaction in MongoDB (Today only)
 */
export async function updateTransaction(updated: DrawerTransaction): Promise<DrawerTransaction> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(updated.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update transaction');
  }
  return res.json();
}

/**
 * Deletes a manual transaction in MongoDB (Today only)
 */
export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete transaction');
  }
}

/**
 * Fetches date range report data from MongoDB
 */
export async function fetchDateRangeReports(
  fromDate: string,
  toDate: string
): Promise<{ drawers: DailyDrawer[]; transactions: DrawerTransaction[] }> {
  const res = await fetch(
    `/api/reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch report from MongoDB');
  }
  return res.json();
}

/**
 * Exports all data from MongoDB as JSON backup string
 */
export async function exportBackupData(): Promise<string> {
  const data = await fetchDateRangeReports('2020-01-01', '2035-12-31');
  return JSON.stringify(
    {
      source: 'portblair_cashdrawer (MongoDB)',
      exportDate: new Date().toISOString(),
      drawers: data.drawers,
      transactions: data.transactions,
    },
    null,
    2
  );
}

/**
 * Validates backup JSON
 */
export async function importBackupData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data.drawers) && !Array.isArray(data.transactions)) {
      return { success: false, message: 'Invalid backup format.' };
    }
    return { success: true, message: 'Backup file is valid.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'JSON parsing failed' };
  }
}

