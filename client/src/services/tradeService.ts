import { request } from './api';
import type { Trade, ChatMessage, DemoRole } from '../types/trade';
const demoHeaders = (role: DemoRole) => ({ 'x-demo-user': role });
export const getTrade = (id: string, role: DemoRole) =>
 request<Trade>(`/api/trades/${encodeURIComponent(id)}`, { headers: demoHeaders(role) });
export const sendMessage = (id: string, role: DemoRole, text: string) =>
 request<ChatMessage>(`/api/trades/${encodeURIComponent(id)}/messages`, {
  method: 'POST', headers: { ...demoHeaders(role), 'Content-Type': 'application/json' },
  body: JSON.stringify({ text })
 });
export const changeTradeStatus = (id: string, role: DemoRole, status: string) =>
 request<Trade>(`/api/trades/${encodeURIComponent(id)}/status`, {
  method: 'PATCH', headers: { ...demoHeaders(role), 'Content-Type': 'application/json' },
  body: JSON.stringify({ status })
 });
