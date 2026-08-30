import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD не заданы в переменных окружения");
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendMail(options: { to: string; subject: string; html: string }): Promise<void> {
  const fromAddress = process.env.MAIL_FROM || "info@ruskist.ru";
  await getTransporter().sendMail({
    from: `"ПО «Рускисть»" <${fromAddress}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export const MANAGER_EMAIL = "manager@ruskist.ru";
