// app/signup/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

import StepForm from "@/ui/auth/signup/StepForm";

export const metadata = { title: "Sign up" };

export default async function SignupPage() {
  const session = await getServerSession(authOptions);

  // 🔒 Redirect logged-in users away from signup
  if (session) redirect("/");

  return (
    <div className="flex text-white min-h-screen items-center justify-center px-4">
      <div>
        <h1 className="mb-6 font-sans text-center text-2xl font-semibold">
          Create your ApiBazar account
        </h1>
        <StepForm />
      </div>
    </div>
  );
}
