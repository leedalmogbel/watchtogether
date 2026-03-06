const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; displayName: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<{ user: any }>('/auth/me'),
  },
  channels: {
    list: () => request<{ channels: any[] }>('/channels'),
    get: (slug: string) => request<{ channel: any; playlist: any[]; playbackState: any }>(`/channels/${slug}`),
    create: (data: { name: string; slug?: string }) =>
      request<{ channel: any }>('/channels', { method: 'POST', body: JSON.stringify(data) }),
    update: (slug: string, data: { name?: string; isActive?: boolean }) =>
      request<{ channel: any }>(`/channels/${slug}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  playlist: {
    get: (slug: string) => request<{ playlist: any[] }>(`/channels/${slug}/playlist`),
    add: (slug: string, data: { title: string; videoUrl: string; videoSource?: string; durationSeconds?: number }) =>
      request<{ item: any }>(`/channels/${slug}/playlist`, { method: 'POST', body: JSON.stringify(data) }),
    update: (slug: string, itemId: string, data: any) =>
      request<{ item: any }>(`/channels/${slug}/playlist/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (slug: string, itemId: string) =>
      request<{ success: boolean }>(`/channels/${slug}/playlist/${itemId}`, { method: 'DELETE' }),
    reorder: (slug: string, itemIds: string[]) =>
      request<{ playlist: any[] }>(`/channels/${slug}/playlist/reorder`, { method: 'POST', body: JSON.stringify({ itemIds }) }),
  },
};
