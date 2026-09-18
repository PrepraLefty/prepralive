import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, revenue, expenses, netProfit, expensesByCategory } = body;
    const { business_type: businessType, industry, goal } = profile ?? {};

    const categoryBreakdown =
      Array.isArray(expensesByCategory) && expensesByCategory.length > 0
        ? expensesByCategory
            .map((c: { category: string; amount: number }) => `${c.category}: £${c.amount}`)
            .join(", ")
        : "No categorised expenses yet";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
You are a financial assistant for PREPRA, a plain, professional bookkeeping app for small businesses and tradespeople. Match that tone exactly.

Rules:
- Do not use emojis or decorative symbols anywhere in the output.
- Do not use vague corporate phrasing (e.g. "leverage", "optimize your strategy", "synergy", "unlock potential"). Write plainly and directly.
- Be specific: reference the actual figures and category names given below rather than speaking abstractly. If a category stands out (largest expense, unusually high, etc.), name it and its amount.
- Return ONLY a valid JSON array. No markdown formatting, no code fences, no commentary outside the array.

User:
- Business type: ${businessType}
- Industry: ${industry}
- Goal: ${goal}
- Revenue: £${revenue}
- Expenses: £${expenses}
- Net profit: £${netProfit}
- Expense breakdown by category: ${categoryBreakdown}

Format:
[
  {
    "title": "string",
    "reason": "string",
    "action": "string"
  }
]

Max 3 insights.
          `,
        },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(text || "[]");
    } catch (parseErr) {
      console.error("Insights JSON parse error:", parseErr, "raw:", text);

      return Response.json(
        { error: "Model returned a malformed response" },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (err: any) {
    console.error("API error:", err);

    return Response.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}