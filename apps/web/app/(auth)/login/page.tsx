import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/ui/auth/login/LoginForm";

/** If the user is already authenticated, bounce them away. */
export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/"); // or "/dashboard"

  return (
    <div className="flex text-white min-h-screen items-center justify-center px-4">
      <div>
        <h1 className="mb-6 font-sans text-center text-2xl font-semibold">
          Welcome back
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
