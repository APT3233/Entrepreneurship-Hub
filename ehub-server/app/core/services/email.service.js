import nodemailer from "nodemailer";
import { logger } from "app/core/logger/index.js";

/**
 * Email abstraction: SMTP (nodemailer) or console driver for development.
 */
export const createEmailService = (config = {}) => {
  const {
    driver = "console",
    from = "noreply@ehub.edu.vn",
    smtp = {},
    enabled = true,
  } = config;

  let transporter = null;
  const getTransporter = () => {
    if (transporter) return transporter;
    const { host, port, secure, user, pass, pool, maxConnections, maxMessages } = smtp;
    if (!host) {
      logger.warn("[Email] SMTP host missing; falling back to console-style log only");
      return null;
    }
    transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      pool: pool !== false,
      maxConnections: Math.max(1, Number(maxConnections) || 5),
      maxMessages: Math.max(1, Number(maxMessages) || 100),
      auth: user && pass ? { user, pass } : undefined,
    });
    return transporter;
  };

  const send = async ({ to, subject, text, html, headers }) => {
    if (!enabled) {
      logger.info(`[Email][disabled] skip send to=${to} subject=${subject}`);
      return true;
    }

    logger.debug(`[Email] to=${to} subject=${subject} driver=${driver}`);

    if (driver === "smtp") {
      const tx = getTransporter();
      if (!tx) {
        logger.info(`[Email][fallback] To: ${to} | ${subject}`);
        return false;
      }
      await tx.sendMail({ from, to, subject, text, html, ...(headers && { headers }) });
      logger.info(`[Email][SMTP] sent to ${to}`);
      return true;
    }

    if (driver === "console") {
      logger.info("================ EMAIL CONSOLE DRIVER ================");
      logger.info(`From: ${from}`);
      logger.info(`To: ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body: ${text || "(html)"}`);
      if (headers) logger.info(`Headers: ${JSON.stringify(headers)}`);
      logger.info("======================================================");
      return true;
    }

    throw new Error(`Email driver [${driver}] not implemented`);
  };

  const sendTemplate = async (to, templateName, context = {}) => {
    logger.debug(`[Email] template=${templateName} to=${to}`);
    const subject = `[E-HUB] Notification: ${templateName}`;
    const text = `Hello, this is a message for ${templateName} (${JSON.stringify(context)})`;
    return send({ to, subject, text });
  };

  return { send, sendTemplate };
};
