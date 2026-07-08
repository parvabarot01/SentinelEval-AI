import type { OrgContext } from "@/lib/auth/org-context";

interface AuditParams {
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * Every suite/dataset mutation, guardrail decision, and promotion decision
 * gets a row here — this is the reproducibility/governance trail the product
 * is sold on, so it's called from the route handler, not left to a DB trigger,
 * to keep the "who/why" (actor_id) explicit at the call site.
 */
export async function recordAudit(ctx: OrgContext, params: AuditParams) {
  await ctx.supabase.from("audit_log").insert({
    org_id: ctx.orgId,
    actor_id: ctx.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before: params.before ?? null,
    after: params.after ?? null,
  });
}
