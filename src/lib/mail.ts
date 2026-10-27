import "server-only";
import nodemailer from "nodemailer";

// Free email sending through a Gmail account (or any SMTP server).
// Gmail: turn on 2-Step Verification, create an App password, then set
// SMTP_USER=you@gmail.com and SMTP_PASS=<the 16-letter app password> in .env.

const clean = (v: string | undefined) => (v ?? "").trim().replace(/^["']|["']$/g, "");

function settings() {
  const user = clean(process.env.SMTP_USER);
  // Google shows app passwords as "abcd efgh ijkl mnop"; the spaces are not part of it
  const pass = clean(process.env.SMTP_PASS).replace(/\s+/g, "");
  const host = clean(process.env.SMTP_HOST) || "smtp.gmail.com";
  const port = Number(clean(process.env.SMTP_PORT)) || 465;
  return { user, pass, host, port };
}

export function mailConfigured() {
  const { user, pass } = settings();
  return !!(user && pass);
}

function transport(host: string, port: number, user: string, pass: string) {
  return nodemailer.createTransport({
    host, port, secure: port === 465, requireTLS: port !== 465,
    auth: { user, pass },
    connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 20_000,
  });
}

// Turns SMTP errors into a plain-language hint
export function mailProblem(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/535|Username and Password not accepted|Invalid login|BadCredentials/i.test(msg))
    return "Gmail refused the login. SMTP_PASS must be a 16-letter App password (not your normal Gmail password), and SMTP_USER must be the same Gmail address that created it.";
  if (/534|Application-specific password required/i.test(msg))
    return "Gmail wants an App password. Turn on 2-Step Verification, then create one at myaccount.google.com/apppasswords.";
  if (/ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|timeout/i.test(msg))
    return "Couldn't reach the email server. Check the internet connection; some networks block email ports.";
  return msg;
}

export async function sendMail(to: string, subject: string, text: string, html: string) {
  const { user, pass, host, port } = settings();
  if (!user || !pass) {
    // Without email set up, the message goes to the server console so you can still test locally.
    console.log(`\n[email not set up: add SMTP_USER and SMTP_PASS to .env] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { sent: false as const };
  }
  const mail = { from: clean(process.env.MAIL_FROM) || `Gaach <${user}>`, to, subject, text, html };
  try {
    await transport(host, port, user, pass).sendMail(mail);
  } catch (e) {
    // Some networks block port 465; Gmail also accepts 587
    if (port === 465 && /ETIMEDOUT|ECONNREFUSED|ECONNRESET|timeout/i.test(String(e))) {
      await transport(host, 587, user, pass).sendMail(mail);
    } else throw e;
  }
  console.log(`[email] sent "${subject}" to ${to}`);
  return { sent: true as const };
}
