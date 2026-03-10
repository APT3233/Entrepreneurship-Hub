import { optional, toInt, toBool } from './validate.js'

export const mailConfig = Object.freeze({
  driver:   optional('MAIL_DRIVER', 'smtp'), // smtp | ses
  from:     optional('MAIL_FROM', 'noreply@eprofile.dev'),
  smtp: {
    host:   optional('SMTP_HOST', 'localhost'),
    port:   toInt(optional('SMTP_PORT', '587'), 587),
    secure: toBool(process.env.SMTP_SECURE, false),
    auth: {
      user: optional('SMTP_USER', ''),
      pass: optional('SMTP_PASS', ''),
    },
  },
})