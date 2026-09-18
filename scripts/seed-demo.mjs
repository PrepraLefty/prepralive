import { createClient } from "@supabase/supabase-js";

const DEMO_USER_ID = "ec1c6d9b-28e3-40cd-86e6-3efa916e02d3";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n\n" +
      "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase dashboard -> Project Settings -> API -> service_role key).\n" +
      "Do NOT prefix it with NEXT_PUBLIC_ - that would bundle it into client-side JS and expose full admin access to every visitor.\n\n" +
      "Then run: node --env-file=.env.local scripts/seed-demo.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- helpers ----------

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

function toDateString(date) {
  return date.toISOString().split("T")[0];
}

function randomDateInRange(from, to) {
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Builds a minimal, valid, openable PDF containing the given title text,
// so seeded invoice links resolve to a real file instead of a broken URL.
function buildMinimalPdf(title) {
  const safeTitle = title.replace(/[()\\]/g, "");

  const objects = {
    1: "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    2: "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 400 200] >>\nendobj\n",
    3: "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    5: "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  };

  const content = `BT /F1 16 Tf 20 150 Td (${safeTitle}) Tj ET`;
  objects[4] = `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += objects[i];
  }

  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += "xref\n0 6\n0000000000 65535 f \n";

  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

// ---------- demo data ----------

const JOBS = [
  "Kitchen renovation - Smith residence",
  "Bathroom refit - Jones residence",
  "Single-storey extension - Patel residence",
  "Garden wall repair - Whitfield residence",
  "Loft conversion - Nguyen residence",
  "Driveway resurfacing - Douglas residence",
  "Roof repair - Campbell residence",
  "Fence installation - O'Brien residence",
  "Conservatory build - Hughes residence",
  "Garage conversion - Reid residence",
];

const EXPENSE_CATEGORIES = {
  "Materials & Supplies": [
    "Timber and plasterboard - Jewson",
    "Cement and sand - Travis Perkins",
    "Plumbing fittings - Screwfix",
    "Electrical cable - City Electrical Factors",
    "Insulation boards - Wickes",
    "Tiles and adhesive - Topps Tiles",
  ],
  "Tool Purchases": [
    "Cordless drill set - Screwfix",
    "Circular saw - Toolstation",
    "Replacement blades - Screwfix",
    "Extension ladder - Toolstation",
    "Spirit levels - Screwfix",
  ],
  "Fuel & Mileage": [
    "Diesel - Shell",
    "Fuel - BP garage",
    "Van fuel - Esso",
    "Fuel - Texaco",
  ],
  "Subcontractor Payments": [
    "Electrician - J. Hart Electrical",
    "Plumber - Flowright Plumbing",
    "Plasterer - M. Kowalski",
    "Roofer - Apex Roofing",
    "Groundworker - T. Ainsley",
  ],
  "Equipment Hire": [
    "Mini digger hire - HSS Hire",
    "Scaffold tower hire - Speedy Hire",
    "Cement mixer hire - HSS Hire",
    "Skip hire - Local Skips Ltd",
  ],
  Insurance: [
    "Public liability insurance - Simply Business",
    "Van insurance - Direct Line",
    "Tool insurance - Hiscox",
  ],
};

const UNCATEGORISED_DESCRIPTIONS = [
  "Cash purchase - no receipt",
  "Misc site materials",
];

const MONTHS_BACK = 6;
const now = new Date();
const startDate = new Date(now);
startDate.setMonth(startDate.getMonth() - MONTHS_BACK);

// ---------- generation ----------

function buildTransactions() {
  const transactions = [];

  // Income: roughly one job every 1-2 weeks, unevenly spaced.
  let cursor = new Date(startDate);
  const usedJobs = new Set();

  while (cursor < now) {
    const available = JOBS.filter((job) => !usedJobs.has(job));
    const job = pick(available.length > 0 ? available : JOBS);
    usedJobs.add(job);

    transactions.push({
      type: "income",
      description: job,
      category: "Client Work",
      amount: randomFloat(800, 4500),
      transaction_date: toDateString(cursor),
      source: "manual",
    });

    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + randomInt(7, 16));
  }

  // Expenses: a few a week, unevenly spaced, across all six categories.
  let weekStart = new Date(startDate);

  while (weekStart < now) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const clampedEnd = weekEnd > now ? now : weekEnd;

    const count = randomInt(1, 5);

    for (let i = 0; i < count; i++) {
      const category = pick(Object.keys(EXPENSE_CATEGORIES));
      const description = pick(EXPENSE_CATEGORIES[category]);

      transactions.push({
        type: "expense",
        description,
        category,
        amount: randomFloat(15, 650),
        transaction_date: toDateString(randomDateInRange(weekStart, clampedEnd)),
        source: "manual",
      });
    }

    weekStart = weekEnd;
  }

  // A couple of deliberately uncategorised expenses.
  for (const description of UNCATEGORISED_DESCRIPTIONS) {
    transactions.push({
      type: "expense",
      description,
      category: "",
      amount: randomFloat(20, 150),
      transaction_date: toDateString(randomDateInRange(startDate, now)),
      source: "manual",
    });
  }

  return transactions.map((t) => ({ ...t, user_id: DEMO_USER_ID }));
}

// ---------- main ----------

async function clearExistingData() {
  console.log("Clearing existing demo data...");

  const { error: txError } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", DEMO_USER_ID);

  if (txError) throw txError;

  const { error: invError } = await supabase
    .from("invoices")
    .delete()
    .eq("user_id", DEMO_USER_ID);

  if (invError) throw invError;

  const { data: existingFiles, error: listError } = await supabase.storage
    .from("invoices")
    .list(DEMO_USER_ID);

  if (listError) throw listError;

  if (existingFiles && existingFiles.length > 0) {
    const paths = existingFiles.map((f) => `${DEMO_USER_ID}/${f.name}`);
    const { error: removeError } = await supabase.storage.from("invoices").remove(paths);

    if (removeError) throw removeError;
  }
}

async function uploadDemoInvoice(title, filenameBase) {
  const pdf = buildMinimalPdf(title);
  const path = `${DEMO_USER_ID}/${Date.now()}-${slugify(filenameBase)}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("invoices")
    .upload(path, pdf, { contentType: "application/pdf" });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from("invoices").getPublicUrl(path);

  return {
    file_name: `${filenameBase}.pdf`,
    file_url: publicUrlData.publicUrl,
  };
}

