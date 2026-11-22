import { col } from "@/lib/db/mongo";
import { toId, toPlain, toPlainList } from "@/lib/db/serialize";

// Escape user text before dropping it into a regex
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "React, Design ,  " -> ["react", "design"] so skills are searchable as an array
const toTags = (text) =>
  typeof text === "string" ? text.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [];

// Paged list with optional name search, exact location and owner filters
export async function listEvents({ page = 1, size = 10, search = "", location = "", userId } = {}) {
  const events = await col("events");
  const where = {};
  if (search) where.eventName = { $regex: esc(search), $options: "i" };
  if (location) where.eventLocation = { $regex: `^${esc(location)}$`, $options: "i" };
  if (userId) where.userId = userId;

  const [docs, total] = await Promise.all([
    events.find(where).sort({ createdAt: -1 }).skip((page - 1) * size).limit(size).toArray(),
    events.countDocuments(where),
  ]);
  return { data: toPlainList(docs), totalPages: Math.ceil(total / size) };
}

export const listLocations = async () =>
  (await (await col("events")).distinct("eventLocation")).filter(Boolean);

export async function getEvent(id) {
  const _id = toId(id);
  return _id ? toPlain(await (await col("events")).findOne({ _id })) : null;
}

export async function createEvent(data, userId) {
  const now = new Date();
  const doc = {
    ...data,
    volunteerCapacity: Number(data.volunteerCapacity) || 0,
    skillTags: toTags(data.SkillsRequired),
    userId,
    createdAt: now,
    updatedAt: now,
  };
  const { insertedId } = await (await col("events")).insertOne(doc);
  return toPlain({ _id: insertedId, ...doc });
}

// Only the owner may edit/delete; returns "missing" | "forbidden" | the result
async function ownedAction(id, userId, action) {
  const event = await getEvent(id);
  if (!event) return "missing";
  if (event.userId !== userId) return "forbidden";
  return action(await col("events"), toId(id));
}

export const updateEvent = (id, userId, fields) =>
  ownedAction(id, userId, async (events, _id) => {
    const patch = { ...fields, updatedAt: new Date() };
    if ("SkillsRequired" in fields) patch.skillTags = toTags(fields.SkillsRequired);
    return toPlain(await events.findOneAndUpdate({ _id }, { $set: patch }, { returnDocument: "after" }));
  });

export const deleteEvent = (id, userId) =>
  ownedAction(id, userId, async (events, _id) => {
    await events.deleteOne({ _id });
    return { message: "Event deleted successfully" };
  });
