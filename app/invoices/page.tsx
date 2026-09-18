"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/useAuth";
import Nav from "@/components/Nav";

type Invoice = {
    id: string;
    file_name: string;
    file_url: string;
    amount: number | null;
    created_at: string;
};

export default function InvoicePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [uploading, setUploading] = useState(false);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editDate, setEditDate] = useState("");

    async function loadInvoices(userId: string) {
        const { data } = await supabase
            .from("invoices")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        setInvoices(data || []);
    }

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push("/login");
            return;
        }

        loadInvoices(user.id);
    }, [user, authLoading, router]);

    async function handleAddInvoice() {
        if (!file || !amount) {
            alert("Please select a file and enter an amount");
            return;
        }

        if (!user) return;

        setUploading(true);

        try {
            const filename = `${user.id}/${Date.now()}-${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from("invoices")
                .upload(filename, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("invoices")
                .getPublicUrl(filename);

            const publicUrl = publicUrlData.publicUrl;

            const { error: insertError } = await supabase.from("invoices").insert([
                {
                    user_id: user.id,
                    file_name: file.name,
                    file_url: publicUrl,
                    amount: parseFloat(amount),
                },
            ]);

            if (insertError) throw insertError;

            setAmount("");
            setFile(null);
            await loadInvoices(user.id);

            alert("Invoice added successfully");
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload invoice");
        } finally {
            setUploading(false);
        }
    }

    async function updateInvoice(id: string) {
        if (!user) return;

        const value = parseFloat(editAmount);

        if (isNaN(value)) {
            alert("Please enter a valid amount");
            return;
        }

        if (!editDate) {
            alert("Please select a valid date");
            return;
        }

        try {
            const { data, error } = await supabase
                .from("invoices")
                .update({
                    amount: value,
                    created_at: new Date(editDate).toISOString(),
                })
                .eq("id", id)
                .select();

            if (error) {
                console.error("UPDATE ERROR:", error);
                alert(error.message);
                return;
            }

            setEditingId(null);
            setEditAmount("");
            setEditDate("");
            await loadInvoices(user.id);
        } catch (err) {
            console.error("Unexpected error:", err);
            alert("Something went wrong updating invoice");
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
        <main style={{ minHeight: "100vh", background: "#F8FBFC", padding: "40px" }}>

            <h1>Upload Invoices</h1>

            <p style={{ color: "#6B7280" }}>
                Store and manage invoices
            </p>

            {/* Upload card */}
            <div
                style={{
                    marginTop: "24px",
                    background: "white",
                    padding: "24px",
                    borderRadius: "16px",
                }}
            >
                {/* AMOUNT INPUT WITH £ */}
                <div style={{ position: "relative", marginBottom: "12px" }}>
                    <span
                        style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#6B7280",
                        }}
                    >
                        £
                    </span>

                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        style={{
                            display: "block",
                            padding: "10px 10px 10px 28px",
                            width: "100%",
                            borderRadius: "10px",
                            border: "1px solid #E5E7EB",
                        }}
                    />
                </div>

                <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setFile(f);
                    }}
                    style={{ marginBottom: "12px" }}
                />

                <button
                    onClick={handleAddInvoice}
                    disabled={uploading}
                    style={{
                        padding: "12px 18px",
                        borderRadius: "12px",
                        background: "#19C7C1",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    {uploading ? "Uploading..." : "Add Invoice"}
                </button>
            </div>

            {/* List */}
            <section style={{ marginTop: "30px" }}>
                <h2>Uploaded Invoices</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {invoices.length === 0 ? (
                        <p>No invoices yet</p>
                    ) : (
                        invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                style={{
                                    background: "white",
                                    padding: "18px",
                                    borderRadius: "12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <a
                                    href={invoice.file_url}
                                    target="_blank"
                                    style={{
                                        textDecoration: "none",
                                        color: "black",
                                        flex: 1,
                                    }}
                                >
                                    📄 {invoice.file_name}
                                    <br />
                                    <small>
                                        {new Date(invoice.created_at).toLocaleDateString()}
                                    </small>
                                </a>

                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    {editingId === invoice.id ? (
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            
                                            {/* EDIT AMOUNT WITH £ */}
                                            <div style={{ position: "relative" }}>
                                                <span
                                                    style={{
                                                        position: "absolute",
                                                        left: "10px",
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        color: "#6B7280",
                                                    }}
                                                >
                                                    £
                                                </span>

                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    style={{
                                                        padding: "6px 6px 6px 22px",
                                                        width: "100px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #E5E7EB",
                                                    }}
                                                />
                                            </div>

                                            <input
                                                type="date"
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                style={{
                                                    padding: "6px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #E5E7EB",
                                                }}
                                            />

                                            <button
                                                onClick={() => updateInvoice(invoice.id)}
                                                style={{
                                                    padding: "6px 10px",
                                                    background: "#19C7C1",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Save
                                            </button>

                                            <button
                                                onClick={() => setEditingId(null)}
                                                style={{
                                                    padding: "6px 10px",
                                                    background: "white",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span style={{ fontWeight: 600 }}>
                                                £{invoice.amount ?? 0}
                                            </span>

                                            <button
                                                onClick={() => {
                                                    setEditingId(invoice.id);
                                                    setEditAmount(String(invoice.amount ?? ""));
                                                    setEditDate(
                                                        new Date(invoice.created_at)
                                                            .toISOString()
                                                            .split("T")[0]
                                                    );
                                                }}
                                                style={{
                                                    padding: "6px 10px",
                                                    background: "white",
                                                    border: "1px solid #E5E7EB",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Edit
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
        </>
    );
}