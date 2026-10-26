import { API, request } from './api';
import type { Profile } from '../types';
// Demo account only. Replace this with the authenticated user ID.
const demoId = 'demo-user';
export function getProfile() {
  return request<Profile | null>(`/api/profile/${demoId}`);
}
export function saveProfile(profile: Profile) {
  return request<Profile>(`/api/profile/${demoId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
}
export function uploadProfilePhoto(file: File) {
  const body = new FormData();
  body.append('photo', file);
  return request<{ photoUrl: string }>(`/api/profile/${demoId}/photo`, {
    method: 'POST', body
  });
}
export function imageUrl(path: string) {
  return path.startsWith('/') ? `${API}${path}` : path;
}
