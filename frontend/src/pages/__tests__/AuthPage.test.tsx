import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import AuthPage from '../AuthPage';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    auth: {
      login: vi.fn(),
    },
  },
}));

const mockLogin = vi.mocked(api.auth.login);

function renderAuthPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.setState({
    token: null,
    user: null,
    isAuthenticated: false,
  });
  vi.clearAllMocks();
  localStorage.clear();
  // Suppress antd message calls
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AuthPage', () => {
  it('renders the login form with email, password and submit button', () => {
    renderAuthPage();

    expect(screen.getByText('Вход в CRM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@school.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('shows test account hints', () => {
    renderAuthPage();

    expect(screen.getByText('Тестовые аккаунты:')).toBeInTheDocument();
    expect(screen.getByText('admin@school.com / admin123')).toBeInTheDocument();
    expect(screen.getByText('manager@school.com / manager123')).toBeInTheDocument();
    expect(screen.getByText('teacher@school.com / teacher123')).toBeInTheDocument();
  });

  it('successful API login navigates to /dashboard', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      token: 'real-token-123',
      user: { id: 1, username: 'admin@school.com', name: 'Admin', role: 'Admin' },
    });

    renderAuthPage();

    await user.type(screen.getByPlaceholderText('admin@school.com'), 'admin@school.com');
    await user.type(screen.getByPlaceholderText('Введите пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith('admin@school.com', 'password123');
  });

  it('failed API login falls back to mock login and still navigates', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Network error'));

    renderAuthPage();

    await user.type(screen.getByPlaceholderText('admin@school.com'), 'user@test.com');
    await user.type(screen.getByPlaceholderText('Введите пароль'), 'pass');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    // Store should have the user logged in with a mock token
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe('user@test.com');
  });
});
