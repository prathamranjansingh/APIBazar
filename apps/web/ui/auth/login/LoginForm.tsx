"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Input, GoogleLogo, GithubLogo } from "@apibazar/ui";
import Link from "next/link";
import { toast } from "sonner";
import clsx from "clsx";

const messages: Record<string, string> = {
  "invalid-credentials": "Incorrect e-mail or password.",
  "no-credentials": "Please enter e-mail and password.",
  "email-not-verified": "Check your inbox to verify your e-mail first.",
  "exceeded-login-attempts":
    "Your account is locked due to too many failed log-ins.",
  "too-many-login-attempts": "Too many attempts. Try again in a minute.",
};

const TAB = {
  PASSWORD: "password",
  MAGIC: "magic",
} as const;

export default function LoginPage() {
  const [tab, setTab] = useState<(typeof TAB)[keyof typeof TAB]>(TAB.PASSWORD);
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
    try {
      const res = await signIn("credentials", {
        email,
        password: pwd,
        redirect: false,
        callbackUrl: "/",
      });

      if (res?.error) {
        router.push(`/login?error=${res.error}`);
        toast.error(messages[res.error] ?? "Login failed");
      } else if (res?.url) {
        toast.success("Signed in successfully!");
        router.push(res.url);
      }
    } catch {
      toast.error("Unexpected error during sign-in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await signIn("email", {
        email,
        callbackUrl: "/",
        redirect: false,
      });

      if (res?.error) {
        toast.error("Failed to send magic link.");
      } else {
        toast.success("Magic link sent! Check your inbox.");
      }
    } catch {
      toast.error("Something went wrong while sending the magic link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mb-auto mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
      <div className="max-w-full p-6 text-white bg-[#171717] border border-subtle rounded-md mx-2 px-4 py-10 sm:px-10">
        {/* Social Logins */}
        <div className="space-y-3 mb-8">
          <Button
            onClick={() => signIn("google")}
            className="w-full border bg-white hover:bg-gray-200 border-white py-2 font-medium"
          >
            <GoogleLogo />
            Sign in with Google
          </Button>
          <Button
            onClick={() => signIn("github")}
            className="w-full border bg-white hover:bg-gray-200 border-white py-2 font-medium"
          >
            <GithubLogo />
            Sign in with GitHub
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-subtle" />
          <span className="mx-2 text-sm text-gray-500">or</span>
          <hr className="flex-grow border-subtle" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-subtle mb-6">
          <button
            onClick={() => setTab(TAB.PASSWORD)}
            className={clsx(
              "flex-1 py-2 text-sm font-medium",
              tab === TAB.PASSWORD
                ? "text-white border-b-2 border-white"
                : "text-gray-400"
            )}
          >
            Email & Password
          </button>
          <button
            onClick={() => setTab(TAB.MAGIC)}
            className={clsx(
              "flex-1 py-2 text-sm font-medium",
              tab === TAB.MAGIC
                ? "text-white border-b-2 border-white"
                : "text-gray-400"
            )}
          >
            Magic Link
          </button>
        </div>

        {/* Tab Content */}
        {tab === TAB.PASSWORD && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <Input
              required
              type="email"
              placeholder="Email"
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
        )}

        {tab === TAB.MAGIC && (
          <form onSubmit={handleMagic} className="space-y-4">
            <Input
              required
              type="email"
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              disabled={busy}
              className="w-full text-white py-2 font-medium disabled:opacity-50"
            >
              {busy ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center text-gray-300 text-sm cursor-pointer hover:text-white">
        <Link href="/signup">Don't have an account?</Link>
      </div>
    </main>
  );
}
