import { describe, it, expect } from 'vitest';
import { hasPermission, getVisibleNavItems, roleConfig, type Role } from '../../config/roles';

describe('hasPermission', () => {
  it('Admin has all permissions', () => {
    const adminPerms = [
      'dashboard', 'students', 'courses', 'calendar', 'payments', 'users',
      'users.create', 'users.edit', 'users.delete', 'users.toggle_status',
      'students.edit', 'students.delete', 'payments.create', 'payments.delete',
    ];
    adminPerms.forEach(perm => {
      expect(hasPermission('Admin', perm)).toBe(true);
    });
  });

  it('Manager has correct permissions', () => {
    expect(hasPermission('Manager', 'dashboard')).toBe(true);
    expect(hasPermission('Manager', 'students')).toBe(true);
    expect(hasPermission('Manager', 'courses')).toBe(true);
    expect(hasPermission('Manager', 'calendar')).toBe(true);
    expect(hasPermission('Manager', 'payments')).toBe(true);
    expect(hasPermission('Manager', 'users')).toBe(true);
    expect(hasPermission('Manager', 'users.create')).toBe(true);
    expect(hasPermission('Manager', 'users.edit')).toBe(true);
    expect(hasPermission('Manager', 'users.toggle_status')).toBe(true);
    expect(hasPermission('Manager', 'students.edit')).toBe(true);
    expect(hasPermission('Manager', 'payments.create')).toBe(true);
    expect(hasPermission('Manager', 'payments.delete')).toBe(true);
  });

  it('Manager cannot delete users', () => {
    expect(hasPermission('Manager', 'users.delete')).toBe(false);
  });

  it('Teacher has limited permissions', () => {
    expect(hasPermission('Teacher', 'dashboard')).toBe(true);
    expect(hasPermission('Teacher', 'students')).toBe(true);
    expect(hasPermission('Teacher', 'courses')).toBe(true);
    expect(hasPermission('Teacher', 'calendar')).toBe(true);
  });

  it('Teacher cannot access payments or users', () => {
    expect(hasPermission('Teacher', 'payments')).toBe(false);
    expect(hasPermission('Teacher', 'users')).toBe(false);
    expect(hasPermission('Teacher', 'users.create')).toBe(false);
    expect(hasPermission('Teacher', 'users.edit')).toBe(false);
    expect(hasPermission('Teacher', 'users.delete')).toBe(false);
    expect(hasPermission('Teacher', 'students.edit')).toBe(false);
    expect(hasPermission('Teacher', 'payments.create')).toBe(false);
  });

  it('returns false for undefined role', () => {
    expect(hasPermission(undefined, 'dashboard')).toBe(false);
  });

  it('returns false for unknown permission', () => {
    expect(hasPermission('Admin', 'unknown.permission')).toBe(false);
  });
});

describe('getVisibleNavItems', () => {
  it('Admin sees all nav items', () => {
    const items = getVisibleNavItems('Admin');
    expect(items).toContain('dashboard');
    expect(items).toContain('students');
    expect(items).toContain('courses');
    expect(items).toContain('calendar');
    expect(items).toContain('payments');
    expect(items).toContain('users');
    expect(items).toHaveLength(6);
  });

  it('Teacher sees only 4 nav items', () => {
    const items = getVisibleNavItems('Teacher');
    expect(items).toContain('dashboard');
    expect(items).toContain('students');
    expect(items).toContain('courses');
    expect(items).toContain('calendar');
    expect(items).not.toContain('payments');
    expect(items).not.toContain('users');
    expect(items).toHaveLength(4);
  });

  it('returns empty array for undefined role', () => {
    expect(getVisibleNavItems(undefined)).toEqual([]);
  });
});

describe('roleConfig', () => {
  it('has config for all 3 roles', () => {
    expect(roleConfig.Admin).toBeDefined();
    expect(roleConfig.Manager).toBeDefined();
    expect(roleConfig.Teacher).toBeDefined();
  });

  it('each role has color, label, description', () => {
    (['Admin', 'Manager', 'Teacher'] as Role[]).forEach(role => {
      expect(roleConfig[role].color).toBeTruthy();
      expect(roleConfig[role].label).toBeTruthy();
      expect(roleConfig[role].description).toBeTruthy();
    });
  });

  it('Admin is red, Manager is blue, Teacher is purple', () => {
    expect(roleConfig.Admin.color).toBe('red');
    expect(roleConfig.Manager.color).toBe('blue');
    expect(roleConfig.Teacher.color).toBe('purple');
  });
});