async function seed() {
  await clearExistingData();

  console.log("Generating transactions...");
  const transactions = buildTransactions();

  console.log(`Inserting ${transactions.length} transactions...`);
  const { data: insertedTransactions, error: insertTxError } = await supabase
    .from("transactions")
    .insert(transactions)
    .select("id, type, category, description, amount");

  if (insertTxError) throw insertTxError;

  console.log("Uploading and linking demo invoices...");

  const incomeTx = insertedTransactions.find((t) => t.type === "income");
  const subcontractorTx = insertedTransactions.find((t) => t.category === "Subcontractor Payments");
  const equipmentTx = insertedTransactions.find((t) => t.category === "Equipment Hire");

  const linkTargets = [incomeTx, subcontractorTx, equipmentTx].filter(Boolean);

  for (const tx of linkTargets) {
    const invoiceFile = await uploadDemoInvoice(tx.description, tx.description);

    const { data: invoiceRow, error: invInsertError } = await supabase
      .from("invoices")
      .insert({
        user_id: DEMO_USER_ID,
        file_name: invoiceFile.file_name,
        file_url: invoiceFile.file_url,
        amount: tx.amount,
      })
      .select("id")
      .single();

    if (invInsertError) throw invInsertError;

    const { error: linkError } = await supabase
      .from("transactions")
      .update({ invoice_id: invoiceRow.id })
      .eq("id", tx.id);

    if (linkError) throw linkError;
  }

  console.log(
    `Done. Seeded ${transactions.length} transactions and ${linkTargets.length} linked invoices for user ${DEMO_USER_ID}.`
  );
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
