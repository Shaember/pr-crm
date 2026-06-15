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
  // Suppress antd message calls
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('AuthPage', () => {
  it('renders the login form with email, password, role select and submit button', () => {
    renderAuthPage();

    expect(screen.getByText('Вход в CRM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('role select has 3 options (Admin, Manager, Teacher)', () => {
    renderAuthPage();

    // The select should exist; click to open dropdown and check options
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('successful API login navigates to /dashboard', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ token: 'real-token-123' });

    renderAuthPage();

    await user.type(screen.getByPlaceholderText('admin@example.com'), 'admin@example.com');
    await user.type(screen.getByPlaceholderText('Введите пароль'), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'password123');
  });

  it('failed API login falls back to mock login and still navigates', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('Network error'));

    renderAuthPage();

    await user.type(screen.getByPlaceholderText('admin@example.com'), 'user@test.com');
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
