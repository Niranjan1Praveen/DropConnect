"use client";

import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";

// Signed-in visitors skip Clerk's modal (it refuses to open for them anyway)
// and go straight to their role's dashboard; everyone else gets the modal.
export default function AuthGate({ mode = "signIn", redirect = "/api/auth/creation", signedInLabel, children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <a href="/api/auth/creation">{signedInLabel ?? children}</a>;
  }
  return mode === "signUp" ? (
    <SignUpButton mode="modal" forceRedirectUrl={redirect} signInForceRedirectUrl={redirect}>{children}</SignUpButton>
  ) : (
    <SignInButton mode="modal" forceRedirectUrl={redirect}>{children}</SignInButton>
  );
}
