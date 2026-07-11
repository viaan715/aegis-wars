// Sends transactional email via the Resend API (https://resend.com/docs/api-reference/emails/send-email).
// Requires RESEND_API_KEY. RESEND_FROM_EMAIL defaults to Resend's shared
// onboarding@resend.dev sender, which works without verifying a custom
// domain — fine for getting started, but emails from it can look less
// trustworthy to recipients, so set your own verified domain in production.
const RESEND_API_URL = 'https://api.resend.com/emails';

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const err = new Error('RESEND_API_KEY is not configured on the server');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Resend API error (${response.status}): ${body}`);
    err.code = 'EMAIL_API_ERROR';
    throw err;
  }

  return response.json();
}

export function sendVerificationEmail(to, verifyUrl) {
  return sendEmail({
    to,
    subject: 'Verify your email — Smart Meal Planner',
    html: `<p>Welcome! Confirm your email address to finish setting up your account.</p>
<p><a href="${verifyUrl}">Verify your email</a></p>
<p>If you didn't create this account, you can ignore this email.</p>`,
  });
}

export function sendPasswordResetEmail(to, resetUrl) {
  return sendEmail({
    to,
    subject: 'Reset your password — Smart Meal Planner',
    html: `<p>Someone requested a password reset for this account.</p>
<p><a href="${resetUrl}">Choose a new password</a></p>
<p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
}
