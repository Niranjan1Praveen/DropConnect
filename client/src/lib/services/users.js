import { col } from "@/lib/db/mongo";
import { toPlain } from "@/lib/db/serialize";

const ROLES = ["VOLUNTEER", "ORGANIZATION", "CORPORATE"];

export const findUser = async (id) => toPlain(await (await col("users")).findOne({ _id: id }));

// First login creates the user; later logins refresh the profile and keep the role
export async function ensureUser(profile, roleHint) {
  const role = ROLES.includes(roleHint?.toUpperCase()) ? roleHint.toUpperCase() : "VOLUNTEER";
  const { _id, ...fields } = profile;
  await (await col("users")).updateOne(
    { _id },
    { $set: { ...fields, lastLoginAt: new Date() }, $setOnInsert: { role, createdAt: new Date() } },
    { upsert: true }
  );
  return findUser(_id);
}
