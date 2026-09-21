"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/colors";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      alert("Enter email and password");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (!user) {
      alert("Login failed");
      return;
    }

    // Check if user already completed onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
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

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "12px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            background: "white",
          }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            background: "white",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px",
            background: COLORS.accent,
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          Log In
        </button>

        <p style={{ marginTop: "16px" }}>
          <Link href="/forgot-password" style={{ color: COLORS.muted, fontSize: 14 }}>
            Forgot password?
          </Link>
        </p>

        <p style={{ marginTop: "12px" }}>
          New here? <Link href="/signup">Create account</Link>
        </p>
      </div>
    </main>
  );
}