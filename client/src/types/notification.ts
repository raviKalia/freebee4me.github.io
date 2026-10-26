export type Notification = { id: string; userId: string; type: string; title: string; message: string; tradeId: string; read: boolean; createdAt: string };
export type NotificationPreferences = { inApp: boolean; email: boolean; newRequest: boolean; requestUpdate: boolean; newMessage: boolean; tradeCompleted: boolean };
