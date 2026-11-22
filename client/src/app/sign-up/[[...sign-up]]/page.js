import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <SignUp forceRedirectUrl="/api/auth/creation" />
    </div>
  );
}
