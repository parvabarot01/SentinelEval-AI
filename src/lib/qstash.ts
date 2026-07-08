import { Client } from "@upstash/qstash";

let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client({ token: process.env.QSTASH_TOKEN! });
  }
  return client;
}

/** Enqueues an eval run for async execution by /api/jobs/run-eval. */
export async function enqueueEvalRun(runId: string) {
  const qstash = getClient();
  await qstash.publishJSON({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/jobs/run-eval`,
    body: { runId },
  });
}
