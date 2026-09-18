"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import { COLORS } from "@/lib/colors";

export default function Onboarding() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);

  const [businessType, setBusinessType] = useState<string | null>(null);
  const [customBusinessType, setCustomBusinessType] = useState("");

  const [industry, setIndustry] = useState<string | null>(null);
  const [customIndustry, setCustomIndustry] = useState("");

  const [goal, setGoal] = useState<string | null>(null);

  const businessOptions = [
    "Sole trader",
    "Self-employed",
    "Limited company",
    "Freelancer",
    "Side hustle",
    "Other",
  ];

  const industryOptions = [
    "Retail",
    "E-commerce",
    "Consulting",
    "Construction",
    "Creative / Design",
    "Tech",
    "Other",
  ];

  // onboarding lock: prevent users re-entering onboarding after completion
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_complete) {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    };

    checkOnboarding();
  }, [user, authLoading, router]);

  async function handleFinish() {
    const finalBusinessType =
      businessType === "Other" ? customBusinessType : businessType;

    const finalIndustry =
      industry === "Other" ? customIndustry : industry;

    if (!finalBusinessType || !finalIndustry || !goal) {
      alert("Please complete all steps");
      return;
    }

    if (businessType === "Other" && !customBusinessType.trim()) {
      alert("Please specify your business type");
      return;
    }

    if (industry === "Other" && !customIndustry.trim()) {
      alert("Please specify your industry");
      return;
    }

    if (!user) {
      alert("Not authenticated");
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      business_type: finalBusinessType,
      industry: finalIndustry,
      goal,
      onboarding_complete: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  if (authLoading || loading) {
    return (
      <main style={{ padding: "40px" }}>
        Loading...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: COLORS.background,
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>Quick setup</h1>
      <p style={{ color: COLORS.muted }}>
        Help PREPRA tailor insights to your business
      </p>

      {/* BUSINESS TYPE */}
      <section style={{ marginTop: "30px" }}>
        <h3>What best describes you?</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {businessOptions.map((item) => (
            <button
              key={item}
              onClick={() => setBusinessType(item)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border:
                  businessType === item
                    ? `2px solid ${COLORS.accent}`
                    : "1px solid #ccc",
                background: businessType === item ? "#E6FFFB" : "white",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {businessType === "Other" && (
          <input
            placeholder="Please specify your business type"
            value={customBusinessType}
            onChange={(e) => setCustomBusinessType(e.target.value)}
            style={{
              marginTop: "12px",
              padding: "10px",
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        )}
      </section>

      {/* INDUSTRY */}
      <section style={{ marginTop: "30px" }}>
        <h3>What industry are you in?</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {industryOptions.map((item) => (
            <button
              key={item}
              onClick={() => setIndustry(item)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border:
                  industry === item
                    ? `2px solid ${COLORS.accent}`
                    : "1px solid #ccc",
                background: industry === item ? "#E6FFFB" : "white",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {industry === "Other" && (
          <input
            placeholder="Please specify your industry"
            value={customIndustry}
            onChange={(e) => setCustomIndustry(e.target.value)}
            style={{
              marginTop: "12px",
              padding: "10px",
              width: "100%",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        )}
      </section>

      {/* GOAL */}
      <section style={{ marginTop: "30px" }}>
        <h3>What is your main goal with PREPRA?</h3>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            "Track income & expenses",
            "Understand profit",
            "Tax preparation",
            "Cashflow clarity",
            "General business overview",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setGoal(item)}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border:
                  goal === item ? `2px solid ${COLORS.accent}` : "1px solid #ccc",
                background: goal === item ? "#E6FFFB" : "white",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* FINISH */}
      <button
        onClick={handleFinish}
        style={{
          marginTop: "40px",
          width: "100%",
          padding: "14px",
          background: COLORS.accent,
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Finish setup
      </button>
    </main>
  );
}