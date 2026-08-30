import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

const COOKIE_NAME = "ruskist_auth";
const SESSION_TTL_DAYS = 30;

export type Role = "user" | "manager" | "administrator";

export type User = {
  id: number;
  email: string;
  role: Role;
  name: string;
  phone: string;
  orgForm: string;
  legalName: string;
  legalAddress: string;
  inn: string;
  kpp: string | null;
  bankAccount: string;
  bankName: string;
  bankBik: string;
  bankCorrAccount: string | null;
  deliveryAddress: string | null;
};

function mapUserRow(r: Record<string, unknown>): User {
  return {
    id: Number(r.id),
    email: r.email as string,
    role: r.role as Role,
    name: r.name as string,
    phone: r.phone as string,
    orgForm: r.org_form as string,
    legalName: r.legal_name as string,
    legalAddress: r.legal_address as string,
    inn: r.inn as string,
    kpp: (r.kpp as string) ?? null,
    bankAccount: r.bank_account as string,
    bankName: r.bank_name as string,
    bankBik: r.bank_bik as string,
    bankCorrAccount: (r.bank_corr_account as string) ?? null,
    deliveryAddress: (r.delivery_address as string) ?? null,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO user_sessions (token, user_id, expires_at)
    VALUES (${token}, ${userId}, ${expiresAt.toISOString()})
  `;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await sql`DELETE FROM user_sessions WHERE token = ${token}`;
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT u.* FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
  `;
  if (!rows.length) return null;
  return mapUserRow(rows[0]);
}

/** Returns the current user if they have one of the given roles, otherwise null. */
export async function requireRole(roles: Role[]): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (!rows.length) return null;
  return { ...mapUserRow(rows[0]), passwordHash: rows[0].password_hash as string };
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows[0] ? mapUserRow(rows[0]) : null;
}

export type NewUserInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  orgForm: string;
  legalName: string;
  legalAddress: string;
  inn: string;
  kpp: string | null;
  bankAccount: string;
  bankName: string;
  bankBik: string;
  bankCorrAccount: string | null;
  deliveryAddress: string | null;
};

export async function createUser(input: NewUserInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  const rows = await sql`
    INSERT INTO users (
      email, password_hash, name, phone, org_form, legal_name, legal_address,
      inn, kpp, bank_account, bank_name, bank_bik, bank_corr_account, delivery_address
    ) VALUES (
      ${input.email}, ${passwordHash}, ${input.name}, ${input.phone}, ${input.orgForm},
      ${input.legalName}, ${input.legalAddress}, ${input.inn}, ${input.kpp},
      ${input.bankAccount}, ${input.bankName}, ${input.bankBik}, ${input.bankCorrAccount},
      ${input.deliveryAddress}
    )
    RETURNING *
  `;
  return mapUserRow(rows[0]);
}
