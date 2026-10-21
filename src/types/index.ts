export interface CouchPayment {
  _id: string;
  _rev?: string;
  type: string;
  amount: number;
  method: string;
  bank?: string | null;
  location?: string | null;
  receiptNumber?: string | null;
  bookingNumber?: number | null;
  paymentDate?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
}

export type TransactionType = 'CASH_IN' | 'CASH_OUT';

export interface DrawerTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  type: TransactionType;
  category: string;
  amount: number;
  recipient?: string; // Paid To / Received From
  voucherNo?: string;
  notes?: string;
  staffName: string; // Fixed to "Sarojit"
}

export interface DailyDrawer {
  date: string; // YYYY-MM-DD
  openingBalance: number;
  closingBalance?: number;
  posCashAmount?: number;
  posPaymentCount?: number;
  extraCashIn?: number;
  expensesOut?: number;
  totalCashIn?: number;
  isLocked: boolean;
  lockedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LockDrawerPayload {
  notes?: string;
  closingBalance?: number;
  posCashAmount?: number;
  posPaymentCount?: number;
  extraCashIn?: number;
  expensesOut?: number;
  totalCashIn?: number;
}

export interface CashDrawerSummary {
  date: string;
  openingBalance: number;
  posCashAmount: number;
  posPaymentCount: number;
  extraCashIn: number;
  expensesOut: number;
  totalCashIn: number;
  closingBalance: number; // opening + posCash + extraIn - expensesOut
  isLocked: boolean;
}

export type SyncState = 'idle' | 'syncing' | 'success' | 'error';

export interface CouchSyncStatus {
  state: SyncState;
  lastSyncTime: string | null;
  paymentCount: number;
  totalCashAmount: number;
  errorMessage: string | null;
}

export interface CouchDbSettings {
  url: string;
  dbName: string;
  user: string;
  password: string;
  location: string;
  method: string;
}

export interface DateRangeReportQuery {
  fromDate: string;
  toDate: string;
}
