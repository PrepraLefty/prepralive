"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";
import { COLORS } from "@/lib/colors";

type Transaction = {
    id: string;
    user_id: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    description: string | null;
    transaction_date: string;
    source: string | null;
    created_at: string;
};

export default function TransactionsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sort, setSort] = useState("newest");

    const [currentPage, setCurrentPage] = useState(1);

    const transactionsPerPage = 20;


    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        fetchTransactions(user.id);
    }, [user, authLoading, router]);


    async function fetchTransactions(userId: string) {
        setLoading(true);

        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("transaction_date", {
                ascending: false,
            });


        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }


        setTransactions(data || []);
        setLoading(false);
    }



    const categories = useMemo(() => {
        const values = transactions
            .map((t) => t.category)
            .filter(Boolean) as string[];

        return Array.from(new Set(values));
    }, [transactions]);



    const filteredTransactions = useMemo(() => {

        let filtered = [...transactions];


        if (search) {
            filtered = filtered.filter((transaction) =>
                transaction.description
                    ?.toLowerCase()
                    .includes(search.toLowerCase())
            );
        }


        if (typeFilter !== "all") {
            filtered = filtered.filter(
                (transaction) =>
                    transaction.type === typeFilter
            );
        }


        if (categoryFilter !== "all") {
            filtered = filtered.filter(
                (transaction) =>
                    transaction.category === categoryFilter
            );
        }



        filtered.sort((a, b) => {

            if (sort === "oldest") {
                return (
                    new Date(a.transaction_date).getTime() -
                    new Date(b.transaction_date).getTime()
                );
            }


            if (sort === "highest") {
                return b.amount - a.amount;
            }


            if (sort === "lowest") {
                return a.amount - b.amount;
            }


            return (
                new Date(b.transaction_date).getTime() -
                new Date(a.transaction_date).getTime()
            );

        });


        return filtered;

    }, [
        transactions,
        search,
        typeFilter,
        categoryFilter,
        sort,
    ]);



    const totals = useMemo(() => {

        const income = filteredTransactions
            .filter((t) => t.type === "income")
            .reduce(
                (sum, t) => sum + Number(t.amount),
                0
            );


        const expenses = filteredTransactions
            .filter((t) => t.type === "expense")
            .reduce(
                (sum, t) => sum + Number(t.amount),
                0
            );


        return {
            income,
            expenses,
            profit: income - expenses,
            count: filteredTransactions.length,
        };


    }, [filteredTransactions]);



    const totalPages = Math.ceil(
        filteredTransactions.length /
            transactionsPerPage
    );


    const paginatedTransactions =
        filteredTransactions.slice(
            (currentPage - 1) * transactionsPerPage,
            currentPage * transactionsPerPage
        );



    if (authLoading || !user) {
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
                padding: 32,
                background: COLORS.background,
                minHeight: "100vh",
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >

                <div>
                    <h1
                        style={{
                            fontSize: 32,
                            margin: 0,
                        }}
                    >
                        Transactions
                    </h1>

                    <p
                        style={{
                            color: COLORS.muted,
                            marginTop: 8,
                        }}
                    >
                        View and manage all your business transactions.
                    </p>
                </div>


                <button
                    onClick={() => router.push("/transactions/new")}
                    style={{
                        background: COLORS.accent,
                        color: "white",
                        border: "none",
                        padding: "12px 18px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    + Add Transaction
                </button>

            </div>

                        {/* KPI CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                <KpiCard
                    title="Total Income"
                    value={`£${totals.income.toFixed(2)}`}
                    colour="#16A34A"
                />

                <KpiCard
                    title="Total Expenses"
                    value={`£${totals.expenses.toFixed(2)}`}
                    colour="#DC2626"
                />

                <KpiCard
                    title="Net Profit"
                    value={`£${totals.profit.toFixed(2)}`}
                    colour={
                        totals.profit >= 0
                            ? "#16A34A"
                            : "#DC2626"
                    }
                />

                <KpiCard
                    title="Transactions"
                    value={totals.count.toString()}
                    colour={COLORS.accent}
                />

            </section>



            {/* FILTER BAR */}
            <section
                style={{
                    background: "white",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 20,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >

                <input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{
                        flex: 1,
                        minWidth: 220,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border:
                            "1px solid #E5E7EB",
                    }}
                />


                <select
                    value={typeFilter}
                    onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={selectStyle}
                >
                    <option value="all">
                        All Types
                    </option>

                    <option value="income">
                        Income
                    </option>

                    <option value="expense">
                        Expenses
                    </option>

                </select>



                <select
                    value={categoryFilter}
                    onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={selectStyle}
                >

                    <option value="all">
                        All Categories
                    </option>

                    {categories.map((category) => (
                        <option
                            key={category}
                            value={category}
                        >
                            {category}
                        </option>
                    ))}

                </select>



                <select
                    value={sort}
                    onChange={(e) =>
                        setSort(e.target.value)
                    }
                    style={selectStyle}
                >

                    <option value="newest">
                        Newest First
                    </option>

                    <option value="oldest">
                        Oldest First
                    </option>

                    <option value="highest">
                        Highest Amount
                    </option>

                    <option value="lowest">
                        Lowest Amount
                    </option>

                </select>


            </section>




            {/* TRANSACTION TABLE */}

            <section
                style={{
                    background: "white",
                    borderRadius: 16,
                    overflow: "hidden",
                }}
            >

                {loading ? (

                    <div
                        style={{
                            padding: 40,
                            textAlign: "center",
                            color: COLORS.muted,
                        }}
                    >
                        Loading transactions...
                    </div>


                ) : paginatedTransactions.length === 0 ? (

                    <div
                        style={{
                            padding: 50,
                            textAlign: "center",
                        }}
                    >

                        <h3>
                            No transactions found
                        </h3>

                        <p
                            style={{
                                color: COLORS.muted,
                            }}
                        >
                            Add transactions or adjust your filters.
                        </p>

                    </div>


                ) : (

                    <div className="overflow-x-auto">

                    <table
                        style={{
                            width: "100%",
                            borderCollapse:
                                "collapse",
                        }}
                    >

                        <thead>

                            <tr
                                style={{
                                    background:
                                        COLORS.background,
                                    textAlign:
                                        "left",
                                }}
                            >

                                <th style={thStyle}>
                                    Date
                                </th>

                                <th style={thStyle}>
                                    Description
                                </th>

                                <th style={thStyle}>
                                    Category
                                </th>

                                <th className="hidden md:table-cell" style={thStyle}>
                                    Type
                                </th>

                                <th className="hidden md:table-cell" style={thStyle}>
                                    Source
                                </th>

                                <th style={thStyle}>
                                    Amount
                                </th>

                            </tr>

                        </thead>



                        <tbody>

                            {paginatedTransactions.map(
                                (transaction) => {

                                    const isExpense =
                                        transaction.type ===
                                        "expense";


                                    return (

                                        <tr
                                            key={
                                                transaction.id
                                            }
                                            style={{
                                                borderBottom:
                                                    "1px solid #F1F5F9",
                                            }}
                                        >

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {new Date(
                                                    transaction.transaction_date
                                                ).toLocaleDateString()}
                                            </td>



                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {
                                                    transaction.description ||
                                                    "No description"
                                                }

                                            </td>



                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {
                                                    transaction.category ||
                                                    "-"
                                                }

                                            </td>



                                            <td
                                                className="hidden md:table-cell"
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                <span
                                                    style={{
                                                        background:
                                                            isExpense
                                                                ? "#FEE2E2"
                                                                : "#DCFCE7",
                                                        color:
                                                            isExpense
                                                                ? "#DC2626"
                                                                : "#16A34A",
                                                        padding:
                                                            "4px 10px",
                                                        borderRadius:
                                                            999,
                                                        fontSize:
                                                            12,
                                                        fontWeight:
                                                            600,
                                                    }}
                                                >

                                                    {
                                                        transaction.type
                                                    }

                                                </span>

                                            </td>



                                            <td
                                                className="hidden md:table-cell"
                                                style={
                                                    tdStyle
                                                }
                                            >

                                                {
                                                    transaction.source ||
                                                    "-"
                                                }

                                            </td>



                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    fontWeight:
                                                        600,
                                                    color:
                                                        isExpense
                                                            ? "#DC2626"
                                                            : "#16A34A",
                                                }}
                                            >

                                                {
                                                    isExpense
                                                        ? "-"
                                                        : "+"
                                                }

                                                £
                                                {Number(
                                                    transaction.amount
                                                ).toFixed(2)}

                                            </td>


                                        </tr>

                                    );

                                }
                            )}

                        </tbody>

                    </table>

                    </div>

                )}

            </section>

                        {/* PAGINATION */}

            {totalPages > 1 && (

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 24,
                    }}
                >

                    <button
                        disabled={currentPage === 1}
                        onClick={() =>
                            setCurrentPage(
                                (prev) => prev - 1
                            )
                        }
                        style={paginationButtonStyle}
                    >
                        ← Previous
                    </button>


                    <span
                        style={{
                            color: COLORS.muted,
                            fontSize: 14,
                        }}
                    >
                        Page {currentPage} of {totalPages}
                    </span>


                    <button
                        disabled={
                            currentPage === totalPages
                        }
                        onClick={() =>
                            setCurrentPage(
                                (prev) => prev + 1
                            )
                        }
                        style={paginationButtonStyle}
                    >
                        Next →
                    </button>

                </div>

            )}

        </main>
        </>
    );
}




/* =========================
   COMPONENTS
========================= */


function KpiCard({
    title,
    value,
    colour,
}: {
    title: string;
    value: string;
    colour: string;
}) {

    return (

        <div
            style={{
                background: "white",
                padding: 20,
                borderRadius: 16,
            }}
        >

            <p
                style={{
                    margin: 0,
                    color: COLORS.muted,
                    fontSize: 14,
                }}
            >
                {title}
            </p>


            <h2
                style={{
                    marginTop: 8,
                    marginBottom: 0,
                    color: colour,
                    fontSize: 26,
                }}
            >
                {value}
            </h2>

        </div>

    );

}




/* =========================
   STYLES
========================= */


const thStyle = {

    padding: "14px 16px",

    fontSize: 13,

    color: COLORS.muted,

    fontWeight: 600,

};


const tdStyle = {

    padding: "16px",

    fontSize: 14,

};



const selectStyle = {

    padding: "10px 14px",

    borderRadius: 10,

    border:
        "1px solid #E5E7EB",

    background: "white",

    cursor: "pointer",

};



const paginationButtonStyle = {

    padding: "8px 14px",

    borderRadius: 8,

    border:
        "1px solid #E5E7EB",

    background: "white",

    cursor: "pointer",

};