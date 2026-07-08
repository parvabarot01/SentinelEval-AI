import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE } from "@/lib/current-org";
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
 * Resolves the authenticated user and their membership in whichever org is
 * "current" (the `sentineleval_org` cookie set by the nav's org switcher,
 * falling back to the user's first membership). Throws OrgContextError
 * (401/403) rather than returning null so route handlers can let it
 * propagate to a single catch-and-respond wrapper.
 */
export async function requireOrgContext(minRole: OrgRole = "viewer"): Promise<OrgContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new OrgContextError(401, "Not authenticated");
  }

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ORG_COOKIE)?.value;

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    throw new OrgContextError(403, "Not a member of any organization");
  }

  const membership =
    memberships.find((m) => m.org_id === preferredOrgId) ?? memberships[0];

  const role = membership.role as OrgRole;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new OrgContextError(403, `Requires ${minRole} role or higher`);
  }

  return { userId: user.id, orgId: membership.org_id as string, role, supabase };
}

export function orgContextErrorResponse(error: unknown) {
  if (error instanceof OrgContextError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    return Response.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
