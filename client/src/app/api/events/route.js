import { route, ok, parse } from "@/lib/api/respond";
import { eventSchema } from "@/lib/validations/event";
import { createEvent, listEvents } from "@/lib/services/events";
import { logActivity } from "@/lib/services/activity";

// GET /api/events?page=1&search=water&location=Pune
export const GET = route(async (req) => {
  const q = new URL(req.url).searchParams;
  return ok(await listEvents({ page: Number(q.get("page")) || 1, search: q.get("search") || "", location: q.get("location") || "" }));
});

// POST /api/events — organisations publish a new opportunity
export const POST = route(async (req, _p, userId) => {
  const { data, res } = parse(eventSchema, await req.json());
  if (res) return res;
  const event = await createEvent(data, userId);
  await logActivity(userId, "event.created", { eventId: event.id, name: event.eventName });
  return ok(event, 201);
});
