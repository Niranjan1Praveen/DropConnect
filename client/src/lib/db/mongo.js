import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "dropconnect";

// Reuse one client across hot reloads so dev mode doesn't leak connections
const cache = globalThis._mongo ?? (globalThis._mongo = {});

export async function getDb() {
  if (!uri) throw new Error("MONGODB_URI is missing in .env.local");
  cache.client ??= new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 }).connect();
  return (await cache.client).db(dbName);
}

// Handy shortcut: const events = await col("events")
export const col = async (name) => (await getDb()).collection(name);
