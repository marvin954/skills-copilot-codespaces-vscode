import "dotenv/config";
import type { Job } from "bullmq";
import {
  createWorker,
  QUEUE_NAMES,
} from "../lib/queue.js";
import type { WorkflowJob } from "../workflows/orchestrator.js";
import {
  runLeadPipeline,
  runDiscoverSync,
  runCloseAndOnboard,
} from "../workflows/orchestrator.js";

async function processWorkflow(job: Job<WorkflowJob>) {
  const data = job.data;

  switch (data.type) {
    case "full_pipeline":
      await runLeadPipeline({
        organizationId: data.organizationId,
        leadId: data.leadId,
      });
      break;
    case "discover":
      await runDiscoverSync(
        data.organizationId,
        data.source as "GOOGLE_MAPS",
        data.query!,
        data.limit ?? 5,
        { location: data.location, industry: data.industry }
      );
      break;
    case "close_and_onboard":
      await runCloseAndOnboard(
        data.organizationId,
        data.leadId,
        data.amount!
      );
      break;
  }
}

console.log("Starting sales-agent workers...");

createWorker(QUEUE_NAMES.WORKFLOW, processWorkflow, 2);

console.log(`Listening on queue: ${QUEUE_NAMES.WORKFLOW}`);
