"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/colors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      alert("Enter your email");
      return;
    }

    setSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
        "/reset-password"
      )}`,
    });

    setSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <main
      className="px-4"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: COLORS.background,
      }}
    >
      <div
        className="w-full max-w-[380px]"
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1>PREPRA</h1>
        <p>Bookkeeping and tax prep for small businesses</p>

        {sent ? (
          <p style={{ marginTop: "20px", color: COLORS.muted }}>
            If an account exists for that email, we&apos;ve sent a link to reset your password.
          </p>
        ) : (
          <>
            <p style={{ marginTop: "20px", color: COLORS.muted }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "16px",
                marginBottom: "20px",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                background: "white",
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={sending}
              style={{
                width: "100%",
                padding: "14px",
                background: sending ? "#9ADBD8" : COLORS.accent,
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: sending ? "not-allowed" : "pointer",
              }}
            >
              {sending ? "Sending..." : "Send reset link"}
            </button>
          </>
        )}

        <p style={{ marginTop: "20px" }}>
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
