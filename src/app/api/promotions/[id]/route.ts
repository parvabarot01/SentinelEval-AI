import { requireOrgContext, orgContextErrorResponse, OrgContextError } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { decidePromotionSchema } from "@/lib/validation/promotions";

/**
 * Approving a promotion (or overriding an auto-blocked one) is the one
 * action in this product that actually flips what's live — restricted to
 * admin/owner, and every decision is audit-logged with a before/after so
 * there's a full change history on the call.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireOrgContext("admin");
    const body = decidePromotionSchema.parse(await request.json());

    const { data: promotion, error: fetchError } = await ctx.supabase
      .from("promotions")
      .select("*")
      .eq("id", id)
      .eq("org_id", ctx.orgId)
      .single();
    if (fetchError || !promotion) {
      throw new OrgContextError(404, "Promotion not found");
    }
    if (promotion.status === "approved" || promotion.status === "rejected") {
      throw new OrgContextError(409, "This promotion has already been decided");
    }

    const newStatus = body.action === "approve" ? "approved" : "rejected";

    if (body.action === "approve") {
      await ctx.supabase
        .from("project_versions")
        .update({ is_current_for_env: false })
        .eq("project_id", promotion.project_id)
        .eq("environment", promotion.environment);

      await ctx.supabase
        .from("project_versions")
        .update({ is_current_for_env: true })
        .eq("id", promotion.to_version_id);
    }

    const { data: updated, error } = await ctx.supabase
      .from("promotions")
      .update({ status: newStatus, decided_by: ctx.userId, decided_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: `promotion.${newStatus}`,
      entityType: "promotion",
      entityId: id,
      before: promotion,
      after: updated,
    });

    return Response.json({ promotion: updated });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
