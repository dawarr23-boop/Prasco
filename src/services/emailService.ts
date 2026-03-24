import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import Setting from '../models/Setting';

interface MeetingNotificationPayload {
  postTitle: string;
  postContent?: string;
  authorName: string;
  postId: number;
}

async function getSmtpConfig(): Promise<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
} | null> {
  const keys = [
    'smtp.host',
    'smtp.port',
    'smtp.secure',
    'smtp.user',
    'smtp.pass',
    'smtp.from',
  ];
  const rows = await Setting.findAll({ where: { key: keys } });
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[r.key] = r.value; });

  if (!map['smtp.host'] || !map['smtp.user'] || !map['smtp.pass']) {
    return null;
  }

  return {
    host: map['smtp.host'],
    port: parseInt(map['smtp.port'] || '587', 10),
    secure: map['smtp.secure'] === 'true',
    user: map['smtp.user'],
    pass: map['smtp.pass'],
    from: map['smtp.from'] || map['smtp.user'],
  };
}

async function getMeetingRecipients(organizationId?: number): Promise<string[]> {
  const key = organizationId
    ? `meeting.recipients.${organizationId}`
    : 'meeting.recipients';

  // Try organization-specific first, then fall back to global
  let row = await Setting.findOne({ where: { key } });
  if (!row && organizationId) {
    row = await Setting.findOne({ where: { key: 'meeting.recipients' } });
  }

  if (!row || !row.value.trim()) return [];

  return row.value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

export async function sendMeetingNotification(
  payload: MeetingNotificationPayload,
  organizationId?: number
): Promise<void> {
  try {
    const config = await getSmtpConfig();
    if (!config) {
      logger.warn('[emailService] SMTP nicht konfiguriert – Meeting-Benachrichtigung übersprungen');
      return;
    }

    const recipients = await getMeetingRecipients(organizationId);
    if (recipients.length === 0) {
      logger.warn('[emailService] Keine Meeting-Empfänger konfiguriert – Benachrichtigung übersprungen');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const contentSnippet = payload.postContent
      ? payload.postContent.replace(/<[^>]*>/g, '').trim().substring(0, 500)
      : '';

    const dashboardUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/admin`
      : '';

    const html = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: #4a7c4a; color: #fff; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 1.3rem; }
  .body { padding: 28px 32px; }
  .post-title { font-size: 1.15rem; font-weight: bold; color: #2a4a2a; margin-bottom: 12px; }
  .post-snippet { background: #f8faf8; border-left: 4px solid #4a7c4a; padding: 12px 16px; margin: 16px 0; color: #555; font-size: 0.92rem; line-height: 1.6; }
  .meta { color: #888; font-size: 0.85rem; margin-bottom: 20px; }
  .cta { background: #4a7c4a; color: #fff; display: inline-block; padding: 10px 22px; border-radius: 5px; text-decoration: none; font-size: 0.95rem; margin-top: 8px; }
  .footer { padding: 16px 32px; background: #f0f4f0; color: #999; font-size: 0.78rem; text-align: center; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>📅 Neuer Agendapunkt – Dienstagsmeeting</h1>
    </div>
    <div class="body">
      <p>Hallo,</p>
      <p>es wurde ein neuer Beitrag in der Kategorie <strong>Dienstagsmeeting</strong> veröffentlicht. Bitte prüfen Sie, ob dieser Punkt auf die Agenda aufgenommen werden soll:</p>
      <div class="post-title">${escapeHtml(payload.postTitle)}</div>
      ${contentSnippet ? `<div class="post-snippet">${escapeHtml(contentSnippet)}${payload.postContent && payload.postContent.length > 500 ? ' …' : ''}</div>` : ''}
      <p class="meta">Erstellt von: <strong>${escapeHtml(payload.authorName)}</strong></p>
      ${dashboardUrl ? `<a class="cta" href="${dashboardUrl}">Im Admin-Panel öffnen</a>` : ''}
    </div>
    <div class="footer">
      Diese Nachricht wurde automatisch von PRASCO Digital Signage versandt.
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: config.from,
      to: recipients.join(', '),
      subject: `Dienstagsmeeting: Neuer Agendapunkt – ${payload.postTitle}`,
      html,
    });

    logger.info(
      `[emailService] Meeting-Benachrichtigung gesendet an ${recipients.length} Empfänger für Post #${payload.postId}`
    );
  } catch (error) {
    logger.error('[emailService] Fehler beim Senden der Meeting-Benachrichtigung:', error);
    // Non-fatal: don't re-throw, the post was already saved
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
