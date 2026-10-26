import { request } from './api';
import type { DemoRole } from '../types/trade';
import type { Notification, NotificationPreferences } from '../types/notification';
const headers = (role: DemoRole) => ({ 'x-demo-user': role });
export const getNotifications = (role: DemoRole) => request<Notification[]>('/api/notifications', { headers: headers(role) });
export const markRead = (role: DemoRole, id: string) => request<Notification>(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH', headers: headers(role) });
export const getNotificationPreferences = (role: DemoRole) => request<NotificationPreferences>('/api/notification-preferences', { headers: headers(role) });
export const saveNotificationPreferences = (role: DemoRole, prefs: NotificationPreferences) => request<NotificationPreferences>('/api/notification-preferences', { method: 'PUT', headers: { ...headers(role), 'Content-Type': 'application/json' }, body: JSON.stringify(prefs) });
