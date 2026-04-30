import "server-only";

import { getSupabaseConfig, hasSupabaseAuthConfig } from "@/lib/env";
import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const accessCookie = "stratbook-access-token";
const refreshCookie = "stratbook-refresh-token";

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthRequiredError";
  }
}

export class AuthNotConfiguredError extends Error {
  constructor() {
    super("Supabase Auth is not configured.");
    this.name = "AuthNotConfiguredError";
  }
}

function getAuthClient(accessToken?: string) {
  const config = getSupabaseConfig();
  return createClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseAuthConfig()) return null;

  const store = await cookies();
  const accessToken = store.get(accessCookie)?.value;
  if (!accessToken) return null;

  const { data, error } = await getAuthClient(accessToken).auth.getUser(accessToken);
  if (error) return null;
  return data.user ?? null;
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthRequiredError();
  return user;
}

export async function signInWithPassword(input: { email: string; password: string }) {
  if (!hasSupabaseAuthConfig()) throw new AuthNotConfiguredError();

  const { data, error } = await getAuthClient().auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw error;
  if (!data.session) throw new Error("No session was returned by Supabase.");

  await setSessionCookies(data.session.access_token, data.session.refresh_token, data.session.expires_in);
  return data.user;
}

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  displayName?: string;
}) {
  if (!hasSupabaseAuthConfig()) throw new AuthNotConfiguredError();

  const { data, error } = await getAuthClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: input.displayName?.trim()
        ? { display_name: input.displayName.trim(), username: input.displayName.trim() }
        : undefined,
    },
  });

  if (error) throw error;

  if (data.session) {
    await setSessionCookies(
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_in
    );
  }

  return {
    needsConfirmation: !data.session,
    user: data.user,
  };
}

export async function signOut() {
  const store = await cookies();
  store.delete(accessCookie);
  store.delete(refreshCookie);
}

async function setSessionCookies(accessToken: string, refreshToken: string, expiresIn: number) {
  const store = await cookies();
  store.set(accessCookie, accessToken, cookieOptions(expiresIn));
  store.set(refreshCookie, refreshToken, cookieOptions(60 * 60 * 24 * 30));
}
