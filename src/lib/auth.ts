import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "factiq_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  await db.session.create({ data: { token, userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Cookie de session : secure en production (HTTPS), false en dev HTTP.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}

export function publicUser(u: {
  id: string;
  email: string;
  name: string;
  plan: string;
  legalName: string | null;
  siret: string | null;
  vatNumber: string | null;
  address: string | null;
  zip: string | null;
  city: string | null;
  iban: string | null;
  vatMode: string;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan,
    legalName: u.legalName,
    siret: u.siret,
    vatNumber: u.vatNumber,
    address: u.address,
    zip: u.zip,
    city: u.city,
    iban: u.iban,
    vatMode: u.vatMode,
  };
}
