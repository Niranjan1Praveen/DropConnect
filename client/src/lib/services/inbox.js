import { col } from "@/lib/db/mongo";
import { toPlainList, toPlain } from "@/lib/db/serialize";

// Each volunteer sees only their own applications, newest first
export const listInbox = async (userId) =>
  toPlainList(await (await col("inbox")).find({ userId }).sort({ createdAt: -1 }).toArray());

// Returns null when this user already applied to the event.
// `history` is an embedded array of status changes (grows as NGOs review it).
export async function applyToEvent(userId, entry) {
  const inbox = await col("inbox");
  if (await inbox.findOne({ userId, eventId: entry.eventId })) return null;
  const now = new Date();
  const doc = { ...entry, userId, status: "pending", history: [{ status: "pending", at: now }], createdAt: now };
  const { insertedId } = await inbox.insertOne(doc);
  return toPlain({ _id: insertedId, ...doc });
}
