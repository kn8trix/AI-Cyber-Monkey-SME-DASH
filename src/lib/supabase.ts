// Browser-side Supabase client.
//
// This file is intentionally tiny: the server (`server.ts`) does all
// privileged reads/writes against Supabase Postgres via the existing
// `pg.Pool` in `src/server/db.ts` and exposes them through JSON APIs
// at `/api/demo/*`. We only spin up a browser client when we actually
// need direct anon-key access from the SPA (e.g. real-time
// subscriptions or RSC-style reads that don't go through Express).
//
// The client is created lazily and returns `null` if the required env
// vars are missing — that way the build stays green and components can
// fall back to hardcoded demo data when Supabase isn't configured
// (e.g. on Vercel preview deployments where VITE_SUPABASE_URL wasn't
// set).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anon) {
    // eslint-disable-next-line no-console
    console.warn(
      "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing — falling back to demo data."
    );
    cached = null;
    return null;
  }

  cached = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return cached;
}
