"use client";
// Browser-side fetch wrapper that attaches the signed-in user's Cognito ID token.
// Use for every admin API call and for any customer call that reads personal data.
import { fetchAuthSession } from "aws-amplify/auth";

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    const session = await fetchAuthSession();
    const token   = session.tokens?.idToken?.toString();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    /* not signed in — request goes without a token and the API will reject it if needed */
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}

/** JSON helper: throws an Error with the API's message on non-2xx. */
export async function apiJson<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  const res  = await authFetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}
