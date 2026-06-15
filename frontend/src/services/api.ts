import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = token;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string) =>
      request<{ message: string }>('/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },

  products: {
    list: () => request<any[]>('/products'),
    create: (data: { name: string; quantity: number; price: number }) =>
      request<{ id: number }>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ deleted: boolean }>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  health: () => request<{ status: string; uptime: number }>('/health'),
};
