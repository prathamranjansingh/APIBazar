import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/ui/auth/login/LoginForm";

/** If the user is already authenticated, bounce them away. */
export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/"); // or "/dashboard"

  return (
    <div className="flex text-white min-h-screen items-center justify-center bg-[#0F0F0F] px-4">
      {/* Your brand / logo etc. */}
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Sign in to {process.env.NEXT_PUBLIC_APP_NAME}
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
