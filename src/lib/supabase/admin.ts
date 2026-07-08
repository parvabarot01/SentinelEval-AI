import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. Only for trusted server-only contexts
 * with no user session to scope by: the QStash job worker and the inline
 * guardrail-check endpoint (called by the customer's own backend, not a
 * browser). Never import this into anything reachable from a user request
 * without an explicit, separate authorization check.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
