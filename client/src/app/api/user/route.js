import { route, ok, fail } from "@/lib/api/respond";
import { findUser } from "@/lib/services/users";

// The dashboard sidebar asks who is logged in (and their role)
export const GET = route(async (_req, _p, userId) => {
  const user = await findUser(userId);
  return user ? ok(user) : fail("User not found", 404);
});
