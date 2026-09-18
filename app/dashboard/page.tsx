"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";

type Profile = {
    business_type: string;
    industry: string;
    goal: string;
};

type Insight = {
    title: string;
    reason: string;
    action: string;
};

type Transaction = {
    id: string;
    amount: number;
    type: "income" | "expense";
    created_at: string;
    transaction_date: string;
    title?: string;
    category?: string | null;
};

type Invoice = {
    id: string;
    amount: number | null;
    created_at: string;
};

export default function Dashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedMonth, setSelectedMonth] = useState<string>(
        String(new Date().getMonth())
    );
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear()
    );
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        async function loadDashboard() {
            try {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("business_type, industry, goal, onboarding_complete")
                    .eq("id", user!.id)
                    .single();

                if (!profileData?.onboarding_complete) {
                    router.push("/onboarding");
                    return;
                }

                setProfile(profileData);

                const { data: txData } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("user_id", user!.id)
                    .order("transaction_date", { ascending: false });

                setTransactions(txData || []);

                const { data: invData } = await supabase
                    .from("invoices")
                    .select("id, amount, created_at")
                    .eq("user_id", user!.id);

                setInvoices(invData || []);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [user, authLoading, router]);

    const filteredTransactions = useMemo(() => {
        if (selectedMonth === "all") return transactions;
        if (selectedMonth === "year") {
            return transactions.filter((t) => {
                const d = new Date(t.transaction_date);
                return d.getFullYear() === selectedYear;
            });
        }

        const month = Number(selectedMonth);

        return transactions.filter((t) => {
            const d = new Date(t.transaction_date);

            return (
                d.getMonth() === month &&
                d.getFullYear() === selectedYear
            );
        });
    }, [transactions, selectedMonth, selectedYear]);

    const availableYears = useMemo(() => {
        const years = transactions.map((t) =>
            new Date(t.transaction_date).getFullYear()
        );

        const uniqueYears = [...new Set(years)];

        if (uniqueYears.length === 0) {
            return [new Date().getFullYear()];
        }

        return uniqueYears.sort((a, b) => b - a);
    }, [transactions]);

    const totalRevenue = useMemo(() => {
        return filteredTransactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + Number(t.amount), 0);
    }, [filteredTransactions]);

    const totalExpenses = useMemo(
        () =>
            filteredTransactions
                .filter((t) => t.type === "expense")
                .reduce((sum, t) => sum + Number(t.amount), 0),
        [filteredTransactions]
    );

    const netProfit = totalRevenue - totalExpenses;

    const outstandingInvoices = useMemo(() => {
        if (selectedMonth === "all") {
            return invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
        }

        if (selectedMonth === ("year" as any)) {
            return invoices
                .filter((i) => {
                    const d = new Date(i.created_at);
                    return d.getFullYear() === selectedYear;
                })
                .reduce((sum, i) => sum + Number(i.amount || 0), 0);
        }

        return invoices
            .filter((i) => {
                const d = new Date(i.created_at);

                return (
                    d.getMonth() === Number(selectedMonth) &&
                    d.getFullYear() === selectedYear
                );
            })
            .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    }, [invoices, selectedMonth, selectedYear]);
    const chartData = useMemo(() => {
        const filtered = filteredTransactions.filter((t) => t.type === "income");

        const grouped: Record<string, number> = {};

        for (const t of filtered) {
            const d = new Date(t.transaction_date);

            // CLEAN display format (fix ugly ISO string)
            const label = d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
            });

            grouped[label] = (grouped[label] || 0) + Number(t.amount);
        }

        return Object.entries(grouped).map(([name, revenue]) => ({
            name,
            revenue,
        }));
    }, [filteredTransactions]);
    useEffect(() => {
        if (!profile) return;

        const timeoutId = setTimeout(() => {
            async function fetchInsights() {
                try {
                    const payload = {
                        profile,
                        revenue: totalRevenue,
                        expenses: totalExpenses,
                        netProfit,
                    };

                    const res = await fetch("/api/insights", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });

                    const data = await res.json();

                    setInsights(
                        typeof data === "string"
                            ? JSON.parse(data)
                            : data || []
                    );
                } catch (e) {
                    console.error(e);
                }
            }

            fetchInsights();
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [profile, totalRevenue, totalExpenses, netProfit]);

    if (authLoading || loading) {
        return (
            <main style={{ padding: 40 }}>
                Loading dashboard...
            </main>
        );
    }

    return (
        <>
        <Nav />
        <main
            style={{
                minHeight: "100vh",
                background: "#F8FBFC",
                padding: "40px",
            }}
        >
            <div
                style={{
                    marginBottom: 30,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <div>
                    <h1>Welcome back</h1>

                    {profile && (
                        <p>
                            {profile.business_type} • {profile.industry}
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <select
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(e.target.value)
                        }
                        style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #E5E7EB",
                            background: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        <option value="all">All time</option>
                        <option value="year">Full year</option>
                        <option value={0}>January</option>
                        <option value={1}>February</option>
                        <option value={2}>March</option>
                        <option value={3}>April</option>
                        <option value={4}>May</option>
                        <option value={5}>June</option>
                        <option value={6}>July</option>
                        <option value={7}>August</option>
                        <option value={8}>September</option>
                        <option value={9}>October</option>
                        <option value={10}>November</option>
                        <option value={11}>December</option>
                    </select>

                    <select
                        value={typeof selectedMonth === "string" && (selectedMonth === "all" || selectedMonth === "year") ? "" : selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        disabled={typeof selectedMonth === "string" && selectedMonth === "all"}
                        style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #E5E7EB",
                            background: "white",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        {selectedMonth === "all" ? (
                            <option value="">-</option>
                        ) : (
                            availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* TOP BUTTONS */}
            <section
                style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "24px",
                }}
            >
                <button
                    onClick={() =>
                        router.push("/transactions/new?type=income")
                    }
                    style={{
                        padding: "12px 18px",
                        borderRadius: "12px",
                        border: "none",
                        background: "#19C7C1",
                        color: "white",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    + Add Revenue
                </button>

                <button
                    onClick={() =>
                        router.push("/transactions/new?type=expense")
                    }
                    style={{
                        padding: "12px 18px",
                        borderRadius: "12px",
                        border: "1px solid #E5E7EB",
                        background: "white",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    + Add Expense
                </button>

                <button
                    onClick={() => router.push("/invoices")}
                    style={{
                        padding: "12px 18px",
                        borderRadius: "12px",
                        border: "1px solid #E5E7EB",
                        background: "white",
                        cursor: "pointer",
                    }}
                >
                    Upload Invoice
                </button>

                <button
                    onClick={() => router.push("/tax/prepare")}
                    style={{
                        marginLeft: "auto",
                        padding: "12px 18px",
                        borderRadius: "12px",
                        border: "none",
                        background: "#19C7C1",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    Prepare Tax Packet
                </button>
            </section>

            {/* KPI GRID */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    ["Total Revenue", `£${totalRevenue.toLocaleString()}`],
                    ["Total Expenses", `£${totalExpenses.toLocaleString()}`],
                    ["Net Profit", `£${netProfit.toLocaleString()}`],
                    [
                        "Outstanding Invoices",
                        `£${outstandingInvoices.toLocaleString()}`
                    ],
                ].map(([title, value]) => (
                    <div
                        key={String(title)}
                        style={{
                            background: "white",
                            padding: 20,
                            borderRadius: 16,
                        }}
                    >
                        <p>{title}</p>
                        <h2>{value}</h2>
                    </div>
                ))}
            </section>

            {/* REVENUE + RECENT ACTIVITY */}
            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: 16,
                    marginTop: 20,
                }}
            >
                <div
                    style={{
                        background: "white",
                        padding: 20,
                        borderRadius: 16,
                        height: 320,
                    }}
                >
                    <h3>Revenue Overview</h3>



                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line dataKey="revenue" stroke="#19C7C1" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* RECENT ACTIVITY STREAMLINED */}
                <div style={{ background: "white", padding: 20, borderRadius: 16 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <h3>Recent Activity</h3>

                        <button
                            onClick={() => router.push("/transactions")}
                            style={{
                                fontSize: 12,
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #E5E7EB",
                                background: "white",
                                cursor: "pointer",
                            }}
                        >
                            Show all transactions
                        </button>
                    </div>

                    {filteredTransactions.slice(0, 5).map((t) => {
                        const isExpense = t.type === "expense";

                        return (
                            <div
                                key={t.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "10px 0",
                                    borderBottom: "1px solid #F1F5F9",
                                }}
                            >
                                <div>
                                    <span style={{ fontWeight: 500 }}>
                                        {t.title ?? (isExpense ? "Expense" : "Income")}
                                    </span>

                                    {/* FIXED: category shown for BOTH income + expense */}
                                    {t.category && (
                                        <span style={{ marginLeft: 8, color: "#6B7280" }}>
                                            • {t.category}
                                        </span>
                                    )}
                                </div>

                                <span
                                    style={{
                                        color: isExpense ? "#DC2626" : "#16A34A",
                                        fontWeight: 600,
                                    }}
                                >
                                    {isExpense ? "-" : "+"}£{t.amount}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* AI INSIGHTS */}
            <section
                style={{
                    marginTop: 20,
                    background: "white",
                    padding: 20,
                    borderRadius: 16,
                }}
            >
                <h3>AI Insights</h3>

                {insights.length ? (
                    insights.map((i) => (
                        <div key={i.title} style={{ marginBottom: 14 }}>
                            <strong>{i.title}</strong>
                            <p>{i.reason}</p>
                            <p>👉 {i.action}</p>
                        </div>
                    ))
                ) : (
                    <p>No insights yet</p>
                )}
            </section>
        </main>
        </>
    );
}