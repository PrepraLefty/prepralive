"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";
import { COLORS } from "@/lib/colors";

export default function Reports() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <main style={{ padding: 40 }}>
                Loading...
            </main>
        );
    }

    return (
        <>
        <Nav />
        <main
            style={{
                minHeight: "100vh",
                background: COLORS.background,
                padding: "40px",
            }}
        >

            <div
                style={{
                    background: "white",
                    padding: 60,
                    borderRadius: 16,
                    textAlign: "center",
                }}
            >
                <h1 style={{ marginBottom: 12 }}>Reports</h1>

                <p style={{ color: COLORS.muted, maxWidth: 480, margin: "0 auto" }}>
                    Reports are coming soon. In the meantime, you can find revenue,
                    expense, and profit breakdowns on your{" "}
                    <a href="/dashboard" style={{ color: COLORS.accent, fontWeight: 600 }}>
                        dashboard
                    </a>{" "}
                    and{" "}
                    <a href="/tax/prepare" style={{ color: COLORS.accent, fontWeight: 600 }}>
                        tax prep
                    </a>{" "}
                    pages.
                </p>
            </div>
        </main>
        </>
    );
}
