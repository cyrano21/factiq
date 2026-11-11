import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Aurora, the AI assistant on the Loopcart website. Loopcart is a customer engagement platform for ecommerce brands.

Verified facts you may use:
- Loopcart turns ecommerce shoppers into repeat customers.
- It reaches customers across email, SMS, push notifications, WhatsApp, and AI voice calls — all from one place.
- It recovers abandoned carts and checkouts automatically with AI (browse, cart, and checkout abandonment).
- Its Large Event Model, Aurora, predicts shopper behavior such as exit intent and the next likely action, and acts in real time.
- It includes an analytics dashboard with revenue attribution and audience insights.
- It integrates with Shopify and popular CRM tools.
- It is free to start and requires no credit card.

Style rules:
- Friendly, confident, concise: 2-4 short sentences maximum.
- Answer questions about Loopcart using only the facts above; do not invent numbers, prices or guarantees beyond "free to start".
- If asked about something unrelated, give a one-line answer at most, then steer back to how Loopcart can help their store.
- Plain text only — no markdown, no emoji.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: unknown };
    const raw = Array.isArray(body?.messages) ? body.messages : [];

    const history: ChatMessage[] = raw
      .filter(
        (m): m is ChatMessage =>
          typeof m === "object" &&
          m !== null &&
          "role" in m &&
          ((m as ChatMessage).role === "user" ||
            (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string",
      )
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 2000) }))
      .filter((m) => m.content.length > 0);

    if (history.length === 0 || history[history.length - 1].role !== "user") {
      return NextResponse.json({ error: "No user message" }, { status: 400 });
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [{ role: "assistant", content: SYSTEM_PROMPT }, ...history],
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "Empty completion" }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[/api/chat] failed:", error);
    return NextResponse.json({ error: "Chat request failed" }, { status: 500 });
  }
}
