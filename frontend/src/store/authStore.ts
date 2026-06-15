import { create } from 'zustand';
import type { Role } from '../config/roles';

interface AuthState {
  token: string | null;
  user: { username: string; role: Role } | null;
  isAuthenticated: boolean;
  login: (token: string, username: string, role: Role) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('crm_token'),
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem('crm_user') || 'null');
    } catch {
      return null;
    }
  })(),
  isAuthenticated: !!localStorage.getItem('crm_token'),

  login: (token, username, role) => {
    const user = { username, role };
    localStorage.setItem('crm_token', token);
    localStorage.setItem('crm_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
