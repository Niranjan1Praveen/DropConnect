import { col } from "@/lib/db/mongo";
import { toPlainList, toPlain } from "@/lib/db/serialize";

export const listVolunteers = async () =>
  toPlainList(await (await col("volunteers")).find({}).toArray());

export const getVolunteer = async (userId) =>
  toPlain(await (await col("volunteers")).findOne({ userId }));

// Group the flat form into nested sub-documents; anything unknown lands in `extra`
function shape(form) {
  const { homeStreet, homeCity, homeState, postalCode, homeCountry, skills, id, userId, ...rest } = form;
  if (rest.dateOfBirth) rest.dateOfBirth = new Date(rest.dateOfBirth);
  return {
    ...rest,
    address: { street: homeStreet, city: homeCity, state: homeState, postalCode, country: homeCountry || "India" },
    skills: Array.isArray(skills) ? skills : [],
  };
}

// Flatten back so the existing form can pre-fill its fields
export function flatten(doc) {
  if (!doc) return null;
  const { address = {}, ...rest } = doc;
  return {
    ...rest,
    homeStreet: address.street, homeCity: address.city, homeState: address.state,
    postalCode: address.postalCode, homeCountry: address.country,
  };
}

// One profile per user: create it the first time, update it afterwards
export async function saveVolunteer(userId, form) {
  const now = new Date();
  const doc = await (await col("volunteers")).findOneAndUpdate(
    { userId },
    { $set: { ...shape(form), updatedAt: now }, $setOnInsert: { userId, createdAt: now } },
    { upsert: true, returnDocument: "after" }
  );
  return toPlain(doc);
}
