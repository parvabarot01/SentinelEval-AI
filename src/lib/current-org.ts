import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { OrgRole } from "@/lib/types";

export const ORG_COOKIE = "sentineleval_org";

export interface OrgMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: OrgRole;
}

export interface CurrentOrg {
  userId: string;
  userEmail: string | null;
  memberships: OrgMembership[];
  current: OrgMembership | null;
}

/**
 * Resolves the signed-in user's org memberships and which one is "current."
 * The current org is whichever the `sentineleval_org` cookie points to (set
 * by the org switcher), falling back to the first membership. Returns
 * current: null when the user belongs to zero orgs — callers should redirect
 * to /onboarding in that case.
 */
export async function getCurrentOrg(): Promise<CurrentOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(name, slug)")
    .eq("user_id", user.id);

  const memberships: OrgMembership[] = (data ?? []).map((row) => {
    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;
    return {
      orgId: row.org_id as string,
      role: row.role as OrgRole,
      orgName: (org?.name as string) ?? "Untitled org",
      orgSlug: (org?.slug as string) ?? "",
    };
  });

  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ORG_COOKIE)?.value;
  const current = memberships.find((m) => m.orgId === preferredOrgId) ?? memberships[0] ?? null;

  return { userId: user.id, userEmail: user.email ?? null, memberships, current };
}
