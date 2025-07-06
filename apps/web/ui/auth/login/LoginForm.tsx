"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@apibazar/ui";
import { Input } from "@apibazar/ui";
import { GoogleLogo } from "@apibazar/ui";
import { GithubLogo } from "@apibazar/ui";
import Link from "next/link";
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
    <main className="mb-auto mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
      <div className="max-w-full p-6 text-white bg-[#171717] border border-subtle rounded-md mx-2 px-4 py-10 sm:px-10">
        <div className="space-y-3 mb-8">
          <Button
            onClick={() => signIn("google")}
            className="w-full border bg-white hover:bg-gray-200 border-white py-2 font-medium"
          >
            <GoogleLogo></GoogleLogo>
            Sign in with Google
          </Button>
          <Button
            className="w-full border bg-white  hover:bg-gray-200 border-[white py-2 font-medium"
            onClick={() => signIn("github")}
          >
            <GithubLogo></GithubLogo>
            Sign in with GitHub
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-subtle" />
          <span className="mx-2 text-sm text-gray-500">or</span>
          <hr className="flex-grow border-subtle" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCredentials} className="space-y-4">
          <Input
            required
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            required
            type="password"
            placeholder="Password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
          />
          <Button
            type="submit"
            disabled={busy}
            className="w-full text-white py-2 font-medium disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {/* Magic Link */}
        <p className="mt-6 text-sm font-medium">Prefer a one-time link?</p>
        <form onSubmit={handleMagic} className="flex gap-2 mt-2">
          <Input
            required
            type="email"
            placeholder="Work e-mail"
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
          />
          <Button
            type="submit"
            disabled={busy}
            className="text-white px-4 font-medium disabled:opacity-50"
          >
            Send
          </Button>
        </form>

        {/* Error Message */}
        {error && (
          <p className="mt-4 text-red-600 text-sm">
            {messages[error] ?? "Something went wrong."}
          </p>
        )}
      </div>
      <div className="mt-6 text-center text-sm cursor-pointer">
        <Link href="/signup"> Don't have an account? </Link>
      </div>
    </main>
  );
}
