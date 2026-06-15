import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('initializes with no auth when localStorage is empty', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('login stores token and user', () => {
    useAuthStore.getState().login('test-token', 'admin@test.com', 'Admin');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('test-token');
    expect(state.user).toEqual({ username: 'admin@test.com', role: 'Admin' });
  });

  it('login persists to localStorage', () => {
    useAuthStore.getState().login('test-token', 'admin@test.com', 'Admin');

    expect(localStorage.getItem('crm_token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('crm_user')!)).toEqual({
      username: 'admin@test.com',
      role: 'Admin',
    });
  });

  it('logout clears everything', () => {
    useAuthStore.getState().login('test-token', 'admin@test.com', 'Admin');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem('crm_token')).toBeNull();
    expect(localStorage.getItem('crm_user')).toBeNull();
  });

  it('login with different roles', () => {
    useAuthStore.getState().login('token-1', 'manager@test.com', 'Manager');
    expect(useAuthStore.getState().user?.role).toBe('Manager');

    useAuthStore.getState().login('token-2', 'teacher@test.com', 'Teacher');
    expect(useAuthStore.getState().user?.role).toBe('Teacher');
  });

  it('login overwrites previous session', () => {
    useAuthStore.getState().login('old-token', 'old@test.com', 'Admin');
    useAuthStore.getState().login('new-token', 'new@test.com', 'Manager');

    const state = useAuthStore.getState();
    expect(state.token).toBe('new-token');
    expect(state.user?.username).toBe('new@test.com');
    expect(state.user?.role).toBe('Manager');
  });
});
