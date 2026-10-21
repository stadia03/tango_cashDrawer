# Waves Cash Drawer Software

A modern Front Desk Cash Drawer record and audit management system built with **React 19**, **Vite**, **Tailwind CSS v4**, **TypeScript**, and **MongoDB Atlas**.

---

## 🌟 Architecture & Databases

### 1. MongoDB Atlas Storage (`portblair_cashdrawer`)

All daily drawer balances, lock statuses, manual cash activity, and historical reports are stored directly in your MongoDB Atlas cluster:

* **Connection URI**: Configured via environment variables (`MONGO_URL`).
* **Collections**:
* `daily_drawers`: Tracks daily opening balances, lock timestamps, and closing notes per date (`YYYY-MM-DD`).
* `transactions`: Stores manual extra cash additions and expense payouts with categories, vouchers, and staff name.


* Automatically handles indexing (`date`, `id`, `timestamp`).

### 2. HMS CouchDB Payments Auto-Sync

* **Target Database**: Queries CouchDB `payments` database.
* **Criteria**:
* `type`: `"payment"`
* `paymentDate`: Matches the date (`YYYY-MM-DD`).
* `method`: `"Cash"` (case-insensitive).
* `location`: Configured per hotel location (e.g., `"Port Blair"`).


* All other payment methods (UPI, Card) and other hotel locations are ignored.
* Read-only permanent records that cannot be edited or deleted.
* Handled through a local proxy endpoint (`/api/couchdb-payments`), completely avoiding browser CORS restrictions.

---

## 🔑 Key Features

1. **Clean Records (No Dummy Data)**: Zero mock/sample data. If no cash payments exist for today, it cleanly displays `₹0.00 (0 bills)`.
2. **Simplified Financial Tracking**:

$$\text{Closing Cash in Drawer} = \text{Opening Balance} + \text{Today's POS Cash} + \text{Extra Cash In} - \text{Expenses}$$


3. **Strict Editing & Locking Rules**:
* CouchDB POS payments are permanent and read-only.
* Manual entries (Extra Cash In & Expenses) can only be added, edited, or deleted for **today** and **before midnight day closure**.
* Past days are locked automatically at 12:00 AM midnight.


4. **Audit Identification**: Automatic attribution across manual vouchers, reports, and audit signatures.
5. **PDF Reports**:
* **Date Range Audit PDF**: Sourced directly from MongoDB for any selected date range.
* **Daily Shift PDF**: Single-day breakdown with POS receipts and expense ledger.



---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install

```

### 2. Environment Configuration (`.env.example`)

Create a `.env` file in the project root based on this template:

```env
# CouchDB Connection
VITE_COUCHDB_URL=http://<couchdb-host>:<port>/
VITE_COUCHDB_DB_NAME=payments
VITE_COUCHDB_USER=<your-couchdb-username>
VITE_COUCHDB_PASSWORD=<your-couchdb-password>
VITE_COUCHDB_LOCATION=Port Blair
VITE_COUCHDB_METHOD=Cash

# Hotel Name
VITE_HOTEL_NAME=Tango Hotel & Resorts - Port Blair

# Static Password Hashes (Comma-separated SHA-256 hashes)
VITE_AUTH_HASHES="<your-sha256-password-hash>"

# MongoDB Atlas
MONGO_URL="mongodb+srv://<username>:<password>@<cluster-address>/portblair_cashdrawer?retryWrites=true&w=majority"

```

### 3. Run Development Server

```bash
npm run dev

```

Both the React frontend and MongoDB API run simultaneously on `http://localhost:5173/`.

### 4. Run Production Server

```bash
npm run build
npm start

```

Runs the full stack production server on port 5173.

---


