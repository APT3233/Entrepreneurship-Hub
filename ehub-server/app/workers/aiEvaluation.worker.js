import { Worker } from "bullmq";
import { aiConfig } from "app/config/ai.js";
import { logger } from "app/core/logger/index.js";
import {
  AI_EVALUATION_JOB_NAME,
  createBullMqConnectionOptions,
  enqueueAiEvaluationJob,
  getAiEvaluationQueuePrefix,
} from "app/core/queues/aiEvaluation.queue.js";

export const startAiEvaluationWorker = ({ container }) => {
  const cfg = aiConfig.worker;
  if (!cfg.enabled) {
    logger.info("[AiEvaluationWorker] disabled (AI_WORKER_ENABLED=false)");
    return async () => {};
  }

  const { aiEvaluationRepository, aiEvaluationService } = container.cradle;
  let stopped = false;
  let backfillTimer = null;

  const processQueuedJob = async (bullJob) => {
    const jobId = Number(bullJob.data?.jobId);
    if (!jobId) return;

    const existing = await aiEvaluationRepository.findJobById(jobId);
    if (!existing) {
      logger.warn("[AiEvaluationWorker] DB job not found; skipping BullMQ job", { bullJobId: bullJob.id, jobId });
      return;
    }
    if (["completed", "failed"].includes(existing.status)) return;

    const attempt = Number(bullJob.attemptsMade || 0) + 1;
    const job = await aiEvaluationRepository.markJobProcessing(jobId, attempt, cfg.maxAttempts);
    if (!job) {
      logger.warn("[AiEvaluationWorker] DB job cannot be marked processing; skipping BullMQ job", {
        bullJobId: bullJob.id,
        jobId,
      });
      return;
    }

    try {
      await aiEvaluationService.processJob(job);
    } catch (err) {
      logger.error("[AiEvaluationWorker] job failed", {
        err,
        jobId: job.id,
        targetType: job.target_type,
        targetId: job.target_id,
        attempt,
      });
      const finalAttempt = attempt >= cfg.maxAttempts;
      const { retry } = await aiEvaluationService.handleJobFailure({ ...job, attempts: attempt }, err, { finalAttempt });
      if (!retry) bullJob.discard();
      throw err;
    }
  };

  const worker = new Worker(cfg.queueName, processQueuedJob, {
    connection: createBullMqConnectionOptions(),
    prefix: getAiEvaluationQueuePrefix(),
    concurrency: cfg.maxConcurrentJobs,
  });

  const backfillPendingJobs = async () => {
    if (stopped) return;
    await aiEvaluationRepository.resetStaleJobs(cfg.staleProcessingMinutes, cfg.maxAttempts);
    const rows = await aiEvaluationRepository.listPendingJobsForQueue(
      Math.max(10, cfg.maxConcurrentJobs * 10),
      cfg.maxAttempts,
    );
    await Promise.all(rows.map((row) => enqueueAiEvaluationJob(row.id)));
  };

  const runBackfill = () => backfillPendingJobs().catch((err) => {
    logger.error("[AiEvaluationWorker] pending job backfill failed", { err });
  });

  worker.on("completed", (job) => logger.info("[AiEvaluationWorker] BullMQ job completed", { bullJobId: job.id }));
  worker.on("failed", (job, err) => logger.warn("[AiEvaluationWorker] BullMQ job failed", { err, bullJobId: job?.id }));
  worker.on("error", (err) => logger.error("[AiEvaluationWorker] BullMQ worker error", { err }));

  logger.info("[AiEvaluationWorker] starting BullMQ worker", {
    queueName: cfg.queueName,
    jobName: AI_EVALUATION_JOB_NAME,
    concurrency: cfg.maxConcurrentJobs,
    maxAttempts: cfg.maxAttempts,
    backfillMs: cfg.backfillMs,
  });

  if (cfg.backfillMs > 0) backfillTimer = setInterval(runBackfill, cfg.backfillMs);
  runBackfill();

  return async () => {
    stopped = true;
    if (backfillTimer) clearInterval(backfillTimer);
    await Promise.race([
      worker.close(),
      new Promise((resolve) => setTimeout(resolve, cfg.shutdownGraceMs)),
    ]);
  };
};
