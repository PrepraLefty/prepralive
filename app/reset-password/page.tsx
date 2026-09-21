"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { COLORS } from "@/lib/colors";

export default function ResetPassword() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function handleSubmit() {
    if (!password.trim() || !confirmPassword.trim()) {
      alert("Enter and confirm your new password");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated");
    router.push("/dashboard");
  }

  if (authLoading || !user) {
    return (
      <main style={{ padding: 40 }}>
        Loading...
      </main>
    );
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
        <p style={{ color: COLORS.muted }}>Choose a new password for your account.</p>

        <input
          placeholder="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "16px",
            marginBottom: "12px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            background: "white",
          }}
        />

        <input
          placeholder="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            background: saving ? "#9ADBD8" : COLORS.accent,
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Update password"}
        </button>
      </div>
    </main>
  );
}
