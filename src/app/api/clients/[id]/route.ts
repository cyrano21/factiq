import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id } });
  if (!client || client.userId !== user.id) {
    return NextResponse.json({ error: "Client introuvable." }, { status: 404 });
  }
  await db.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
