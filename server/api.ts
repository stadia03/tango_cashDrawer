import express, { type Request, type Response } from 'express';
import { getCollections } from './db.ts';

const router: express.Router = express.Router();
const DEFAULT_STAFF_NAME = 'Sarojit';

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isPastDate(dateStr: string): boolean {
  return dateStr < getTodayStr();
}

function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

function shiftDate(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

// Health check
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const { drawers } = await getCollections();
    const count = await drawers.estimatedDocumentCount();
    res.json({ status: 'ok', mongo: true, drawersCount: count });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// -------------------------------------------------------------
// Daily Drawer Routes (MongoDB)
// -------------------------------------------------------------

// Get or initialize drawer for date
router.get('/drawers/:date', async (req: Request, res: Response) => {
  try {
    const date = String(req.params.date);
    const { drawers } = await getCollections();

    const drawer = await drawers.findOne({ date });

    if (drawer) {
      if (isPastDate(date) && !drawer.isLocked) {
        await drawers.updateOne(
          { date },
          {
            $set: {
              isLocked: true,
              lockedAt: drawer.lockedAt || new Date(`${date}T23:59:59.000Z`).toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }
        );
        drawer.isLocked = true;
      }
      return res.json(drawer);
    }

    const prevDate = shiftDate(date, -1);
    const prevDrawer = await drawers.findOne({ date: prevDate });
    const initialOpening = prevDrawer
      ? (prevDrawer.closingBalance ?? prevDrawer.openingBalance ?? 0)
      : 0;

    const isPast = isPastDate(date);
    const now = new Date().toISOString();

    const newDoc = {
      date,
      openingBalance: initialOpening,
      isLocked: isPast,
      lockedAt: isPast ? `${date}T23:59:59.000Z` : null,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    await drawers.insertOne(newDoc);
    res.json(newDoc);
  } catch (err: any) {
    console.error('Error in GET /drawers/:date', err);
    res.status(500).json({ error: err.message });
  }
});

// Update opening balance
router.put('/drawers/:date/opening-balance', async (req: Request, res: Response) => {
  try {
    const date = String(req.params.date);
    const { amount } = req.body;
    const { drawers } = await getCollections();

    const drawer = await drawers.findOne({ date });
    if (drawer && drawer.isLocked) {
      return res.status(403).json({ error: 'This day is locked and cannot be modified.' });
    }

    const val = Math.max(0, Math.round(Number(amount) * 100) / 100);
    const now = new Date().toISOString();

    await drawers.updateOne(
      { date },
      { $set: { openingBalance: val, updatedAt: now } },
      { upsert: true }
    );

    const updated = await drawers.findOne({ date });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lock day
router.post('/drawers/:date/lock', async (req: Request, res: Response) => {
  try {
    const date = String(req.params.date);
    const {
      notes,
      closingBalance,
      posCashAmount,
      posPaymentCount,
      extraCashIn,
      expensesOut,
      totalCashIn,
    } = req.body;
    const { drawers } = await getCollections();
    const now = new Date().toISOString();

    const updateFields: Record<string, any> = {
      isLocked: true,
      lockedAt: now,
      notes: notes || '',
      updatedAt: now,
    };

    if (closingBalance !== undefined && closingBalance !== null) {
      updateFields.closingBalance = Math.round(Number(closingBalance) * 100) / 100;
    }
    if (posCashAmount !== undefined && posCashAmount !== null) {
      updateFields.posCashAmount = Math.round(Number(posCashAmount) * 100) / 100;
    }
    if (posPaymentCount !== undefined && posPaymentCount !== null) {
      updateFields.posPaymentCount = Number(posPaymentCount);
    }
    if (extraCashIn !== undefined && extraCashIn !== null) {
      updateFields.extraCashIn = Math.round(Number(extraCashIn) * 100) / 100;
    }
    if (expensesOut !== undefined && expensesOut !== null) {
      updateFields.expensesOut = Math.round(Number(expensesOut) * 100) / 100;
    }
    if (totalCashIn !== undefined && totalCashIn !== null) {
      updateFields.totalCashIn = Math.round(Number(totalCashIn) * 100) / 100;
    }

    await drawers.updateOne(
      { date },
      { $set: updateFields },
      { upsert: true }
    );

    const updated = await drawers.findOne({ date });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Unlock day
router.post('/drawers/:date/unlock', async (req: Request, res: Response) => {
  try {
    const date = String(req.params.date);
    const { drawers } = await getCollections();
    const now = new Date().toISOString();

    await drawers.updateOne(
      { date },
      {
        $set: {
          isLocked: false,
          lockedAt: null,
          updatedAt: now,
        },
      }
    );

    const updated = await drawers.findOne({ date });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Transaction Routes (MongoDB)
// -------------------------------------------------------------

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param is required' });

    const { transactions } = await getCollections();
    const list = await transactions
      .find({ date: String(date) })
      .sort({ timestamp: -1 })
      .toArray();

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const { date, type, category, amount, recipient, voucherNo, notes } = req.body;
    if (!date || !type || !category || amount === undefined) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    if (!isToday(String(date))) {
      return res.status(403).json({ error: 'Transactions can only be added for today.' });
    }

    const { drawers, transactions } = await getCollections();
    const drawer = await drawers.findOne({ date: String(date) });
    if (drawer && drawer.isLocked) {
      return res.status(403).json({ error: 'This day is locked. Transactions cannot be added.' });
    }

    const newTxn = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: String(date),
      timestamp: new Date().toISOString(),
      type: type === 'CASH_IN' ? 'CASH_IN' : 'CASH_OUT',
      category: String(category).trim(),
      amount: Math.round(Math.abs(Number(amount)) * 100) / 100,
      recipient: (recipient ? String(recipient) : '').trim(),
      voucherNo: (voucherNo ? String(voucherNo) : '').trim(),
      notes: (notes ? String(notes) : '').trim(),
      staffName: DEFAULT_STAFF_NAME,
      createdAt: new Date().toISOString(),
    };

    await transactions.insertOne(newTxn);
    res.status(201).json(newTxn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { category, amount, recipient, voucherNo, notes } = req.body;
    const { drawers, transactions } = await getCollections();

    const txn = await transactions.findOne({ id });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    if (!isToday(txn.date)) {
      return res.status(403).json({ error: 'Historical transactions cannot be edited.' });
    }

    const drawer = await drawers.findOne({ date: txn.date });
    if (drawer && drawer.isLocked) {
      return res.status(403).json({ error: 'This day is locked. Transactions cannot be edited.' });
    }

    const updated = {
      category: (category ? String(category) : txn.category).trim(),
      amount: amount !== undefined ? Math.round(Math.abs(Number(amount)) * 100) / 100 : txn.amount,
      recipient: recipient !== undefined ? String(recipient).trim() : txn.recipient,
      voucherNo: voucherNo !== undefined ? String(voucherNo).trim() : txn.voucherNo,
      notes: notes !== undefined ? String(notes).trim() : txn.notes,
      staffName: DEFAULT_STAFF_NAME,
      updatedAt: new Date().toISOString(),
    };

    await transactions.updateOne({ id }, { $set: updated });
    const result = await transactions.findOne({ id });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { drawers, transactions } = await getCollections();

    const txn = await transactions.findOne({ id });
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });

    if (!isToday(txn.date)) {
      return res.status(403).json({ error: 'Historical transactions cannot be deleted.' });
    }

    const drawer = await drawers.findOne({ date: txn.date });
    if (drawer && drawer.isLocked) {
      return res.status(403).json({ error: 'This day is locked. Transactions cannot be deleted.' });
    }

    await transactions.deleteOne({ id });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Date Range Reports (MongoDB)
// -------------------------------------------------------------

router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const { drawers, transactions } = await getCollections();

    const drawersList = await drawers
      .find({ date: { $gte: String(fromDate), $lte: String(toDate) } })
      .toArray();

    const txnsList = await transactions
      .find({ date: { $gte: String(fromDate), $lte: String(toDate) } })
      .toArray();

    res.json({
      fromDate,
      toDate,
      drawers: drawersList,
      transactions: txnsList,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// CouchDB Proxy Route (eliminates any browser CORS issues)
// -------------------------------------------------------------

router.get('/couchdb-payments', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date is required' });

    const rawUrl = (process.env.VITE_COUCHDB_URL || 'http://localhost:5984').replace(/\/+$/, '');
    const dbName = (process.env.VITE_COUCHDB_DB_NAME || 'tango_payments').trim();
    const user = process.env.VITE_COUCHDB_USER || '';
    const pass = process.env.VITE_COUCHDB_PASSWORD || '';
    const targetLocation = (process.env.VITE_COUCHDB_LOCATION || 'Port Blair').trim().toLowerCase();
    const targetMethod = (process.env.VITE_COUCHDB_METHOD || 'Cash').trim().toLowerCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (user && pass) {
      headers['Authorization'] = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
    }

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
        const data = (await response.json()) as any;
        docs = data.docs || [];
      } else {
        throw new Error(`CouchDB _find returned status ${response.status}`);
      }
    } catch {
      const allDocsUrl = `${rawUrl}/${encodeURIComponent(dbName)}/_all_docs?include_docs=true&limit=100000`;
      const response2 = await fetch(allDocsUrl, { method: 'GET', headers });
      if (response2.ok) {
        const data = (await response2.json()) as any;
        docs = (data.rows || []).map((r: any) => r.doc).filter(Boolean);
      }
    }

    const filtered = docs.filter((doc: any) => {
      if (!doc || doc.type !== 'payment') return false;
      const method = (doc.method || '').trim().toLowerCase();
      if (method !== targetMethod) return false;

      const loc = (doc.location || '').trim().toLowerCase();
      if (!loc.includes(targetLocation)) return false;

      const pDate = doc.paymentDate ? String(doc.paymentDate) : '';
      if (!pDate) return false;
      if (pDate.slice(0, 10) === String(date)) return true;
      try {
        const d = new Date(pDate);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          if (`${y}-${m}-${day}` === String(date)) return true;
        }
      } catch {}
      return false;
    });

    const totalCashAmount =
      Math.round(filtered.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) * 100) / 100;

    filtered.sort((a: any, b: any) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));

    res.json({
      payments: filtered,
      totalCashAmount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, payments: [], totalCashAmount: 0 });
  }
});

export default router;
