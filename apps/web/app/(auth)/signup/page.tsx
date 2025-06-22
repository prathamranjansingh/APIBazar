import StepForm from "@/ui/auth/signup/StepForm";
import dynamic from "next/dynamic";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <StepForm />
    </main>
  );
}
