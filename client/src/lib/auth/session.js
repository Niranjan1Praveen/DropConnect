import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Returns the signed-in Clerk user id, or null when nobody is logged in
export async function getUserId() {
  const { userId } = await auth();
  return userId;
}

// Page guard: bounce visitors to the sign-in page
export async function requirePageUser() {
  const userId = await getUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}

// Clerk profile mapped to the shape we store in Mongo
export async function getClerkProfile() {
  const u = await currentUser();
  if (!u) return null;
  return {
    _id: u.id,
    email: u.primaryEmailAddress?.emailAddress ?? "",
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    profileImage: u.imageUrl ?? `https://avatar.vercel.sh/${u.firstName}`,
  };
}
