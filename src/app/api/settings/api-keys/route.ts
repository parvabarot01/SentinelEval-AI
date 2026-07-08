import { z } from "zod";
import { requireOrgContext, orgContextErrorResponse } from "@/lib/auth/org-context";
import { recordAudit } from "@/lib/audit";
import { generateApiKey } from "@/lib/api-keys";

const createSchema = z.object({ name: z.string().min(2).max(80) });

export async function GET() {
  try {
    const ctx = await requireOrgContext("admin");
    const { data, error } = await ctx.supabase
      .from("api_keys")
      .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ keys: data });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireOrgContext("admin");
    const body = createSchema.parse(await request.json());
    const { plaintext, hash, prefix } = generateApiKey();

    const { data, error } = await ctx.supabase
      .from("api_keys")
      .insert({
        org_id: ctx.orgId,
        name: body.name,
        key_hash: hash,
        key_prefix: prefix,
        created_by: ctx.userId,
      })
      .select("id, name, key_prefix, created_at")
      .single();
    if (error) throw error;

    await recordAudit(ctx, {
      action: "api_key.created",
      entityType: "api_key",
      entityId: data.id,
      after: { name: data.name, key_prefix: data.key_prefix },
    });

    // plaintext is returned exactly once — the server never stores it
    return Response.json({ key: { ...data, plaintext } }, { status: 201 });
  } catch (error) {
    return orgContextErrorResponse(error);
  }
}
