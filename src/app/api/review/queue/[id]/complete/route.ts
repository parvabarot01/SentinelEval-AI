import { requireOrgContext, orgContextErrorResponse, OrgContextError } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { completeReviewSchema } from "@/lib/validation/review";
import { verdictFromScore } from "@/lib/utils";
import type { ReviewDecision } from "@/lib/types";

const DECISION_DEFAULT_SCORE: Record<ReviewDecision, number> = {
  accept: 1,
  edit: 0.5,
  reject: 0,
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: queueItemId } = await params;
    const ctx = await requireOrgContext("reviewer");
    const body = completeReviewSchema.parse(await request.json());

    const { data: queueItem, error: queueError } = await ctx.supabase
      .from("human_review_queue")
      .select("*")
      .eq("id", queueItemId)
      .eq("org_id", ctx.orgId)
      .single();
    if (queueError || !queueItem) {
      throw new OrgContextError(404, "Review item not found");
    }

    const score = body.score ?? DECISION_DEFAULT_SCORE[body.decision];

    const { error: resultError } = await ctx.supabase
      .from("eval_case_results")
      .update({
        score,
        verdict: verdictFromScore(score),
        rationale: body.notes ?? null,
        reviewer_id: ctx.userId,
      })
      .eq("run_id", queueItem.run_id)
      .eq("test_case_id", queueItem.test_case_id)
      .eq("rubric_id", queueItem.rubric_id)
      .eq("method", "human");
    if (resultError) throw resultError;

    const { data: updated, error } = await ctx.supabase
      .from("human_review_queue")
      .update({
        status: "completed",
        decision: body.decision,
        notes: body.notes ?? null,
        assigned_to: ctx.userId,
        completed_at: new Date().toISOString(),
      })
      .eq("id", queueItemId)
      .select()
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "review.completed",
      entityType: "human_review_queue",
      entityId: queueItemId,
      after: updated,
    });

    return Response.json({ item: updated });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
