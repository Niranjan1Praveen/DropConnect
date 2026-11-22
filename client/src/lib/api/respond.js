import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth/session";

export const ok = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (error, status = 400) => NextResponse.json({ error }, { status });

// Wraps a route handler: catches crashes and (by default) enforces login.
// The handler receives (req, params, userId).
export const route = (fn, { auth = true } = {}) => async (req, ctx) => {
  try {
    const userId = await getUserId();
    if (auth && !userId) return fail("Unauthorized", 401);
    return await fn(req, (await ctx?.params) ?? {}, userId);
  } catch (err) {
    console.error("API error:", err);
    return fail("Internal server error", 500);
  }
};

// Validate a body with zod; returns { data } on success or { res } with a 400 reply
export const parse = (schema, body) => {
  const out = schema.safeParse(body);
  if (out.success) return { data: out.data };
  return { res: fail(out.error.errors.map((e) => e.message).join(", ")) };
};

// Map service status strings onto HTTP replies
export const fromStatus = (result) =>
  result === "missing" ? fail("Event not found", 404)
  : result === "forbidden" ? fail("Forbidden", 403)
  : ok(result);
