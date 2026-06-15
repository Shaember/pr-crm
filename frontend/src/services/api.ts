import { useAuthStore } from '../store/authStore';

// В production (nginx/docker) — пустая строка, запросы идут на тот же домен
// В development — берётся из .env
const API_BASE = import.meta.env.VITE_API_URL ?? '';

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

// ============================================================
// AUTH
// ============================================================

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    register: (username: string, password: string, name?: string, role?: string) =>
      request<{ message: string; id: number }>('/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, name, role }),
      }),
  },

  // ============================================================
  // STUDENTS
  // ============================================================
  students: {
    list: () => request<any[]>('/api/students'),
    get: (id: number) => request<any>(`/api/students/${id}`),
    create: (data: { name: string; email?: string; phone?: string; status?: string; debt?: number }) =>
      request<{ id: number }>('/api/students', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ name: string; email: string; phone: string; status: string; debt: number }>) =>
      request<{ updated: boolean }>(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ deleted: boolean }>(`/api/students/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================
  // COURSES
  // ============================================================
  courses: {
    list: () => request<any[]>('/api/courses'),
    create: (data: { name: string; teacher?: string; description?: string }) =>
      request<{ id: number }>('/api/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ name: string; teacher: string; description: string; status: string; students_count: number }>) =>
      request<{ updated: boolean }>(`/api/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ deleted: boolean }>(`/api/courses/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================
  // PAYMENTS
  // ============================================================
  payments: {
    list: () => request<any[]>('/api/payments'),
    create: (data: { student_id?: number; student_name?: string; amount: number; date?: string; status?: string }) =>
      request<{ id: number }>('/api/payments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { status: string }) =>
      request<{ updated: boolean }>(`/api/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ deleted: boolean }>(`/api/payments/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================
  // USERS
  // ============================================================
  users: {
    list: () => request<any[]>('/api/users'),
    create: (data: { username: string; password: string; name?: string; role?: string }) =>
      request<{ id: number }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ name: string; role: string; status: string }>) =>
      request<{ updated: boolean }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ deleted: boolean }>(`/api/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // ============================================================
  // PRODUCTS (legacy)
  // ============================================================
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
