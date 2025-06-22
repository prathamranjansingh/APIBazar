"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Displays:
 *  • Social buttons (Google / GitHub)
 *  • “Magic-link” email field
 *  • Graceful loading / error messages
 */
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<null | "email" | "google" | "github">(
    null
  );
  const [error, setError] = useState<string | null>(null);

  /** Start OAuth flow */
  const handleOAuth = async (provider: "google" | "github") => {
    setPending(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  /** Start email (magic-link) flow */
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending("email");

    // `redirect: false` so we can show feedback first
    const res = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/",
    });

    if (res?.error) {
      setError(res.error);
      setPending(null);
    } else {
      // NextAuth will send the e-mail; show confirmation
      setEmail("");
      alert("Check your inbox for a login link.");
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google button */}
      <OAuthButton
        provider="google"
        text="Continue with Google"
        onClick={() => handleOAuth("google")}
        loading={pending === "google"}
      />

      {/* GitHub button */}
      <OAuthButton
        provider="github"
        text="Continue with GitHub"
        onClick={() => handleOAuth("github")}
        loading={pending === "github"}
      />

      {/* Divider */}
      <div className="relative">
        <hr className="border-neutral-300" />
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-2 text-xs text-neutral-500">
          or magic-link
        </span>
      </div>

      {/* Magic-link form */}
      <form onSubmit={handleEmail} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={pending !== null}
          className="inline-flex w-full items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending === "email" ? "Sending…" : "Send magic link"}
        </button>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

/* ─────────────────────────── helper ─────────────────────────── */

type OAuthButtonProps = {
  provider: "google" | "github";
  text: string;
  loading: boolean;
  onClick: () => void;
};

function OAuthButton({ provider, text, loading, onClick }: OAuthButtonProps) {
  const ProviderIcon =
    provider === "google"
      ? () => (
          <svg className="h-4 w-4" viewBox="0 0 533.5 544.3">
            {/* minimal Google icon path (monochrome) */}
            <path d="M533.5 278.4..." />
          </svg>
        )
      : () => (
          <svg className="h-4 w-4" viewBox="0 0 98 96">
            {/* minimal GitHub icon path (monochrome) */}
            <path d="M49 .5..." />
          </svg>
        );

  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex w-full items-center justify-center space-x-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
    >
      {loading ? (
        <span className="text-sm">Loading…</span>
      ) : (
        <>
          <ProviderIcon />
          <span>{text}</span>
        </>
      )}
    </button>
  );
}
