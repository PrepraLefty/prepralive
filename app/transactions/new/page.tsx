"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";
import { COLORS } from "@/lib/colors";

type InvoiceOption = {
  id: string;
  file_name: string;
  amount: number | null;
};

export default function NewTransaction() {

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  const [invoiceId, setInvoiceId] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    supabase
      .from("invoices")
      .select("id, file_name, amount")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setInvoices(data || []));
  }, [user, authLoading, router]);


  const today = new Date()
    .toISOString()
    .split("T")[0];


  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(today);
  const [source, setSource] = useState("manual");

  const [saving, setSaving] = useState(false);



  const categories = [
    "Sales",
    "Software",
    "Marketing",
    "Travel",
    "Equipment",
    "Office",
    "Other",
  ];



  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();


    try {

      if (!user) {

        router.push("/login");
        return;

      }



      setSaving(true);



      const formattedDate =
        new Date(transactionDate)
          .toISOString()
          .split("T")[0];



      const {
        error
      } = await supabase
        .from("transactions")
        .insert({

          user_id: user.id,

          type,

          amount:
            Number(amount),

          category,

          description,

          transaction_date:
            formattedDate,

          source,

          invoice_id:
            invoiceId || null,

        });



      if (error) {

        console.error(
          "Supabase error:",
          error.message
        );


        alert(
          error.message
        );


        return;

      }



      router.push("/dashboard");



    } catch (error) {

      console.error(error);

      alert(
        "Unexpected error occurred"
      );


    } finally {

      setSaving(false);

    }

  }



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
                minHeight:"100vh",
                background:COLORS.background,
                padding:"40px 20px",
            }}
        >

                    <div
                style={{
                    maxWidth:620,
                    margin:"0 auto",
                }}
            >


                <div
                    style={{
                        marginBottom:28,
                    }}
                >

                    <h1
                        style={{
                            fontSize:32,
                            margin:0,
                            fontWeight:700,
                            color:"#0F172A",
                        }}
                    >
                        Add Transaction
                    </h1>


                    <p
                        style={{
                            marginTop:8,
                            color:COLORS.muted,
                        }}
                    >
                        Record your income and expenses to keep your finances organised.
                    </p>


                </div>





                <form
                    onSubmit={handleSubmit}
                    style={{
                        background:"white",
                        padding:32,
                        borderRadius:20,
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.04)",
                        display:"flex",
                        flexDirection:"column",
                        gap:24,
                    }}
                >




                    {/* TYPE */}

                    <div>

                        <label style={labelStyle}>
                            Transaction Type
                        </label>


                        <div
                            style={{
                                display:"grid",
                                gridTemplateColumns:
                                    "1fr 1fr",
                                gap:12,
                            }}
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    setType("income")
                                }
                                style={{
                                    ...toggleStyle,
                                    background:
                                        type === "income"
                                            ? "#DCFCE7"
                                            : "white",
                                    borderColor:
                                        type === "income"
                                            ? "#16A34A"
                                            : "#E5E7EB",
                                    color:
                                        type === "income"
                                            ? "#16A34A"
                                            : "#475569",
                                }}
                            >
                                💰 Money In
                            </button>



                            <button
                                type="button"
                                onClick={() =>
                                    setType("expense")
                                }
                                style={{
                                    ...toggleStyle,
                                    background:
                                        type === "expense"
                                            ? "#FEE2E2"
                                            : "white",
                                    borderColor:
                                        type === "expense"
                                            ? "#DC2626"
                                            : "#E5E7EB",
                                    color:
                                        type === "expense"
                                            ? "#DC2626"
                                            : "#475569",
                                }}
                            >
                                💸 Money Out
                            </button>


                        </div>

                    </div>







                    {/* AMOUNT */}

                    <div>

                        <label style={labelStyle}>
                            Amount
                        </label>


                        <div
                            style={{
                                display:"flex",
                                alignItems:"center",
                                border:
                                    "1px solid #E5E7EB",
                                borderRadius:12,
                                paddingLeft:16,
                            }}
                        >

                            <span
                                style={{
                                    fontSize:24,
                                    fontWeight:700,
                                    color:COLORS.muted,
                                }}
                            >
                                £
                            </span>


                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(
                                        e.target.value
                                    )
                                }
                                required
                                style={{
                                    border:"none",
                                    outline:"none",
                                    width:"100%",
                                    padding:16,
                                    fontSize:24,
                                }}
                            />


                        </div>

                    </div>








                    {/* CATEGORY */}

                    <div>

                        <label style={labelStyle}>
                            Category
                        </label>


                        <div
                            style={{
                                display:"flex",
                                flexWrap:"wrap",
                                gap:10,
                            }}
                        >

                            {
                                categories.map(
                                    (item) => (

                                        <button
                                            key={item}
                                            type="button"
                                            onClick={() =>
                                                setCategory(item)
                                            }
                                            style={{
                                                padding:
                                                    "8px 14px",
                                                borderRadius:
                                                    999,
                                                border:
                                                    category === item
                                                        ? `1px solid ${COLORS.accent}`
                                                        : "1px solid #E5E7EB",
                                                background:
                                                    category === item
                                                        ? "#E6FFFE"
                                                        : "white",
                                                cursor:
                                                    "pointer",
                                                color:"#334155",
                                            }}
                                        >
                                            {item}
                                        </button>

                                    )
                                )
                            }


                        </div>


                    </div>

                    {/* DESCRIPTION */}

                    <div>

                        <label style={labelStyle}>
                            Description
                        </label>


                        <textarea
                            placeholder="What was this transaction for?"
                            value={description}
                            onChange={(e) =>
                                setDescription(
                                    e.target.value
                                )
                            }
                            rows={4}
                            style={{
                                ...inputStyle,
                                resize:"none",
                            }}
                        />


                    </div>





                    {/* DATE + SOURCE */}

                    <div
                        style={{
                            display:"grid",
                            gridTemplateColumns:
                                "1fr 1fr",
                            gap:16,
                        }}
                    >

                        <div>

                            <label style={labelStyle}>
                                Date
                            </label>


                            <input
                                type="date"
                                value={transactionDate}
                                onChange={(e) =>
                                    setTransactionDate(
                                        e.target.value
                                    )
                                }
                                required
                                style={inputStyle}
                            />


                        </div>



                        <div>

                            <label style={labelStyle}>
                                Source
                            </label>


                            <select
                                value={source}
                                onChange={(e) =>
                                    setSource(
                                        e.target.value
                                    )
                                }
                                style={inputStyle}
                            >

                                <option value="manual">
                                    Manual Entry
                                </option>


                                <option value="Invoice">
                                    Invoice
                                </option>


                                <option value="Bank Import">
                                    Bank Import
                                </option>


                                <option value="Receipt Scan">
                                    Receipt Scan
                                </option>


                            </select>


                        </div>


                    </div>

                    {/* LINKED INVOICE */}

                    <div>

                        <label style={labelStyle}>
                            Linked Invoice (optional)
                        </label>


                        <select
                            value={invoiceId}
                            onChange={(e) =>
                                setInvoiceId(
                                    e.target.value
                                )
                            }
                            style={inputStyle}
                        >

                            <option value="">
                                None
                            </option>

                            {invoices.map((invoice) => (
                                <option key={invoice.id} value={invoice.id}>
                                    {invoice.file_name}
                                    {invoice.amount != null
                                        ? ` — £${invoice.amount}`
                                        : ""}
                                </option>
                            ))}

                        </select>


                    </div>







                    {/* SUBMIT */}

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            marginTop:8,
                            padding:"15px",
                            borderRadius:12,
                            border:"none",
                            background:
                                saving
                                    ? "#9ADBD8"
                                    : COLORS.accent,
                            color:"white",
                            fontSize:16,
                            fontWeight:700,
                            cursor:
                                saving
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >

                        {
                            saving
                                ? "Saving..."
                                : "Save Transaction"
                        }

                    </button>


                </form>


            </div>


        </main>
        </>

    );

}






/* ======================
   STYLES
====================== */


const labelStyle = {

    display:"block",

    marginBottom:8,

    fontSize:14,

    fontWeight:600,

    color:"#334155",

};



const inputStyle = {

    width:"100%",

    padding:"12px 14px",

    border:
        "1px solid #E5E7EB",

    borderRadius:12,

    background:"white",

    fontSize:15,

    outline:"none",

};



const toggleStyle = {

    padding:"14px",

    borderRadius:12,

    border:
        "1px solid #E5E7EB",

    fontSize:15,

    fontWeight:600,

    cursor:"pointer",

};