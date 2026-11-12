import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Webhook Stripe — source de vérité du cycle de vie des abonnements.
 * POST /api/billing/webhook
 *
 * À déclarer côté Stripe : endpoint POST https://votre-domaine/api/billing/webhook,
 * événements « checkout.session.completed » (et à venir : invoice.payment_failed,
 * customer.subscription.deleted), secret STRIPE_WEBHOOK_SECRET (whsec_…).
 *
 * La signature « Stripe-Signature: t=…,v1=… » est vérifiée manuellement
 * (HMAC-SHA256 de « t.payload » avec le secret) : aucune dépendance SDK.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    return NextResponse.json(
      {
        error:
          "Webhook Stripe non configuré : définissez STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET.",
      },
      { status: 503 }
    );
  }

  const sigHeader = req.headers.get("stripe-signature");
  if (!sigHeader) {
    return NextResponse.json({ error: "Signature absente." }, { status: 400 });
  }
  const payload = await req.text();

  const parts: Record<string, string> = {};
  for (const seg of sigHeader.split(",")) {
    const [k, v] = seg.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) {
    return NextResponse.json({ error: "Signature malformée." }, { status: 400 });
  }

  // Tolérance de 5 minutes contre les rejeux.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) {
    return NextResponse.json({ error: "Horodatage expiré." }, { status: 400 });
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object ?? {};
    const reference = String(session.client_reference_id ?? "");
    const paid = session.payment_status === "paid";
    if (paid && reference) {
      // La session a été créée par /api/billing/checkout avec
      // client_reference_id = id de l'utilisateur : fiable et signé côté Stripe.
      await db.user
        .update({ where: { id: reference }, data: { plan: "pro" } })
        .catch(() => {});
    }
  }

  // customer.subscription.deleted / invoice.payment_failed : à brancher ici
  // (retour au plan gratuit, notification) lors du passage en production.
  return NextResponse.json({ received: true });
}
