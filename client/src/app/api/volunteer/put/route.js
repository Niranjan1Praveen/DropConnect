import { route, ok } from "@/lib/api/respond";
import { saveVolunteer } from "@/lib/services/volunteers";
import { logActivity } from "@/lib/services/activity";

// Save (create or update) the logged-in volunteer's profile
export const PUT = route(async (req, _p, userId) => {
  const saved = await saveVolunteer(userId, await req.json());
  await logActivity(userId, "volunteer.profile_saved", { skills: saved.skills });
  return ok(saved);
});
