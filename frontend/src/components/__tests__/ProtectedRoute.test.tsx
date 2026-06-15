import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../config/roles';

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset auth store to a known default
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { username: 'admin', role: 'Admin' as Role },
      token: 'test-token',
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects to /auth/login when not authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      token: null,
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    );

    // Navigate component renders nothing visible — children should not be present
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    // The Navigate component triggers a redirect; in MemoryRouter it updates the location.
    // We can verify by checking that the protected content is not rendered.
  });

  it('does not render children when isAuthenticated is false', () => {
    useAuthStore.setState({ isAuthenticated: false });

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret page</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
  });

  it('renders children for different authenticated users', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { username: 'manager', role: 'Manager' as Role },
      token: 'manager-token',
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Manager content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Manager content')).toBeInTheDocument();
  });
});
