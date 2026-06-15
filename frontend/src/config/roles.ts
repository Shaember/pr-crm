export type Role = 'Admin' | 'Manager' | 'Teacher';

export interface Permission {
  label: string;
  description: string;
}

// What each role can access
const rolePermissions: Record<Role, string[]> = {
  Admin: [
    'dashboard',
    'students',
    'courses',
    'calendar',
    'payments',
    'users',
    'users.create',
    'users.edit',
    'users.delete',
    'users.toggle_status',
    'students.edit',
    'students.delete',
    'payments.create',
    'payments.delete',
  ],
  Manager: [
    'dashboard',
    'students',
    'courses',
    'calendar',
    'payments',
    'users',
    'users.create',
    'users.edit',
    'users.toggle_status',
    'students.edit',
    'payments.create',
    'payments.delete',
  ],
  Teacher: [
    'dashboard',
    'students',
    'courses',
    'calendar',
  ],
};

// Role display config
export const roleConfig: Record<Role, { color: string; label: string; description: string }> = {
  Admin: {
    color: 'red',
    label: 'Администратор',
    description: 'Полный доступ ко всем разделам и управлению пользователями',
  },
  Manager: {
    color: 'blue',
    label: 'Менеджер',
    description: 'Управление студентами, курсами, платежами. Не может удалять администраторов',
  },
  Teacher: {
    color: 'purple',
    label: 'Преподаватель',
    description: 'Просмотр расписания, студентов и курсов. Без доступа к финансам и сотрудникам',
  },
};

export function hasPermission(role: Role | undefined, permission: string): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function getVisibleNavItems(role: Role | undefined): string[] {
  if (!role) return [];
  const perms = rolePermissions[role] || [];
  return perms.filter(p => !p.includes('.'));
}
