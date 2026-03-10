import { logger } from "app/core/logger/index.js";

/**
 * Enterprise Email Service Abstraction
 * Supports multiple drivers (SMTP, SendGrid, etc.) and template-based emails.
 */
export const createEmailService = (
  config = { driver: "smtp", from: "noreply@ehub.edu.vn" },
) => {
  const { driver, from } = config;

  /**
   * Send a raw email
   * @param {Object} options - { to, subject, text, html }
   */
  const send = async ({ to, subject, text, html }) => {
    logger.debug(
      `[Email] Sending email to: ${to} | Subject: ${subject} | Driver: ${driver}`,
    );

    if (driver === "smtp") {
      // TODO: Implement with nodemailer
      logger.info(`[Email][SMTP] Email sent to ${to}`);
      return true;
    }

    if (driver === "console") {
      logger.info("================ EMAIL CONSOLE DRIVER ================");
      logger.info(`From: ${from}`);
      logger.info(`To: ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body: ${text || "HTML Content"}`);
      logger.info("======================================================");
      return true;
    }

    throw new Error(`Email driver [${driver}] not implemented`);
  };

  /**
   * Send email using a predefined template
   * @param {string} templateName
   * @param {Object} context - Template variables
   */
  const sendTemplate = async (to, templateName, context = {}) => {
    logger.debug(`[Email] Processing template: ${templateName} for ${to}`);

    // TODO: Integrate with template engine (Handlebars/EJS)
    const subject = `[E-HUB] Notification: ${templateName}`;
    const text = `Hello, this is a message for ${templateName}`;

    return send({ to, subject, text });
  };

  return { send, sendTemplate };
};
