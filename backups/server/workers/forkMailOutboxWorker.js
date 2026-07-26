/**
 * Spawns mail outbox worker as a separate Node process when OUTBOX_WORKER_IN_API=false.
 * Inherits process.env from parent (same as dev:linux sourcing .env.linux before server).
 */
import { fork } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appConfig } from "app/config/app.js";
import { logger } from "app/core/logger/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EHUB_ROOT = resolve(__dirname, "../..");
const MAIL_ENTRY = resolve(__dirname, "mailOutbox.entry.js");

export const forkMailOutboxWorker = () => {
  const child = fork(MAIL_ENTRY, [], {
    cwd: EHUB_ROOT,
    env: { ...process.env, EHUB_MAIL_OUTBOX_CHILD: "1" },
    stdio: "inherit",
    execArgv: process.execArgv,
  });

  child.on("error", (err) => logger.error({ err }, "[mailOutboxChild] fork/process error"));
  child.on("exit", (code, signal) => {
    if (signal !== "SIGTERM" && code !== 0) logger.warn({ code, signal }, "[mailOutboxChild] exited");
  });
  logger.info({ pid: child.pid }, "[Bootstrap] mail outbox worker spawned (child process)");
  logger.warn("[Bootstrap] OUTBOX_WORKER_IN_API=false: each API instance forks one mail worker — scale replicas with care.");

  return async () => {
    const grace = Math.max(0, Number(appConfig.outbox.workerShutdownGraceMs) || 25_000);
    if (child.exitCode == null && child.signalCode == null) child.kill("SIGTERM");
    await new Promise((resolvePromise) => {
      const onExit = () => resolvePromise();
      child.once("exit", onExit);
      setTimeout(() => {
        child.removeListener("exit", onExit);
        if (child.exitCode == null && child.signalCode == null) child.kill("SIGKILL");
        resolvePromise();
      }, grace);
    });
  };
};
