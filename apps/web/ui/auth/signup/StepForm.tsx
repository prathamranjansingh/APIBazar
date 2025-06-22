"use client";

import { FormEvent, useState } from "react";
import { sendOtpAction } from "@/lib/send-top";
import { verifyOtpAction } from "@/lib/verify-otp";

/** Matches next-safe-action result union */
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
  const [status, setStatus] = useState<string | null>(null);

  /* ─────────────── send OTP ─────────────── */
  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    const res = (await sendOtpAction({ email })) as ActionResult<true>;

    if ("serverError" in res) setStatus(res.serverError);
    else if ("fieldErrors" in res && res.fieldErrors.email?.[0])
      setStatus(res.fieldErrors.email[0]);
    else {
      setStep("verify"); // success
      setStatus("OTP sent! Check your inbox.");
    }
  }

  /* ───────────── verify OTP ─────────────── */
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setStatus(null);

    const res = (await verifyOtpAction({
      email,
      code,
      password,
    })) as ActionResult<true>;

    if ("serverError" in res) setStatus(res.serverError);
    else if ("fieldErrors" in res) {
      const first =
        res.fieldErrors.code?.[0] ||
        res.fieldErrors.password?.[0] ||
        "Check your input";
      setStatus(first);
    } else {
      setStatus("🎉 Account created! You can log in now.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      {step === "email" ? (
        /* 1️⃣ email form */
        <form onSubmit={handleSendOtp} className="space-y-3">
          <h1 className="text-xl font-semibold">Create account</h1>

          <input
            type="email"
            required
            className="w-full rounded border px-3 py-2"
            placeholder="you@work.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
            disabled={!email}
          >
            Send OTP
          </button>

          {status && <p className="text-sm text-red-600">{status}</p>}
        </form>
      ) : (
        /* 2️⃣ OTP + password form */
        <form onSubmit={handleVerify} className="space-y-3">
          <h1 className="text-xl font-semibold">Verify e-mail</h1>

          <input
            inputMode="numeric"
            pattern="\d{6}"
            required
            maxLength={6}
            className="w-full rounded border px-3 py-2 font-mono tracking-[0.25em]"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <input
            type="password"
            required
            className="w-full rounded border px-3 py-2"
            placeholder="Create password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
            disabled={code.length !== 6 || password.length < 8}
          >
            Verify & Sign up
          </button>

          {status && <p className="text-sm text-red-600">{status}</p>}
        </form>
      )}
    </div>
  );
}
