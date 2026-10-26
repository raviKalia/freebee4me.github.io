import { request } from './api';
export type ContactMessage = { name: string; email: string; subject: string; message: string };
export function sendContactMessage(message: ContactMessage) {
	return request<{ success: boolean; message: string }>('/api/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(message),
	});
}
