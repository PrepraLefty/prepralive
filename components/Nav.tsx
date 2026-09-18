"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { COLORS } from "@/lib/colors";

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/transactions", label: "Transactions" },
    { href: "/tax/prepare", label: "Tax Prepare" },
    { href: "/invoices", label: "Invoices" },
];

export default function Nav() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/login");
    }

    return (
        <nav
            style={{
                background: "white",
                borderBottom: "1px solid #E5E7EB",
                padding: "16px 24px",
            }}
        >
            <div
                className="flex-col sm:flex-row"
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <Link
                    href="/dashboard"
                    style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: "#0F172A",
                        textDecoration: "none",
                    }}
                >
                    PREPRA
                </Link>

                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    {links.map((link) => {
                        const isActive =
                            pathname === link.href ||
                            pathname.startsWith(`${link.href}/`);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                style={{
                                    fontWeight: 600,
                                    fontSize: 14,
                                    textDecoration: "none",
                                    color: isActive ? COLORS.accent : COLORS.muted,
                                }}
                            >
                                {link.label}
                            </Link>
                        );
                    })}

                    <button
                        onClick={handleLogout}
                        style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: COLORS.muted,
                            background: "none",
                            border: "1px solid #E5E7EB",
                            borderRadius: 8,
                            padding: "6px 12px",
                            cursor: "pointer",
                        }}
                    >
                        Log out
                    </button>
                </div>
            </div>
        </nav>
    );
}
