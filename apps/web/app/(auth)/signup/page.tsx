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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <StepForm />
    </main>
  );
}
