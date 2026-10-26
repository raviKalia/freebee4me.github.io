import { request } from './api';
import type { Coordinates, Item } from '../types';
export type ItemFilters = {
  search: string; category: string; city: string; postalCode: string;
  radius: string; coords: Coordinates | null;
};
export function getItems(filters: ItemFilters, signal?: AbortSignal) {
  const query = new URLSearchParams({
    search: filters.search, category: filters.category, radius: filters.radius
  });
  if (filters.coords) {
    query.set('lat', String(filters.coords.lat));
    query.set('lng', String(filters.coords.lng));
  } else {
    query.set('city', filters.city);
    query.set('postalCode', filters.postalCode);
  }
  return request<Item[]>(`/api/items?${query}`, { signal });
}
