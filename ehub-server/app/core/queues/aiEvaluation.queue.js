import { Queue } from "bullmq";
import { aiConfig } from "app/config/ai.js";
import { redisConfig } from "app/config/redis.js";

export const AI_EVALUATION_JOB_NAME = "analyze-submission";

const redisPrefix = () => String(redisConfig.keyPrefix || "ep:").replace(/:+$/g, "");

export const getAiEvaluationQueuePrefix = () => {
  const prefix = redisPrefix();
  return prefix ? `${prefix}:bull` : "bull";
};

export const createBullMqConnectionOptions = () => ({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  maxRetriesPerRequest: null,
  retryStrategy: redisConfig.retryStrategy,
});

export const getAiEvaluationJobId = (jobId) => `ai-analysis-${Number(jobId)}`;

let queue = null;

export const getAiEvaluationQueue = () => {
  if (!queue) {
    queue = new Queue(aiConfig.worker.queueName, {
      connection: createBullMqConnectionOptions(),
      prefix: getAiEvaluationQueuePrefix(),
    });
  }
  return queue;
};

export const enqueueAiEvaluationJob = async (jobId) => getAiEvaluationQueue().add(
  AI_EVALUATION_JOB_NAME,
  { jobId: Number(jobId) },
  {
    jobId: getAiEvaluationJobId(jobId),
    attempts: aiConfig.worker.maxAttempts,
    backoff: { type: "fixed", delay: 120_000 },
    removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
    removeOnFail: { age: 7 * 24 * 60 * 60, count: 1000 },
  },
);

export const closeAiEvaluationQueue = async () => {
  if (!queue) return;
  await queue.close();
  queue = null;
};
