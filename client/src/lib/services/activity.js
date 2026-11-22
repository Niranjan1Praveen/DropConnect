import { col } from "@/lib/db/mongo";

// Free-form audit trail: every entry can carry a different `payload` shape.
// This is the kind of schemaless data Mongo is great at.
export async function logActivity(userId, type, payload = {}) {
  try {
    await (await col("activity")).insertOne({ userId, type, payload, at: new Date() });
  } catch (err) {
    console.warn("Activity log skipped:", err.message); // never block the main action
  }
}

export const recentActivity = async (userId, limit = 20) =>
  (await col("activity")).find({ userId }).sort({ at: -1 }).limit(limit).toArray();
