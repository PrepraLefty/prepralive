import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, revenue, expenses, netProfit } = body;
    const { business_type: businessType, industry, goal } = profile ?? {};

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
You are a financial AI assistant.

Return ONLY valid JSON array.

User:
- Business type: ${businessType}
- Industry: ${industry}
- Goal: ${goal}
- Revenue: £${revenue}
- Expenses: £${expenses}
- Net profit: £${netProfit}

Format:
[
  {
    "title": "string",
    "reason": "string",
    "action": "string"
  }
]

Max 3 insights.
Keep it practical.
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