"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { buildTaxPacket } from "@/lib/tax/buildTaxPacket";
import Nav from "@/components/Nav";
import { COLORS } from "@/lib/colors";

type TaxPacket = Awaited<ReturnType<typeof buildTaxPacket>>;

function getTaxYearRange(taxYear: string) {
    const startYear = Number(taxYear.split(" / ")[0]);
    const endYear = startYear + 1;

    return {
        startDate: `${startYear}-04-06`,
        endDate: `${endYear}-04-05`,
        label: `6 April ${startYear} - 5 April ${endYear}`,
        filenameSuffix: `${startYear}-${endYear}`,
    };
}

// UK tax years run 6 April - 5 April. Before 6 April, "today" still falls
// in the tax year that started the previous calendar year.
function getCurrentTaxYearStartYear(date: Date): number {
    const year = date.getFullYear();
    const aprilSixth = new Date(year, 3, 6);

    return date >= aprilSixth ? year : year - 1;
}

function formatTaxYear(startYear: number): string {
    return `${startYear} / ${startYear + 1}`;
}

function getTaxYearOptions(currentStartYear: number, yearsBack: number): string[] {
    return Array.from({ length: yearsBack + 1 }, (_, i) =>
        formatTaxYear(currentStartYear - i)
    );
}

function escapeCsvField(value: string): string {
    if (/[",\n\r]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
}

function downloadTaxPacketCsv(packet: TaxPacket, filenameSuffix: string) {
    const header = ["Date", "Description", "Category", "Amount", "Type", "Linked Invoice"];

    const rows = [...packet.incomeItems, ...packet.expenseItems].map((t) => [
        t.transaction_date,
        t.description ?? "",
        t.category ?? "",
        String(t.amount),
        t.type,
        t.invoice?.file_name ?? "-",
    ]);

    const summary = [
        [],
        ["Summary"],
        ["Total Income", String(packet.totals.income)],
        ["Total Expenses", String(packet.totals.expenses)],
        ["Net Profit", String(packet.totals.profit)],
    ];

    const csv = [header, ...rows, ...summary]
        .map((row) => row.map(escapeCsvField).join(","))
        .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `tax-packet-${filenameSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}



export default function TaxPacketPage() {

    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [packet, setPacket] = useState<TaxPacket | null>(null);
    const [loading, setLoading] = useState(true);


    const currentTaxYearStartYear = useMemo(
        () => getCurrentTaxYearStartYear(new Date()),
        []
    );

    const taxYearOptions = useMemo(
        () => getTaxYearOptions(currentTaxYearStartYear, 4),
        [currentTaxYearStartYear]
    );

    const [taxYear, setTaxYear] = useState(() =>
        formatTaxYear(currentTaxYearStartYear)
    );

    const taxYearRange = useMemo(
        () => getTaxYearRange(taxYear),
        [taxYear]
    );



    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        fetchPacket(user.id, taxYearRange.startDate, taxYearRange.endDate);
    }, [user, authLoading, router, taxYearRange]);




    async function fetchPacket(
        userId: string,
        startDate: string,
        endDate: string
    ) {

        setLoading(true);

        try {
            const result = await buildTaxPacket(userId, startDate, endDate);
            setPacket(result);
        } catch (error) {
            console.error(error);
            setPacket(null);
        } finally {
            setLoading(false);
        }

    }





    const totals = useMemo(() => {

        if (!packet) {
            return {
                revenue: 0,
                expenses: 0,
                profit: 0,
                transactionCount: 0,
            };
        }

        return {
            revenue: packet.totals.income,
            expenses: packet.totals.expenses,
            profit: packet.totals.profit,
            transactionCount:
                packet.incomeItems.length + packet.expenseItems.length,
        };

    }, [packet]);


    const expenseBreakdown = useMemo(() => {

        if (!packet) return [];

        const categories:
            Record<string, number> = {};

        packet.expenseItems.forEach(
            (t) => {

                const category =
                    t.category ||
                    "Uncategorised";

                categories[category] =
                    (
                        categories[category] ||
                        0
                    ) +
                    Number(t.amount);

            }
        );

        return Object.entries(
            categories
        )
        .sort(
            (
                a,
                b
            ) =>
                b[1] -
                a[1]
        );


    }, [packet]);

    const readinessChecks = useMemo(
        () => [
            { text: "Transactions imported", completed: totals.transactionCount > 0 },
            { text: "Expenses categorised", completed: expenseBreakdown.length > 0 },
            { text: "Revenue recorded", completed: totals.revenue > 0 },
        ],
        [totals, expenseBreakdown]
    );

    const readinessPercent = useMemo(() => {
        if (readinessChecks.length === 0) return 0;

        const completedCount = readinessChecks.filter((c) => c.completed).length;

        return Math.round((completedCount / readinessChecks.length) * 100);
    }, [readinessChecks]);



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
                background:COLORS.background,
                minHeight:"100vh",
            }}
        >


            <div
                style={{
                    display:"flex",
                    flexWrap:"wrap",
                    gap:"12px",
                    justifyContent:"space-between",
                    alignItems:"center",
                    marginBottom:24,
                }}
            >

                <div>

                    <h1
                        style={{
                            margin:0,
                            fontSize:32,
                        }}
                    >
                        Prepare Tax Packet
                    </h1>


                    <p
                        style={{
                            color:COLORS.muted,
                            marginTop:8,
                        }}
                    >
                        Organise your financial information for tax filing or your accountant.
                    </p>

                </div>



                <button
                    disabled={!packet}
                    title={!packet ? "Loading your data..." : undefined}
                    onClick={() =>
                        packet && downloadTaxPacketCsv(packet, taxYearRange.filenameSuffix)
                    }
                    style={{
                        background: !packet ? COLORS.border : COLORS.accent,
                        color: !packet ? "#94A3B8" : "white",
                        border:"none",
                        padding:"12px 18px",
                        borderRadius:10,
                        fontWeight:600,
                        cursor: !packet ? "not-allowed" : "pointer",
                    }}
                >
                    Generate Tax Packet
                </button>


            </div>

                        {/* TAX YEAR CARD */}

            <section
                style={{
                    background:"white",
                    padding:20,
                    borderRadius:16,
                    marginBottom:20,
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                }}
            >

                <div>

                    <h3
                        style={{
                            margin:0,
                        }}
                    >
                        Tax Year
                    </h3>


                    <p
                        style={{
                            marginTop:8,
                            color:COLORS.muted,
                        }}
                    >
                        Current financial period:
                        <br />
                        {taxYearRange.label}
                    </p>

                </div>


                <select
                    value={taxYear}
                    onChange={(e) =>
                        setTaxYear(e.target.value)
                    }
                    style={{
                        padding:"10px 14px",
                        borderRadius:10,
                        border:
                            `1px solid ${COLORS.border}`,
                        background:"white",
                    }}
                >

                    {taxYearOptions.map((option) => (
                        <option key={option}>
                            {option}
                        </option>
                    ))}

                </select>


            </section>





            {/* SUMMARY CARDS */}

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">


                <SummaryCard
                    title="Revenue"
                    value={
                        `£${totals.revenue.toFixed(2)}`
                    }
                    colour="#16A34A"
                />


                <SummaryCard
                    title="Expenses"
                    value={
                        `£${totals.expenses.toFixed(2)}`
                    }
                    colour="#DC2626"
                />


                <SummaryCard
                    title="Estimated Profit"
                    value={
                        `£${totals.profit.toFixed(2)}`
                    }
                    colour={
                        totals.profit >= 0
                            ? "#16A34A"
                            : "#DC2626"
                    }
                />


                <SummaryCard
                    title="Transactions"
                    value={
                        totals.transactionCount.toString()
                    }
                    colour={COLORS.accent}
                />


            </section>





            {/* EXPENSE BREAKDOWN */}

            <section
                style={{
                    background:"white",
                    borderRadius:16,
                    padding:20,
                    marginBottom:20,
                }}
            >

                <h3>
                    Expense Breakdown
                </h3>



                {
                    loading ? (

                        <p
                            style={{
                                color:COLORS.muted,
                            }}
                        >
                            Loading expenses...
                        </p>

                    ) : expenseBreakdown.length === 0 ? (

                        <p
                            style={{
                                color:COLORS.muted,
                            }}
                        >
                            No expenses recorded yet.
                        </p>


                    ) : (


                        <table
                            style={{
                                width:"100%",
                                borderCollapse:"collapse",
                                marginTop:16,
                            }}
                        >

                            <thead>

                                <tr
                                    style={{
                                        background:COLORS.background,
                                        textAlign:"left",
                                    }}
                                >

                                    <th
                                        style={thStyle}
                                    >
                                        Category
                                    </th>


                                    <th
                                        style={thStyle}
                                    >
                                        Amount
                                    </th>


                                </tr>

                            </thead>



                            <tbody>


                                {
                                    expenseBreakdown.map(
                                        (
                                            [
                                                category,
                                                amount
                                            ]
                                        ) => (

                                            <tr
                                                key={category}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #F1F5F9",
                                                }}
                                            >

                                                <td
                                                    style={tdStyle}
                                                >
                                                    {category}
                                                </td>


                                                <td
                                                    style={{
                                                        ...tdStyle,
                                                        fontWeight:600,
                                                    }}
                                                >
                                                    £
                                                    {amount.toFixed(2)}
                                                </td>


                                            </tr>

                                        )
                                    )
                                }


                            </tbody>


                        </table>


                    )
                }


            </section>

                        {/* TAX PACKET READINESS */}

            <section
                style={{
                    background:"white",
                    padding:20,
                    borderRadius:16,
                    marginBottom:20,
                }}
            >

                <h3>
                    Tax Packet Readiness
                </h3>


                <p
                    style={{
                        color:COLORS.muted,
                    }}
                >
                    Review your preparation progress before generating your packet.
                </p>



                <div
                    style={{
                        marginTop:20,
                        display:"flex",
                        flexDirection:"column",
                        gap:12,
                    }}
                >

                    {readinessChecks.map((check) => (
                        <ChecklistItem
                            key={check.text}
                            completed={check.completed}
                            text={check.text}
                        />
                    ))}

                    <ChecklistItem
                        placeholder
                        text="Bank statements connected"
                    />


                    <ChecklistItem
                        placeholder
                        text="VAT information added"
                    />


                </div>



                <div
                    style={{
                        marginTop:20,
                        background:"#F1F5F9",
                        height:12,
                        borderRadius:999,
                        overflow:"hidden",
                    }}
                >

                    <div
                        style={{
                            height:"100%",
                            width: `${readinessPercent}%`,
                            background:COLORS.accent,
                            borderRadius:999,
                        }}
                    />

                </div>


                <p
                    style={{
                        fontSize:14,
                        color:COLORS.muted,
                        marginTop:8,
                    }}
                >
                    Estimated completion: {readinessPercent}%
                </p>

                <p
                    style={{
                        fontSize:12,
                        color:"#94A3B8",
                        marginTop:4,
                    }}
                >
                    Bank statement and VAT integrations aren&apos;t built yet, so they&apos;re shown below as placeholders and excluded from this percentage.
                </p>


            </section>





            {/* DOCUMENTS */}

            <section
                style={{
                    background:"white",
                    padding:20,
                    borderRadius:16,
                }}
            >

                <h3>
                    Documents
                </h3>


                <p
                    style={{
                        color:COLORS.muted,
                    }}
                >
                    Supporting documents included in your tax packet.
                </p>



                <div
                    style={{
                        display:"grid",
                        gridTemplateColumns:
                            "repeat(3, 1fr)",
                        gap:16,
                        marginTop:20,
                    }}
                >


                    <DocumentCard
                        title="Invoices"
                        description="Uploaded invoices"
                        value="Coming soon"
                    />


                    <DocumentCard
                        title="Receipts"
                        description="Expense evidence"
                        value="Coming soon"
                    />


                    <DocumentCard
                        title="Bank Statements"
                        description="Financial records"
                        value="Not connected"
                    />


                </div>


            </section>


        </main>
        </>

    );

}






/* =====================
   COMPONENTS
===================== */


function SummaryCard({
    title,
    value,
    colour,
}: {
    title:string;
    value:string;
    colour:string;
}) {

    return (

        <div
            style={{
                background:"white",
                padding:20,
                borderRadius:16,
            }}
        >

            <p
                style={{
                    margin:0,
                    color:COLORS.muted,
                    fontSize:14,
                }}
            >
                {title}
            </p>


            <h2
                style={{
                    marginTop:8,
                    marginBottom:0,
                    color:colour,
                }}
            >
                {value}
            </h2>


        </div>

    );

}





function ChecklistItem({
    completed = false,
    placeholder = false,
    text,
}: {
    completed?:boolean;
    placeholder?:boolean;
    text:string;
}) {

    return (

        <div
            style={{
                display:"flex",
                alignItems:"center",
                gap:12,
            }}
        >

            <div
                style={{
                    width:22,
                    height:22,
                    borderRadius:"50%",
                    display:"flex",
                    justifyContent:"center",
                    alignItems:"center",
                    background:
                        placeholder
                            ? "#F1F5F9"
                            : completed
                            ? "#DCFCE7"
                            : "#FEE2E2",
                    color:
                        placeholder
                            ? "#94A3B8"
                            : completed
                            ? "#16A34A"
                            : "#DC2626",
                    fontSize:12,
                    fontWeight:700,
                }}
            >
                {
                    placeholder
                        ? "•"
                        : completed
                        ? "✓"
                        : "!"
                }

            </div>


            <span style={{ color: placeholder ? "#94A3B8" : undefined }}>
                {text}
                {placeholder ? " (not available yet)" : ""}
            </span>


        </div>

    );

}





function DocumentCard({
    title,
    description,
    value,
}: {
    title:string;
    description:string;
    value:string;
}) {

    return (

        <div
            style={{
                border:
                    `1px solid ${COLORS.border}`,
                padding:16,
                borderRadius:12,
            }}
        >

            <h4
                style={{
                    marginTop:0,
                }}
            >
                {title}
            </h4>


            <p
                style={{
                    color:COLORS.muted,
                    fontSize:14,
                }}
            >
                {description}
            </p>


            <strong>
                {value}
            </strong>


        </div>

    );

}





const thStyle = {

    padding:"14px 16px",

    fontSize:13,

    color:COLORS.muted,

    fontWeight:600,

};



const tdStyle = {

    padding:"14px 16px",

    fontSize:14,

};