import { Resend } from 'resend';
import { appConfig } from '../config/index.js';

const resend = appConfig.email.apiKey ? new Resend(appConfig.email.apiKey) : null;

export interface SendEmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  if (!resend) return; // Silently skip if not configured

  try {
    await resend.emails.send({
      from: appConfig.email.from,
      to:   payload.to,
      subject: payload.subject,
      html:    payload.html,
    });
  } catch (err) {
    // Email failure should never crash the app
    console.error('Email send failed:', err);
  }
}

export function applicationApprovedEmail(firstName: string, programName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16a34a">Congratulations, ${firstName}!</h2>
      <p>Your application for <strong>${programName}</strong> has been <strong>approved</strong>.</p>
      <p>Log in to your Flarehub account to view your program details and next steps.</p>
      <a href="https://flarehub.org/dashboard" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none">Go to Dashboard</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function applicationRejectedEmail(firstName: string, programName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#dc2626">Application Update</h2>
      <p>Hi ${firstName}, we regret to inform you that your application for <strong>${programName}</strong> was not successful this time.</p>
      <p>We encourage you to keep building your business and apply again in future programs.</p>
      <a href="https://flarehub.org/programs" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">View Programs</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function applicationUnderReviewEmail(firstName: string, programName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#d97706">Application Under Review</h2>
      <p>Hi ${firstName}, your application for <strong>${programName}</strong> is now under review.</p>
      <p>We will notify you as soon as a decision has been made.</p>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function mentorAssignedEmail(firstName: string, mentorName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#7c3aed">Mentor Assigned</h2>
      <p>Hi ${firstName}, you have been assigned a mentor: <strong>${mentorName}</strong>.</p>
      <p>Your mentor will reach out to schedule your first meeting. You can also send them a message directly on Flarehub.</p>
      <a href="https://flarehub.org/messages" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:6px;text-decoration:none">Message Mentor</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function meetingScheduledEmail(firstName: string, mentorName: string, meetingTime: Date, link?: string | null): string {
  const timeStr = meetingTime.toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' });
  const linkSection = link
    ? `<p>Join link: <a href="${link}">${link}</a></p>`
    : '';
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0891b2">Meeting Scheduled</h2>
      <p>Hi ${firstName}, your mentor <strong>${mentorName}</strong> has scheduled a meeting with you.</p>
      <p><strong>When:</strong> ${timeStr}</p>
      ${linkSection}
      <a href="https://flarehub.org/meetings" style="display:inline-block;padding:12px 24px;background:#0891b2;color:#fff;border-radius:6px;text-decoration:none">View Meeting</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function evidenceVerifiedEmail(firstName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16a34a">Evidence Verified</h2>
      <p>Hi ${firstName}, your uploaded evidence has been reviewed and <strong>verified</strong>.</p>
      <a href="https://flarehub.org/evidence" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none">View Evidence</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function evidenceRejectedEmail(firstName: string, notes?: string | null): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#dc2626">Evidence Needs Attention</h2>
      <p>Hi ${firstName}, your uploaded evidence requires attention.</p>
      ${notes ? `<p><strong>Reviewer notes:</strong> ${notes}</p>` : ''}
      <p>Please log in and upload revised evidence.</p>
      <a href="https://flarehub.org/evidence" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none">View Evidence</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function announcementEmail(firstName: string, title: string, body: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1d4ed8">📢 ${title}</h2>
      <p>Hi ${firstName},</p>
      <p>${body}</p>
      <a href="https://flarehub.org/announcements" style="display:inline-block;padding:12px 24px;background:#1d4ed8;color:#fff;border-radius:6px;text-decoration:none">View Announcements</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}

export function newProgramEmail(firstName: string, programName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16a34a">New Program Available</h2>
      <p>Hi ${firstName}, a new program has launched on Flarehub: <strong>${programName}</strong>.</p>
      <a href="https://flarehub.org/programs" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none">View Program</a>
      <p style="margin-top:24px;color:#6b7280;font-size:14px">The Flarehub Team</p>
    </div>`;
}
