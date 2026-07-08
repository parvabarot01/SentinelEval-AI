import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/current-org";
import { VersionSwitcher, NewVersionButton } from "./VersionControls";
import { AddTestCaseForm } from "./AddTestCaseForm";
import type { EvalDataset, DatasetVersion, TestCase } from "@/lib/types";

export default async function DatasetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version: versionParam } = await searchParams;
  const orgContext = await getCurrentOrg();
  const supabase = await createClient();

  const { data: dataset } = await supabase
    .from("eval_datasets")
    .select("*")
    .eq("org_id", orgContext!.current!.orgId)
    .eq("id", id)
    .single<EvalDataset>();

  if (!dataset) notFound();

  const { data: versions } = await supabase
    .from("dataset_versions")
    .select("*")
    .eq("dataset_id", id)
    .order("version_number", { ascending: false })
    .returns<DatasetVersion[]>();

  const versionList = versions ?? [];
  const selectedVersion = versionList.find((v) => v.id === versionParam) ?? versionList[0];

  const { data: testCases } = selectedVersion
    ? await supabase
        .from("test_cases")
        .select("*")
        .eq("dataset_version_id", selectedVersion.id)
        .order("created_at", { ascending: false })
        .returns<TestCase[]>()
    : { data: [] };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-signal-white">{dataset.name}</h1>
          <p className="mt-1 text-sm text-signal-muted">{dataset.description || "No description yet."}</p>
        </div>
        <div className="flex items-center gap-3">
          {versionList.length > 0 && <VersionSwitcher datasetId={id} versions={versionList} />}
          {selectedVersion && <NewVersionButton datasetId={id} latestVersionId={selectedVersion.id} />}
        </div>
      </div>

      {selectedVersion && (
        <>
          <AddTestCaseForm datasetId={id} datasetVersionId={selectedVersion.id} />

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-signal-muted">
              Test cases — v{selectedVersion.version_number} ({(testCases ?? []).length})
            </h2>
            {(testCases ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-surface-card/40 px-6 py-8 text-center text-sm text-signal-muted">
                No test cases in this version yet.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {(testCases ?? []).map((tc) => (
                  <li key={tc.id} className="rounded-lg border border-white/5 bg-surface-card p-4">
                    <div className="text-xs uppercase tracking-wide text-signal-muted">Input</div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-signal-white">{tc.input}</p>
                    {tc.expected_output && (
                      <>
                        <div className="mt-3 text-xs uppercase tracking-wide text-signal-muted">Expected output</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-signal-white">{tc.expected_output}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
