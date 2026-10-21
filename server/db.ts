import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb+srv://user:JwpBtCSy6cb3uHEM@stadia.nksyopz.mongodb.net/portblair_cashdrawer?retryWrites=true&w=majority';
const DB_NAME = 'portblair_cashdrawer';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(MONGO_URL, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    console.log('[MongoDB] Connected successfully to portblair_cashdrawer');
  }
  db = client.db(DB_NAME);

  // Ensure indexes
  const drawers = db.collection('daily_drawers');
  await drawers.createIndex({ date: 1 }, { unique: true });

  const transactions = db.collection('transactions');
  await transactions.createIndex({ id: 1 }, { unique: true });
  await transactions.createIndex({ date: 1, timestamp: -1 });

  return db;
}

export interface MongoCollections {
  drawers: Collection<any>;
  transactions: Collection<any>;
}

export async function getCollections(): Promise<MongoCollections> {
  const database = await getDb();
  return {
    drawers: database.collection('daily_drawers'),
    transactions: database.collection('transactions'),
  };
}
