import { randomUUID } from 'node:crypto';
import { notifications, preferences, defaultPreferences } from '../data/notifications.js';
import { sendEmail } from './emailService.js';
export function notify(userId, type, title, message, tradeId) {
 const prefs = { ...defaultPreferences, ...preferences.get(userId) };
 if (prefs[type] === false) return;
 if (prefs.inApp) notifications.unshift({ id: randomUUID(), userId, type, title, message, tradeId, read: false, createdAt: new Date().toISOString() });
 if (prefs.email) sendEmail(userId, `Freebee4me: ${title}`, message).catch(error => console.error('Email delivery failed:', error.message));
}
