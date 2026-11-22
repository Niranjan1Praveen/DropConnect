"use client";
import { SignOutButton } from "@clerk/nextjs";

// Logs the user out of Clerk and sends them back to the landing page
export default function AppLogout() {
  return <SignOutButton redirectUrl="/">Logout</SignOutButton>;
}
