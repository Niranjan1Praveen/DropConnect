import { route, ok, fail } from "@/lib/api/respond";
import { hasRole } from "@/lib/auth/roles";
import { analyzeSpot } from "@/lib/services/mapInsight";

// POST { latitude, longitude } -> ML risk + drivers + Gemini explanation (NGOs only)
export const POST = route(async (req, _p, userId) => {
  if (!(await hasRole(userId, "ORGANIZATION"))) return fail("Only NGOs can use the risk map", 403);
  const { latitude, longitude } = await req.json();
  const lat = Number(latitude), lon = Number(longitude);
  if (!(lat >= 6 && lat <= 38 && lon >= 67 && lon <= 98)) return fail("Please pick a spot inside India");
  return ok(await analyzeSpot(lat, lon, userId));
});
