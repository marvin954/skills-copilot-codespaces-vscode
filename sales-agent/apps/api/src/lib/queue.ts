import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const QUEUE_NAMES = {
  WORKFLOW: "sales-workflow",
  OUTREACH: "sales-outreach",
  RESEARCH: "sales-research",
} as const;

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export function createWorker<T>(
  name: string,
  processor: (job: Job<T>) => Promise<void>,
  concurrency = 3
) {
  return new Worker(name, processor, { connection, concurrency });
}

export { connection };
