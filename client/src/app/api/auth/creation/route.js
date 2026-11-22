import { NextResponse } from "next/server";
import { getClerkProfile } from "@/lib/auth/session";
import { ensureUser } from "@/lib/services/users";
import { logActivity } from "@/lib/services/activity";
import { HOME_BY_ROLE } from "@/lib/utils/roles";

// Keep the host the visitor actually used (localhost vs 127.0.0.1 have separate sessions)
const here = (req, path) => new URL(path, `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host")}`);

// Clerk sends users here after sign-in/up; we sync them into Mongo and route by role
export async function GET(req) {
  const profile = await getClerkProfile();
  if (!profile) return NextResponse.redirect(here(req, "/sign-in"));

  const roleHint = new URL(req.url).searchParams.get("user_type");
  const user = await ensureUser(profile, roleHint);
  await logActivity(user.id, "login", { role: user.role, via: roleHint ? "register" : "sign-in" });

  return NextResponse.redirect(here(req, HOME_BY_ROLE[user.role] ?? "/"));
}
