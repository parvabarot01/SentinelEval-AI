// Mirrors supabase/migrations/0001_init.sql — keep in sync when the schema changes.

export type OrgRole = "owner" | "admin" | "engineer" | "reviewer" | "viewer";
export type ProjectEnvironment = "dev" | "staging" | "prod";
export type CriterionType = "llm_judge" | "programmatic" | "human";
export type ProgrammaticCheckKind = "json_schema" | "regex" | "keyword" | "groundedness" | "pii";
export type RunStatus = "queued" | "running" | "completed" | "failed";
export type ScoreMethod = "llm_judge" | "programmatic" | "human";
export type CaseVerdict = "pass" | "watch" | "block" | "pending";
export type ReviewStatus = "pending" | "completed";
export type ReviewDecision = "accept" | "edit" | "reject";
export type GuardrailDirection = "pre" | "post";
export type GuardrailDecision = "allow" | "block" | "flag";
export type PromotionStatus = "pending" | "approved" | "rejected" | "auto_blocked";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  org_id: string;
  version_label: string;
  environment: ProjectEnvironment;
  system_prompt: string;
  model: string;
  temperature: number;
  config: Record<string, unknown>;
  is_current_for_env: boolean;
  created_at: string;
  created_by: string | null;
}

export interface EvalDataset {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  tags: string[];
  created_at: string;
  created_by: string | null;
}

export interface DatasetVersion {
  id: string;
  dataset_id: string;
  org_id: string;
  version_number: number;
  note: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TestCase {
  id: string;
  dataset_id: string;
  dataset_version_id: string;
  org_id: string;
  input: string;
  expected_output: string | null;
  reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EvalSuite {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Rubric {
  id: string;
  suite_id: string;
  org_id: string;
  name: string;
  description: string | null;
  criterion_type: CriterionType;
  programmatic_kind: ProgrammaticCheckKind | null;
  weight: number;
  config: Record<string, unknown>;
  created_at: string;
}

export interface EvalRun {
  id: string;
  org_id: string;
  project_id: string;
  project_version_id: string;
  suite_id: string;
  dataset_version_id: string;
  status: RunStatus;
  triggered_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface EvalCaseResult {
  id: string;
  run_id: string;
  org_id: string;
  test_case_id: string;
  rubric_id: string;
  method: ScoreMethod;
  score: number | null;
  verdict: CaseVerdict;
  rationale: string | null;
  raw_output: string | null;
  reviewer_id: string | null;
  created_at: string;
}

export interface HumanReviewItem {
  id: string;
  org_id: string;
  run_id: string;
  test_case_id: string;
  rubric_id: string;
  assigned_to: string | null;
  status: ReviewStatus;
  decision: ReviewDecision | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GuardrailCheckConfig {
  kind: ProgrammaticCheckKind;
  threshold?: number;
  pattern?: string;
  keywords?: string[];
}

export interface GuardrailPolicy {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  checks: GuardrailCheckConfig[];
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface GuardrailLog {
  id: string;
  org_id: string;
  project_id: string;
  policy_id: string | null;
  direction: GuardrailDirection;
  input: string | null;
  output: string | null;
  decision: GuardrailDecision;
  failing_checks: Array<{ kind: string; reason: string }>;
  created_at: string;
}

export interface Promotion {
  id: string;
  org_id: string;
  project_id: string;
  from_version_id: string | null;
  to_version_id: string;
  environment: ProjectEnvironment;
  status: PromotionStatus;
  regression_summary: Record<string, unknown>;
  requested_by: string | null;
  decided_by: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  org_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
}
