import { col } from "@/lib/db/mongo";
import { toPlain } from "@/lib/db/serialize";

const ROLES = ["VOLUNTEER", "ORGANIZATION", "CORPORATE"];

export const findUser = async (id) => toPlain(await (await col("users")).findOne({ _id: id }));

// First login creates the user (Volunteer by default). Clicking "Register as X" passes
// a role hint, which switches an existing account to that role; plain logins keep it.
export async function ensureUser(profile, roleHint) {
  const picked = ROLES.includes(roleHint?.toUpperCase()) ? roleHint.toUpperCase() : null;
  const { _id, ...fields } = profile;
  await (await col("users")).updateOne(
    { _id },
    {
      $set: { ...fields, lastLoginAt: new Date(), ...(picked && { role: picked }) },
      $setOnInsert: { createdAt: new Date(), ...(!picked && { role: "VOLUNTEER" }) },
    },
    { upsert: true }
  );
  return findUser(_id);
}
