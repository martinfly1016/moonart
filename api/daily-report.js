import { generateDailyReport } from '../scripts/daily-report.mjs';

function cleanSecretValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^[A-Z0-9_]+=/i.test(trimmed)) return trimmed.split('=').slice(1).join('=').trim();
  if (/^[A-Z0-9_]+:/i.test(trimmed)) return trimmed.split(':').slice(1).join(':').trim();
  return trimmed.replace(/^Bearer\s+/i, '').trim();
}

async function sendEmail({ subject, markdown, html }) {
  const apiKey = cleanSecretValue(process.env.AGENTMAIL_API_KEY);
  const inboxId = process.env.AGENTMAIL_INBOX_ID;
  const to = process.env.REPORT_EMAIL_TO;
  if (!apiKey || !inboxId || !to) {
    throw new Error('Missing AGENTMAIL_API_KEY, AGENTMAIL_INBOX_ID, or REPORT_EMAIL_TO.');
  }

  const response = await fetch(`https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inboxId)}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: to.split(',').map((item) => item.trim()).filter(Boolean),
      subject,
      text: markdown,
      html,
      labels: ['mojimoon-daily-report']
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Email send failed: ${JSON.stringify(data)}`);
  return data;
}

export default async function handler(request, response) {
  try {
    if (process.env.CRON_SECRET) {
      const auth = request.headers.authorization || '';
      if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        response.status(401).json({ ok: false, error: 'Unauthorized' });
        return;
      }
    }

    const report = await generateDailyReport();
    const email = await sendEmail(report);
    response.status(200).json({
      ok: true,
      subject: report.subject,
      email
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      ok: false,
      error: error.message
    });
  }
}
