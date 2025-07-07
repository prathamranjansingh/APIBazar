"use client";

import { FormEvent, useState } from "react";
import { sendOtpAction } from "@/lib/send-top";
import { verifyOtpAction } from "@/lib/verify-otp";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

import { Button, GoogleLogo, GithubLogo, Input } from "@apibazar/ui";

type ActionResult<T> =
  | { data: T }
  | { fieldErrors: Record<string, string[]> }
  | { validationErrors: unknown }
  | { serverError: string };

export default function StepForm() {
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ─────────────── Handle Send OTP ─────────────── */
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = (await sendOtpAction({ email })) as ActionResult<true>;

      if ("serverError" in res) {
        toast.error(res.serverError);
        return;
      }

      if ("fieldErrors" in res && res.fieldErrors.email?.[0]) {
        toast.error(res.fieldErrors.email[0]);
        return;
      }

      toast.success("OTP sent! Check your inbox.");
      setStep("verify");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  /* ─────────────── Handle OTP Verification ─────────────── */
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = (await verifyOtpAction({
        email,
        code,
        password,
      })) as ActionResult<true>;

      if ("serverError" in res) {
        toast.error(res.serverError);
        return;
      }

      if ("fieldErrors" in res) {
        const firstError =
          res.fieldErrors.code?.[0] ||
          res.fieldErrors.password?.[0] ||
          "Invalid input. Please check again.";
        toast.error(firstError);
        return;
      }

      toast.success("🎉 Account created! You can log in now.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-auto mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
      <div className="max-w-full p-6 text-white bg-[#171717] border border-subtle rounded-md mx-2 px-4 py-10 sm:px-10">
        {/* ─────── Social Login Buttons ─────── */}
        <div className="space-y-3 mb-8">
          <Button
            onClick={() => signIn("google")}
            className="w-full border bg-white hover:bg-gray-200 border-white py-2 font-medium text-black"
            disabled={loading}
          >
            <GoogleLogo />
            Continue with Google
          </Button>
          <Button
            onClick={() => signIn("github")}
            className="w-full border bg-white hover:bg-gray-200 border-white py-2 font-medium text-black"
            disabled={loading}
          >
            <GithubLogo />
            Continue with GitHub
          </Button>
        </div>

        {/* ─────── Divider ─────── */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-subtle" />
          <span className="mx-2 text-sm text-gray-500">or</span>
          <hr className="flex-grow border-subtle" />
        </div>

        {/* ─────── Email Step ─────── */}
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                className="w-full border px-3 py-2 mt-1"
                placeholder="you@work.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-2 text-white"
              disabled={!email || loading}
            >
              {loading ? "Sending..." : "Sign Up"}
            </Button>
          </form>
        ) : (
          /* ─────── Verify Step ─────── */
          <form onSubmit={handleVerify} className="space-y-4">
            <h1 className="text-xl font-semibold">Verify E-mail</h1>

            <div>
              <label htmlFor="code" className="block text-sm font-semibold">
                OTP Code
              </label>
              <Input
                id="code"
                inputMode="numeric"
                pattern="\d{6}"
                required
                maxLength={6}
                className="w-full rounded border px-3 py-2 font-mono tracking-[0.25em] mt-1"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                className="w-full rounded border px-3 py-2 mt-1"
                placeholder="Create password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
              disabled={code.length !== 6 || password.length < 8 || loading}
            >
              {loading ? "Verifying..." : "Verify & Sign Up"}
            </Button>
          </form>
        )}
      </div>

      {/* ─────── Link to Sign In ─────── */}
      <div className="mt-6 text-center text-sm cursor-pointer text-gray-300 hover:underline">
        <Link href="/signup">Already have an account?</Link>
      </div>
    </div>
  );
}
