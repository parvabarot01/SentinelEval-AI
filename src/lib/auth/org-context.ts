import { createClient } from "@/lib/supabase/server";
import type { OrgRole } from "@/lib/types";

export class OrgContextError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const ROLE_RANK: Record<OrgRole, number> = {
  viewer: 0,
  reviewer: 1,
  engineer: 2,
  admin: 3,
  owner: 4,
};

export interface OrgContext {
  userId: string;
  orgId: string;
  role: OrgRole;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Resolves the authenticated user and their membership in the given org.
 * Throws OrgContextError (401/403) rather than returning null so route
 * handlers can let it propagate to a single catch-and-respond wrapper.
 */
export async function requireOrgContext(orgId: string, minRole: OrgRole = "viewer"): Promise<OrgContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new OrgContextError(401, "Not authenticated");
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new OrgContextError(403, "Not a member of this organization");
  }

  const role = membership.role as OrgRole;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new OrgContextError(403, `Requires ${minRole} role or higher`);
  }

  return { userId: user.id, orgId, role, supabase };
}

export function orgContextErrorResponse(error: unknown) {
  if (error instanceof OrgContextError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
