"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@apibazar/ui";

const messages: Record<string, string> = {
  "invalid-credentials": "Incorrect e-mail or password.",
  "no-credentials": "Please enter e-mail and password.",
  "email-not-verified": "Check your inbox to verify your e-mail first.",
  "exceeded-login-attempts":
    "Your account is locked due to too many failed log-ins.",
  "too-many-login-attempts": "Too many attempts. Try again in a minute.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [magicEmail, setMagicEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await signIn("credentials", {
      email,
      password: pwd,
      redirect: false,
      callbackUrl: "/",
    });
    setBusy(false);
    if (res?.error) router.push(`/login?error=${res.error}`);
    else if (res?.url) router.push(res.url);
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await signIn("email", { email: magicEmail, callbackUrl: "/" });
  }

  return (
    <main className="max-w-md mx-auto p-6 text-white bg-[#171717] border-subtle rounded-md border px-4 py-10 sm:px-10">
      {/* OAuth Providers */}
      <div className="space-y-3 mb-8">
        <button
          onClick={() => signIn("google")}
          className="w-full border rounded py-2 font-medium hover:bg-gray-900"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("github")}
          className="w-full border rounded py-2 font-medium hover:bg-gray-50"
        >
          Continue with GitHub
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-2 text-sm text-gray-500">or</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleCredentials} className="space-y-4">
        <input
          required
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-4 py-2"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          className="w-full border rounded px-4 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full text-white rounded py-2 font-medium disabled:opacity-50"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Magic Link */}
      <p className="mt-6 text-sm font-medium">Prefer a one-time link?</p>
      <form onSubmit={handleMagic} className="flex gap-2 mt-2">
        <input
          required
          type="email"
          placeholder="Work e-mail"
          value={magicEmail}
          onChange={(e) => setMagicEmail(e.target.value)}
          className="flex-grow border rounded px-4 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white rounded px-4 font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <p className="mt-4 text-red-600 text-sm">
          {messages[error] ?? "Something went wrong."}
        </p>
      )}
    </main>
  );
}
