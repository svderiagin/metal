import nodemailer, {type SendMailOptions} from "nodemailer";
import {isValidEmail} from "@/lib/validation";

export function readSmtpConfig(env: Record<string, string | undefined> = process.env) {
  const port = Number(env.SMTP_PORT || "465");
  const from = env.SMTP_FROM?.trim() ?? "";
  const recipient = env.NOTIFICATION_RECIPIENT_EMAIL?.trim() ?? "";
  if (env.NOTIFICATION_PROVIDER !== "smtp" || !env.SMTP_HOST?.trim() || !env.SMTP_USER || !env.SMTP_PASSWORD
    || !isValidEmail(from) || !isValidEmail(recipient) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
  return {from, recipient, options: {
    host: env.SMTP_HOST.trim(), port, secure: port === 465, requireTLS: port !== 465,
    auth: {user: env.SMTP_USER, pass: env.SMTP_PASSWORD},
    connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 15_000,
    disableFileAccess: true, disableUrlAccess: true,
  }};
}

export const smtpMailer = {
  async send(message: SendMailOptions): Promise<void> {
    const config = readSmtpConfig();
    const transport = nodemailer.createTransport(config.options);
    try {
      const result = await transport.sendMail({...message, from: {name: "RWB-METAL", address: config.from}});
      const to = typeof message.to === "string" ? message.to : "";
      const accepted = result.accepted;
      if (!accepted.includes(to)) throw new Error("EMAIL_RECIPIENT_REJECTED");
    } finally {transport.close();}
  },
};
