import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { findUser } from "@/lib/services/users";
import { HOME_BY_ROLE } from "@/lib/utils/roles";

// Page guard: only the listed roles get in; others go back to their own home
export async function requireRole(...roles) {
  const user = await findUser(await requirePageUser());
  if (!user || !roles.includes(user.role)) redirect(HOME_BY_ROLE[user?.role] ?? "/");
  return user;
}

// API check: true when this user has one of the roles
export const hasRole = async (userId, ...roles) => roles.includes((await findUser(userId))?.role);
