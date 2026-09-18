import { supabase } from "@/lib/supabase";

type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string | null;
  transaction_date: string;
  invoice_id?: string | null;
  invoice?: { id: string; file_name: string; file_url: string } | null;
};

type Invoice = {
  id: string;
  user_id: string;
  file_url: string;
  file_name?: string;
  amount?: number;
  created_at: string;
};

export async function buildTaxPacket(
  userId: string,
  startDate: string,
  endDate: string
) {
  // 1. Fetch transactions, embedding their linked invoice (if any)
  const { data: transactionsData, error: txError } = await supabase
    .from("transactions")
    .select("*, invoice:invoice_id(id, file_name, file_url)")
    .eq("user_id", userId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  if (txError) throw txError;

  const transactions: Transaction[] = transactionsData ?? [];

  // 2. Fetch invoices
  const { data: invoicesData, error: invError } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (invError) throw invError;

  const invoices: Invoice[] = invoicesData ?? [];

  // 3. Split income vs expenses
  const incomeItems = transactions.filter((t) => t.type === "income");
  const expenseItems = transactions.filter((t) => t.type === "expense");

  // 4. Totals
  const income = incomeItems.reduce((sum, t) => sum + t.amount, 0);
  const expenses = expenseItems.reduce((sum, t) => sum + t.amount, 0);

  // 5. Uncategorised count
  const uncategorisedCount = transactions.filter((t) => !t.category).length;

  // 6. Build packet
  return {
    period: { start: startDate, end: endDate },
    totals: {
      income,
      expenses,
      profit: income - expenses,
    },
    incomeItems,
    expenseItems,
    invoices,
    uncategorisedCount,
  };
}