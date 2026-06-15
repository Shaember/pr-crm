import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoleGuard from '../RoleGuard';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../config/roles';

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/guarded']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

describe('RoleGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { username: 'testuser', role: 'Admin' as Role },
      token: 'test-token',
    });
  });

  it('renders children when user has the required permission', () => {
    useAuthStore.setState({
      user: { username: 'admin', role: 'Admin' as Role },
    });

    renderWithRouter(
      <RoleGuard permission="users.create">
        <div>Create user form</div>
      </RoleGuard>
    );

    expect(screen.getByText('Create user form')).toBeInTheDocument();
  });

  it('redirects to /dashboard when user lacks the permission and no fallback', () => {
    useAuthStore.setState({
      user: { username: 'teacher', role: 'Teacher' as Role },
    });

    renderWithRouter(
      <RoleGuard permission="users.create">
        <div>Create user form</div>
      </RoleGuard>
    );

    // Teacher does not have users.create — children should not render
    expect(screen.queryByText('Create user form')).not.toBeInTheDocument();
  });

  it('renders fallback when user lacks permission and fallback is provided', () => {
    useAuthStore.setState({
      user: { username: 'teacher', role: 'Teacher' as Role },
    });

    renderWithRouter(
      <RoleGuard permission="users.create" fallback={<div>Access denied</div>}>
        <div>Create user form</div>
      </RoleGuard>
    );

    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Create user form')).not.toBeInTheDocument();
  });

  it('redirects when user has no role (undefined)', () => {
    useAuthStore.setState({
      user: null,
    });

    renderWithRouter(
      <RoleGuard permission="dashboard">
        <div>Dashboard content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders fallback when user has no role and fallback is provided', () => {
    useAuthStore.setState({
      user: null,
    });

    renderWithRouter(
      <RoleGuard permission="dashboard" fallback={<div>No role</div>}>
        <div>Dashboard content</div>
      </RoleGuard>
    );

    expect(screen.getByText('No role')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('allows Manager with correct permission', () => {
    useAuthStore.setState({
      user: { username: 'manager', role: 'Manager' as Role },
    });

    renderWithRouter(
      <RoleGuard permission="payments">
        <div>Payments page</div>
      </RoleGuard>
    );

    expect(screen.getByText('Payments page')).toBeInTheDocument();
  });

  it('denies Manager access to permission they do not have', () => {
    useAuthStore.setState({
      user: { username: 'manager', role: 'Manager' as Role },
    });

    // users.delete is Admin-only
    renderWithRouter(
      <RoleGuard permission="users.delete" fallback={<div>Not allowed</div>}>
        <div>Delete user</div>
      </RoleGuard>
    );

    expect(screen.getByText('Not allowed')).toBeInTheDocument();
    expect(screen.queryByText('Delete user')).not.toBeInTheDocument();
  });

  it('Teacher can access dashboard but not payments', () => {
    useAuthStore.setState({
      user: { username: 'teacher', role: 'Teacher' as Role },
    });

    const { unmount } = renderWithRouter(
      <RoleGuard permission="dashboard">
        <div>Teacher dashboard</div>
      </RoleGuard>
    );

    expect(screen.getByText('Teacher dashboard')).toBeInTheDocument();
    unmount();

    useAuthStore.setState({
      user: { username: 'teacher', role: 'Teacher' as Role },
    });

    renderWithRouter(
      <RoleGuard permission="payments" fallback={<div>No payments</div>}>
        <div>Payments</div>
      </RoleGuard>
    );

    expect(screen.getByText('No payments')).toBeInTheDocument();
    expect(screen.queryByText('Payments')).not.toBeInTheDocument();
  });
});
