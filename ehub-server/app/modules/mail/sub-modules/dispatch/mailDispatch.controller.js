import { mailDispatchRedisChannel } from "app/core/constants/mailPipeline.js";
import { sendSuccess } from "app/core/utils/apiResponse.js";
import { catchAsync } from "app/core/utils/catchAsync.js";

export const createMailDispatchController = ({ mailDispatchService, redis }) => {
  const progress = catchAsync(async (req, res) => {
    const data = await mailDispatchService.getProgress(req.params.publicId, req.user);
    return sendSuccess(res, { data, message: "Mail dispatch progress" });
  });

  const stream = catchAsync(async (req, res) => {
    const { publicId } = req.params;
    await mailDispatchService.assertCanView(publicId, req.user);
    const channel = mailDispatchRedisChannel(publicId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    const sub = redis.duplicate();
    await sub.subscribe(channel);

    try {
      const snapshot = await mailDispatchService.getProgress(publicId, req.user);
      res.write(`data: ${JSON.stringify({ event: "snapshot", ...snapshot })}\n\n`);
    } catch {
      /* assertCanView already passed; ignore snapshot errors */
    }

    const send = (payload) => {
      res.write(`data: ${typeof payload === "string" ? payload : JSON.stringify(payload)}\n\n`);
    };

    const onMessage = (_ch, message) => send(message);
    sub.on("message", onMessage);

    const hb = setInterval(() => {
      res.write(": ping\n\n");
    }, 20000);

    req.on("close", () => {
      clearInterval(hb);
      sub.removeListener("message", onMessage);
      sub.unsubscribe(channel).catch(() => {});
      sub.quit().catch(() => {});
    });
  });

  return { progress, stream };
};
