import AfricasTalking from 'africastalking';
import { appConfig } from '../config/index.js';

const at = appConfig.sms.apiKey
  ? AfricasTalking({ apiKey: appConfig.sms.apiKey, username: appConfig.sms.username })
  : null;

export async function sendSms(phone: string | null | undefined, message: string): Promise<void> {
  if (!at || !phone) return;

  // Normalize Kenyan numbers to +254 format
  const normalized = phone.replace(/^0/, '+254').replace(/^\+?254/, '+254');
  if (!normalized.startsWith('+254')) return;

  try {
    await at.SMS.send({
      to:     [normalized],
      message,
      from:   appConfig.sms.senderId,
    });
  } catch (err) {
    console.error('SMS send failed:', err);
  }
}

export const smsTemplates = {
  applicationApproved: (programName: string) =>
    `Congratulations! Your application for ${programName} has been APPROVED. Log in to Flarehub for next steps.`,

  applicationRejected: (programName: string) =>
    `Update: Your application for ${programName} was unsuccessful. Keep building and apply again! - Flarehub`,

  mentorAssigned: (mentorName: string) =>
    `Great news! ${mentorName} has been assigned as your Flarehub mentor. Check your app for details.`,

  meetingScheduled: (mentorName: string, time: string) =>
    `Meeting scheduled with ${mentorName} on ${time}. Check Flarehub for the join link.`,

  meetingCancelled: (mentorName: string) =>
    `Your meeting with ${mentorName} has been cancelled. Check Flarehub for updates.`,
};
