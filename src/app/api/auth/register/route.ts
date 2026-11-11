import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, publicUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json({ error: "Le nom est requis." }, { status: 400 });
    }

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
