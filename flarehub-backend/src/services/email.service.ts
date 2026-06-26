import { Resend } from 'resend';
import { appConfig } from '../config/index.js';

const resend = appConfig.email.apiKey ? new Resend(appConfig.email.apiKey) : null;

export interface SendEmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  if (!resend) throw new Error('Resend API key not configured');

  const { error } = await resend.emails.send({
    from:    appConfig.email.from,
    to:      payload.to,
    subject: payload.subject,
    html:    payload.html,
  });

  if (error) throw new Error(error.message);
}

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f7f6f3;font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f6f3;">
    <tr>
      <td align="center" style="padding:40px 16px 60px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <tr>
            <td style="background:#1d6f42;border-radius:14px 14px 0 0;padding:24px 36px;">
              <span style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;font-family:Georgia,'Times New Roman',serif;">Afosihub</span>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:36px 36px 32px;border-left:1px solid #e2ddd7;border-right:1px solid #e2ddd7;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background:#f0ede8;border:1px solid #e2ddd7;border-top:none;border-radius:0 0 14px 14px;padding:18px 36px;">
              <p style="margin:0;font-size:10px;color:#a39e98;font-family:ui-monospace,'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;">
                Afosihub &nbsp;&middot;&nbsp; Kenya &nbsp;&middot;&nbsp; <a href="https://app.afosihub.com" style="color:#a39e98;text-decoration:none;">app.afosihub.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function badge(label: string, bg: string, color: string): string {
  return `<div style="display:inline-block;padding:5px 12px;border-radius:6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;font-family:ui-monospace,'Courier New',monospace;background:${bg};color:${color};margin-bottom:20px;">${label}</div>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#1a1916;letter-spacing:-0.02em;line-height:1.1;font-family:Georgia,'Times New Roman',serif;">${text}</h1>`;
}

function body(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;color:#6b6560;line-height:1.65;">${text}</p>`;
}

function cta(label: string, url: string, bg = '#1d6f42'): string {
  return `<a href="${url}" style="display:inline-block;padding:13px 26px;background:${bg};color:#ffffff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;margin-top:8px;">${label} &rarr;</a>`;
}

function divider(): string {
  return `<div style="border-top:1px solid #e2ddd7;margin:28px 0;"></div>`;
}

function sig(): string {
  return `<p style="margin:0;font-size:13px;color:#a39e98;">&#8212; The Afosihub Team</p>`;
}

// ── Email templates ───────────────────────────────────────────────────────────

export function applicationApprovedEmail(firstName: string, programName: string): string {
  return shell(`
    ${badge('Approved', '#edf7f1', '#1d6f42')}
    ${heading(`Congratulations, ${firstName}!`)}
    ${body(`Your application for <strong style="color:#1a1916;">${programName}</strong> has been approved. Welcome to the program.`)}
    ${body('Log in to your dashboard to view your program details, next steps, and connect with your cohort.')}
    ${cta('Go to Dashboard', 'https://app.afosihub.com/dashboard')}
    ${divider()}
    ${sig()}
  `);
}

export function applicationRejectedEmail(firstName: string, programName: string): string {
  return shell(`
    ${badge('Application Update', '#fdf2ed', '#c4522a')}
    ${heading(`Hi ${firstName}`)}
    ${body(`Thank you for applying to <strong style="color:#1a1916;">${programName}</strong>. After careful review, we were unable to move forward with your application at this time.`)}
    ${body('We encourage you to keep building and apply to future programs — there will be more opportunities ahead.')}
    ${cta('View Open Programs', 'https://app.afosihub.com/programs', '#c4522a')}
    ${divider()}
    ${sig()}
  `);
}

export function applicationUnderReviewEmail(firstName: string, programName: string): string {
  return shell(`
    ${badge('Under Review', '#fef9ee', '#d97706')}
    ${heading(`Your application is being reviewed`)}
    ${body(`Hi ${firstName}, your application for <strong style="color:#1a1916;">${programName}</strong> is now under review by our team.`)}
    ${body('We will notify you as soon as a decision has been made. This usually takes a few business days.')}
    ${divider()}
    ${sig()}
  `);
}

