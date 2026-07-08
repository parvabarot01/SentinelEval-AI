import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server Component / Route Handler client — reads and writes the session cookie. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // called from a Server Component that can't set cookies — middleware
            // refreshes the session instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}
