import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireOrgContext("admin");

    const { data, error } = await ctx.supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", ctx.orgId)
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "api_key.revoked",
      entityType: "api_key",
      entityId: id,
    });

    return Response.json({ key: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
