import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, publicUser } from "@/lib/auth";

/**
 * Confirmation du paiement au retour de Stripe Checkout.
 * GET /api/billing/confirm?session_id=cs_test_…
 * Vérifie la session auprès de Stripe et passe le compte en plan Pro
 * si le paiement est réglé. (Alternative sans webhook, suffisante en test.)
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 503 });
  }
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id manquant." }, { status: 400 });
  }

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const session = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: session?.error?.message ?? "Session Stripe introuvable." },
      { status: 502 }
    );
  }

  // Sécurité : la session doit appartenir à l'utilisateur connecté.
  if (session.client_reference_id && session.client_reference_id !== user.id) {
    return NextResponse.json({ error: "Session de paiement étrangère." }, { status: 403 });
  }

  // Sécurité : upgrade uniquement si le paiement est réellement réglé.
  // « complete » seul est insuffisant (session complétée sans encaissement).
  if (session.payment_status === "paid") {
    const updated = await db.user.update({
      where: { id: user.id },
      data: { plan: "pro" },
    });
    return NextResponse.json({ user: publicUser(updated), upgraded: true });
  }
  return NextResponse.json({ user: publicUser(user), upgraded: false });
}
