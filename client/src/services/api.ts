export const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export async function request<T>(url: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API}${url}`, options);
	if (!response.ok) throw new Error(`Server returned ${response.status}`);
	return response.json() as Promise<T>;
}
