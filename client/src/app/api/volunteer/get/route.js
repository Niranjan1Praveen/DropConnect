import { route, ok } from "@/lib/api/respond";
import { listVolunteers, getVolunteer, flatten } from "@/lib/services/volunteers";

// ?me=1 returns just your own profile (flattened for the form); otherwise everyone
export const GET = route(async (req, _p, userId) => {
  if (new URL(req.url).searchParams.get("me")) return ok(flatten(await getVolunteer(userId)));
  return ok({ data: await listVolunteers() });
});
