// Email is disabled until SMTP variables and user email addresses are configured.
import nodemailer from 'nodemailer';
export async function sendEmail(userId, subject, text) {
  const address = userId === 'demo-donor' ? process.env.DEMO_DONOR_EMAIL : process.env.DEMO_RECIPIENT_EMAIL;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (!address || !SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) return false;
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transporter.sendMail({ from: EMAIL_FROM, to: address, subject, text });
  return true;
}
