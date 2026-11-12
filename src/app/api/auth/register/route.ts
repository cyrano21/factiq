import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, publicUser } from "@/lib/auth";
import { httpError, registerSchema } from "@/lib/validate";

export async function POST(req: Request) {
  try {
    // Validation du corps : e-mail de format valide (≤ 200), mot de passe
    // de 10 à 128 caractères (jamais trimé), nom de 1 à 100 caractères.
    const parsed = registerSchema.safeParse(await req.json().catch(() => null));
    const validation = httpError(parsed);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.firstError }, { status: 400 });
    }
    const email = parsed.data!.email.toLowerCase();
    const password = parsed.data!.password;
    const name = parsed.data!.name;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: { email, name, passwordHash: hashPassword(password) },
    });
    await createSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
