import { aiConfig } from "app/config/ai.js";
import { logger } from "app/core/logger/index.js";

const POLL_LOCK_KEY = "ehub:ai:evaluation:poll";
const POLL_LOCK_RELEASE = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

export const startAiEvaluationWorker = ({ redis, container }) => {
  const cfg = aiConfig.worker;
  if (!cfg.enabled) {
    logger.info("[AiEvaluationWorker] disabled (AI_WORKER_ENABLED=false)");
    return async () => {};
  }

  const { aiEvaluationRepository, aiEvaluationService } = container.cradle;
  let stopped = false;
  let timer = null;
  const inFlight = new Set();

  const processOneTick = async () => {
    let lockToken = null;
    if (redis) {
      lockToken = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const ok = await redis.set(POLL_LOCK_KEY, lockToken, "EX", Math.max(10, cfg.lockTtlSec), "NX");
      if (ok !== "OK") return;
    }

    try {
      await aiEvaluationRepository.resetStaleJobs(cfg.staleProcessingMinutes, cfg.maxAttempts);
      for (let i = 0; i < cfg.maxRowsPerTick && !stopped; i += 1) {
        const job = await aiEvaluationRepository.claimNextJob(cfg.maxAttempts);
        if (!job) break;
        try {
          await aiEvaluationService.processJob(job);
        } catch (err) {
          logger.error("[AiEvaluationWorker] job failed", {
            err,
            jobId: job.id,
            targetType: job.target_type,
            targetId: job.target_id,
          });
          await aiEvaluationService.handleJobFailure(job, err);
        }
      }
    } finally {
      if (redis && lockToken) {
        try {
          await redis.eval(POLL_LOCK_RELEASE, 1, POLL_LOCK_KEY, lockToken);
        } catch (err) {
          logger.warn("[AiEvaluationWorker] poll lock release failed", { err });
        }
      }
    }
  };

  const tick = () => {
    if (stopped) return;
    const run = processOneTick().catch((err) => logger.error("[AiEvaluationWorker] tick error", { err }));
    inFlight.add(run);
    run.finally(() => inFlight.delete(run));
  };

  logger.info("[AiEvaluationWorker] starting", {
    intervalMs: cfg.pollMs,
    maxRowsPerTick: cfg.maxRowsPerTick,
    maxConcurrentJobs: cfg.maxConcurrentJobs,
    maxAttempts: cfg.maxAttempts,
    staleProcessingMinutes: cfg.staleProcessingMinutes,
  });
  timer = setInterval(tick, cfg.pollMs);
  tick();

  return async () => {
    stopped = true;
    if (timer) clearInterval(timer);
    if (!inFlight.size) return;
    await Promise.race([
      Promise.allSettled([...inFlight]),
      new Promise((resolve) => setTimeout(resolve, cfg.shutdownGraceMs)),
    ]);
  };
};
