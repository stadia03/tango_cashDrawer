import type { CouchPayment, CouchDbSettings } from '../types';
import { r2 } from '../utils/currency';

const SETTINGS_STORAGE_KEY = 'waves_couchdb_settings';

export function getDefaultSettings(): CouchDbSettings {
  return {
    url: import.meta.env.VITE_COUCHDB_URL || 'http://localhost:5984',
    dbName: import.meta.env.VITE_COUCHDB_DB_NAME || 'tango_payments',
    user: import.meta.env.VITE_COUCHDB_USER || 'tango',
    password: import.meta.env.VITE_COUCHDB_PASSWORD || 'password',
    location: import.meta.env.VITE_COUCHDB_LOCATION || 'Port Blair',
    method: import.meta.env.VITE_COUCHDB_METHOD || 'Cash',
  };
}

export function getCouchDbSettings(): CouchDbSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Auto-migrate legacy 'payments' database name to configured or 'tango_payments'
      if (parsed.dbName === 'payments') {
        parsed.dbName = import.meta.env.VITE_COUCHDB_DB_NAME || 'tango_payments';
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
      }
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch {
    // fallback
  }
  return getDefaultSettings();
}

export function saveCouchDbSettings(settings: CouchDbSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function matchesTargetDate(isoOrDateStr: string | null | undefined, targetDate: string): boolean {
  if (!isoOrDateStr) return false;
  if (isoOrDateStr.slice(0, 10) === targetDate) return true;
  try {
    const d = new Date(isoOrDateStr);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      if (`${y}-${m}-${day}` === targetDate) return true;
    }
  } catch {}
  return false;
}

export interface FetchResult {
  payments: CouchPayment[];
  totalCashAmount: number;
  errorMessage?: string;
}

/**
 * Fetches payments from CouchDB database strictly matching criteria:
 * - Database: "payments"
 * - type: "payment"
 * - paymentDate: matches targetDate (YYYY-MM-DD)
 * - method: "Cash"
 * - location: "Port Blair"
 * Tries server-side proxy route first (/api/couchdb-payments) to prevent any CORS issues.
 */
export async function fetchPaymentsFromCouchDb(
  targetDate: string,
  customSettings?: Partial<CouchDbSettings>
): Promise<FetchResult> {
  // Attempt 1: Server proxy route (handles CORS & authentication cleanly)
  try {
    const res = await fetch(`/api/couchdb-payments?date=${encodeURIComponent(targetDate)}`);
    if (res.ok) {
      const data = await res.json();
      return {
        payments: data.payments || [],
        totalCashAmount: data.totalCashAmount || 0,
      };
    }
  } catch {
    // Fall back to direct browser fetch below
  }

  // Attempt 2: Direct browser fetch to CouchDB
  const settings: CouchDbSettings = { ...getCouchDbSettings(), ...customSettings };
  const rawUrl = settings.url.trim().replace(/\/+$/, '');
  const dbName = settings.dbName.trim();
  const targetLocation = (settings.location || 'Port Blair').trim().toLowerCase();
  const targetMethod = (settings.method || 'Cash').trim().toLowerCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (settings.user && settings.password) {
    headers['Authorization'] = 'Basic ' + btoa(`${settings.user}:${settings.password}`);
  }

  try {
    let docs: any[] = [];
    const findUrl = `${rawUrl}/${encodeURIComponent(dbName)}/_find`;

    try {
      const response = await fetch(findUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          selector: { type: 'payment' },
          limit: 100000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        docs = data.docs || [];
      } else {
        throw new Error(`CouchDB _find returned status ${response.status}`);
      }
    } catch {
      const allDocsUrl = `${rawUrl}/${encodeURIComponent(dbName)}/_all_docs?include_docs=true&limit=100000`;
      const response2 = await fetch(allDocsUrl, { method: 'GET', headers });
      if (response2.ok) {
        const data = await response2.json();
        docs = (data.rows || []).map((row: any) => row.doc).filter(Boolean);
      } else {
        throw new Error('Unable to connect to CouchDB payments database');
      }
    }

    const filteredPayments: CouchPayment[] = docs.filter((doc: any) => {
      if (!doc || doc.type !== 'payment') return false;

      const method = (doc.method || '').trim().toLowerCase();
      if (method !== targetMethod) return false;

      const loc = (doc.location || '').trim().toLowerCase();
      if (!loc.includes(targetLocation)) return false;

      return matchesTargetDate(doc.paymentDate, targetDate);
    });

    const totalCashAmount = r2(
      filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    );

    filteredPayments.sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));

    return {
      payments: filteredPayments,
      totalCashAmount,
    };
  } catch (err: any) {
    return {
      payments: [],
      totalCashAmount: 0,
      errorMessage: err.message || 'Unable to connect to CouchDB',
    };
  }
}

export async function testCouchDbConnection(
  settings: CouchDbSettings
): Promise<{ ok: boolean; message: string; version?: string }> {
  const rawUrl = settings.url.trim().replace(/\/+$/, '');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (settings.user && settings.password) {
    headers['Authorization'] = 'Basic ' + btoa(`${settings.user}:${settings.password}`);
  }

  try {
    const res = await fetch(`${rawUrl}/`, { method: 'GET', headers });
    if (!res.ok) {
      return { ok: false, message: `Server error ${res.status}: ${res.statusText}` };
    }
    const data = await res.json();
    return {
      ok: true,
      message: `Connected successfully to CouchDB (${data.version || 'OK'})`,
      version: data.version,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err.message || 'Network error: Verify CouchDB URL and credentials',
    };
  }
}
