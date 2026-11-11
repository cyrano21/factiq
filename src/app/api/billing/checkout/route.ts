import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Pont Stripe Checkout réel.
 * Variables d'environnement requises pour activer le paiement :
 *   - STRIPE_SECRET_KEY  (clé test : sk_test_…)
 *   - STRIPE_PRICE_PRO   (price_… abonnement Pro 9 €/mois)
 *   - STRIPE_PRICE_BUREAU (price_… abonnement Bureau 29 €/mois, optionnel)
 * Sans clé : réponse explicite mode démonstration (503).
 */
const PRICES: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  bureau: process.env.STRIPE_PRICE_BUREAU,
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Créez d'abord votre compte (gratuit), puis activez le plan depuis vos paramètres." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const plan = body.plan === "bureau" ? "bureau" : "pro";
  const key = process.env.STRIPE_SECRET_KEY;
  const price = PRICES[plan];

  if (!key) {
    return NextResponse.json(
      {
        error:
          "Paiement en attente de configuration : ajoutez STRIPE_SECRET_KEY et STRIPE_PRICE_PRO (mode test Stripe) pour activer le Checkout (Pro 9 €/mois, Bureau 29 €/mois).",
        configured: false,
        plan,
      },
      { status: 503 }
    );
  }
  if (!price) {
    return NextResponse.json(
      {
        error: `Prix Stripe manquant pour le plan ${plan} : définissez STRIPE_PRICE_${plan.toUpperCase()} (price_… créé dans le dashboard Stripe, mode test).`,
        configured: true,
        plan,
      },
      { status: 503 }
    );
  }

  // Création de la session Checkout via l'API REST Stripe (sans SDK).
  const origin = new URL(req.url).origin;
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", price);
  params.set("line_items[0][quantity]", "1");
  params.set("client_reference_id", user.id);
  params.set("customer_email", user.email);
  params.set("success_url", `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/?checkout=cancel`);
  params.set("subscription_data[metadata][plan]", plan);
  params.set("subscription_data[metadata][userId]", user.id);

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Stripe a refusé la création de session." },
        { status: 502 }
      );
    }
    return NextResponse.json({ url: data.url, configured: true, plan });
  } catch {
    return NextResponse.json(
      { error: "Impossible de joindre Stripe (réseau)." },
      { status: 502 }
    );
  }
}
