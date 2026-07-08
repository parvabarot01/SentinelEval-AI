import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { createProjectSchema } from "@/lib/validation/projects";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const ctx = await requireOrgContext("viewer");
    const { data, error } = await ctx.supabase
      .from("projects")
      .select("*")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ projects: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("engineer");
    const body = createProjectSchema.parse(await request.json());
    const slug = slugify(body.name);

    const { data, error } = await ctx.supabase
      .from("projects")
      .insert({
        org_id: ctx.orgId,
        name: body.name,
        slug,
        description: body.description ?? null,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) throw error;

    await recordAudit(ctx, {
      action: "project.created",
      entityType: "project",
      entityId: data.id,
      after: data,
    });

    return Response.json({ project: data }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
