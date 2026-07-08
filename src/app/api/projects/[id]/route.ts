import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireOrgContext("viewer");

    const { data: project, error } = await ctx.supabase
      .from("projects")
      .select("*")
      .eq("org_id", ctx.orgId)
      .eq("id", id)
      .single();
    if (error) throw error;

    const { data: versions, error: versionsError } = await ctx.supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });
    if (versionsError) throw versionsError;

    return Response.json({ project, versions });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
