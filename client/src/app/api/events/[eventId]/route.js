import { route, ok, fail, parse, fromStatus } from "@/lib/api/respond";
import { eventSchema } from "@/lib/validations/event";
import { getEvent, updateEvent, deleteEvent } from "@/lib/services/events";
import { logActivity } from "@/lib/services/activity";

export const GET = route(async (_req, { eventId }) => {
  const event = await getEvent(eventId);
  return event ? ok(event) : fail("Event not found", 404);
});

// Owners can tweak their event; partial updates are fine
export const PUT = route(async (req, { eventId }, userId) => {
  const { data, res } = parse(eventSchema.partial(), await req.json());
  if (res) return res;
  const result = await updateEvent(eventId, userId, data);
  if (typeof result === "object") await logActivity(userId, "event.updated", { eventId, fields: Object.keys(data) });
  return fromStatus(result);
});

export const DELETE = route(async (_req, { eventId }, userId) => {
  const result = await deleteEvent(eventId, userId);
  if (typeof result === "object") await logActivity(userId, "event.deleted", { eventId });
  return fromStatus(result);
});