export function mentorAssignedEmail(firstName: string, mentorName: string): string {
  return shell(`
    ${badge('Mentor Assigned', '#edf7f1', '#1d6f42')}
    ${heading(`Meet your mentor`)}
    ${body(`Hi ${firstName}, you have been paired with <strong style="color:#1a1916;">${mentorName}</strong> as your Afosihub mentor.`)}
    ${body('Your mentor will reach out to schedule your first session. You can also send them a message directly on Afosihub.')}
    ${cta('Message Mentor', 'https://app.afosihub.com/messages')}
    ${divider()}
    ${sig()}
  `);
}

export function meetingScheduledEmail(firstName: string, mentorName: string, meetingTime: Date, link?: string | null): string {
  const timeStr = meetingTime.toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' });
  const linkBlock = link
    ? `<div style="margin:20px 0;padding:14px 18px;background:#f7f6f3;border-radius:10px;border:1px solid #e2ddd7;">
        <p style="margin:0 0 4px;font-size:10px;font-family:ui-monospace,'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;color:#a39e98;">Join link</p>
        <a href="${link}" style="font-size:14px;color:#1d6f42;word-break:break-all;">${link}</a>
      </div>`
    : '';
  return shell(`
    ${badge('Meeting Scheduled', '#edf7f1', '#1d6f42')}
    ${heading('You have a meeting')}
    ${body(`Hi ${firstName}, your mentor <strong style="color:#1a1916;">${mentorName}</strong> has scheduled a session with you.`)}
    <div style="margin:20px 0;padding:14px 18px;background:#f7f6f3;border-radius:10px;border:1px solid #e2ddd7;">
      <p style="margin:0 0 4px;font-size:10px;font-family:ui-monospace,'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;color:#a39e98;">When</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#1a1916;font-family:Georgia,'Times New Roman',serif;">${timeStr}</p>
    </div>
    ${linkBlock}
    ${cta('View Meeting', 'https://app.afosihub.com/meetings')}
    ${divider()}
    ${sig()}
  `);
}

export function evidenceVerifiedEmail(firstName: string): string {
  return shell(`
    ${badge('Verified', '#edf7f1', '#1d6f42')}
    ${heading('Evidence verified')}
    ${body(`Hi ${firstName}, your uploaded evidence has been reviewed and <strong style="color:#1a1916;">verified</strong> by our team.`)}
    ${cta('View Evidence', 'https://app.afosihub.com/evidence')}
    ${divider()}
    ${sig()}
  `);
}

export function evidenceRejectedEmail(firstName: string, notes?: string | null): string {
  const notesBlock = notes
    ? `<div style="margin:20px 0;padding:14px 18px;background:#fdf2ed;border-radius:10px;border:1px solid #f9ddd1;">
        <p style="margin:0 0 4px;font-size:10px;font-family:ui-monospace,'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;color:#c4522a;">Reviewer notes</p>
        <p style="margin:0;font-size:14px;color:#1a1916;line-height:1.6;">${notes}</p>
      </div>`
    : '';
  return shell(`
    ${badge('Needs Revision', '#fdf2ed', '#c4522a')}
    ${heading('Evidence needs attention')}
    ${body(`Hi ${firstName}, your uploaded evidence requires revision before it can be verified.`)}
    ${notesBlock}
    ${body('Please log in and upload a revised version.')}
    ${cta('View Evidence', 'https://app.afosihub.com/evidence', '#c4522a')}
    ${divider()}
    ${sig()}
  `);
}

export function announcementEmail(firstName: string, title: string, bodyText: string): string {
  return shell(`
    ${badge('Announcement', '#edf7f1', '#1d6f42')}
    ${heading(title)}
    ${body(`Hi ${firstName},`)}
    ${body(bodyText)}
    ${cta('View Announcements', 'https://app.afosihub.com/announcements')}
    ${divider()}
    ${sig()}
  `);
}

export function newProgramEmail(firstName: string, programName: string): string {
  return shell(`
    ${badge('New Program', '#edf7f1', '#1d6f42')}
    ${heading('A new program just launched')}
    ${body(`Hi ${firstName}, a new program is now open on Afosihub: <strong style="color:#1a1916;">${programName}</strong>.`)}
    ${body('Spots are limited — check eligibility and apply before the deadline.')}
    ${cta('View Program', 'https://app.afosihub.com/programs')}
    ${divider()}
    ${sig()}
  `);
}
