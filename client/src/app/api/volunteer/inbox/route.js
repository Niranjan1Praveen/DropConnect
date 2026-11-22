import { route, ok, fail } from "@/lib/api/respond";
import { listInbox, applyToEvent } from "@/lib/services/inbox";
import { logActivity } from "@/lib/services/activity";

export const GET = route(async (_req, _p, userId) => ok(await listInbox(userId)));

// A volunteer applies to an event; duplicates get a friendly 409
export const POST = route(async (req, _p, userId) => {
  const { eventId, eventName, eventDescription, organizerName } = await req.json();
  if (!eventId || !eventName || !organizerName) return fail("Missing required fields");

  const entry = await applyToEvent(userId, { eventId, eventName, eventDescription, organizerName });
  if (!entry) return fail("You have already applied for this opportunity.", 409);

  await logActivity(userId, "event.applied", { eventId, eventName });
  return ok(entry, 201);
});
