import Link from "next/link";
import { COLORS } from "@/lib/colors";

const features = [
  {
    title: "Track income & expenses",
    description: "Log transactions and keep a clear, searchable ledger of your business finances.",
  },
  {
    title: "AI-powered insights",
    description: "Get practical, plain-English suggestions based on your actual revenue and spending.",
  },
  {
    title: "Tax packet prep",
    description: "Pull your income, expenses, and linked invoices into one export, ready for filing or your accountant.",
  },
];

export default function Home() {
  return (
    <main
      className="px-4"
      style={{
        minHeight: "100vh",
        background: COLORS.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <section
        style={{
          maxWidth: 640,
          width: "100%",
          textAlign: "center",
          paddingTop: "80px",
          paddingBottom: "48px",
        }}
      >
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#0F172A",
            margin: 0,
          }}
        >
          Prepra
        </h1>

        <p
          style={{
            marginTop: 16,
            fontSize: 18,
            color: COLORS.muted,
          }}
        >
          Simple bookkeeping and tax prep for freelancers, sole traders, and
          small businesses. Track income and expenses, get AI-powered
          insights, and pull it all together at tax time.
        </p>

        <div
          className="flex-col sm:flex-row"
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Link
            href="/signup"
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              background: COLORS.accent,
              color: "white",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sign up
          </Link>

          <Link
            href="/login"
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              background: "white",
              color: "#0F172A",
              fontWeight: 700,
              textDecoration: "none",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            Log in
          </Link>
        </div>
      </section>

      <section
        className="grid grid-cols-1 sm:grid-cols-3"
        style={{
          maxWidth: 960,
          width: "100%",
          gap: 20,
          paddingBottom: "80px",
        }}
      >
        {features.map((feature) => (
          <div
            key={feature.title}
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                color: "#0F172A",
              }}
            >
              {feature.title}
            </h3>

            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: COLORS.muted,
              }}
            >
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
