import 'dotenv/config';
import nodemailer from 'nodemailer';

function humanizeFieldName(key) {
  return String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replaceAll('_', ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function formatAnswerValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value ?? '').trim();
}

function createAnswersMarkup(answers = {}) {
  return Object.entries(answers)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined))
    .map(([key, value]) => {
      return `<tr><td style="padding:8px 10px;border:1px solid #d6d9de;font-weight:700;">${humanizeFieldName(key)}</td><td style="padding:8px 10px;border:1px solid #d6d9de;">${formatAnswerValue(value)}</td></tr>`;
    })
    .join('');
}

function createAnswersText(answers = {}) {
  return Object.entries(answers)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined))
    .map(([key, value]) => `${humanizeFieldName(key)}: ${formatAnswerValue(value)}`)
    .join('\n');
}

function isMailerConfigured() {
  return Boolean(
    process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS
    && process.env.ADMIN_EMAIL
  );
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendWorkoutPlanRequestEmail(request) {
  if (!isMailerConfigured()) {
    return {
      emailStatus: 'skipped',
      emailError: 'SMTP or admin email configuration is missing.'
    };
  }

  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME;
  const subject = `New workout plan request from ${request.fullName}`;
  const htmlAnswers = createAnswersMarkup(request.answers);
  const textAnswers = createAnswersText(request.answers);

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: process.env.ADMIN_EMAIL,
    replyTo: request.email,
    subject,
    text: [
      `A new personalized workout plan request was submitted by ${request.fullName}.`,
      '',
      `Reply to: ${request.email}`,
      '',
      textAnswers
    ].join('\n'),
    html: `
      <div style="font-family:Manrope,Arial,sans-serif;color:#1c2333;">
        <h2 style="margin-bottom:8px;">New Workout Plan Request</h2>
        <p style="margin-top:0;">${request.fullName} submitted a personalized workout plan request.</p>
        <p><strong>Reply to:</strong> <a href="mailto:${request.email}">${request.email}</a></p>
        <table style="border-collapse:collapse;width:100%;max-width:860px;">
          <tbody>${htmlAnswers}</tbody>
        </table>
      </div>
    `
  });

  return {
    emailStatus: 'sent',
    emailError: ''
  };
}
