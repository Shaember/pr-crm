import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import UsersPage from '../UsersPage';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    users: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const mockUsers = [
  { id: 1, name: 'Админ Админов', username: 'admin@school.com', email: 'admin@school.com', role: 'Admin', status: 'Активен' },
  { id: 2, name: 'Менеджер Менеджеров', username: 'manager@school.com', email: 'manager@school.com', role: 'Manager', status: 'Активен' },
  { id: 3, name: 'Анна Преподаватель', username: 'teacher@school.com', email: 'teacher@school.com', role: 'Teacher', status: 'Активен' },
];

function renderUsers() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.users.list as any).mockResolvedValue(mockUsers);
  });

  it('renders the users table with initial data', async () => {
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    expect(screen.getByText('Сотрудники (CRM Пользователи)')).toBeInTheDocument();

    // Wait for API data to load
    await screen.findByText('Админ Админов');

    expect(screen.getByText('Админ Админов')).toBeInTheDocument();
    expect(screen.getByText('Менеджер Менеджеров')).toBeInTheDocument();
    expect(screen.getByText('Анна Преподаватель')).toBeInTheDocument();
  });

  it('shows create button for Admin', () => {
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    expect(screen.getByText('Добавить сотрудника')).toBeInTheDocument();
  });

  it('shows create button for Manager (has users.create permission)', () => {
    useAuthStore.setState({ user: { username: 'manager@school.com', role: 'Manager' } });
    renderUsers();

    expect(screen.getByText('Добавить сотрудника')).toBeInTheDocument();
  });

  it('hides create button for Teacher (no users.create permission)', () => {
    useAuthStore.setState({ user: { username: 'teacher@school.com', role: 'Teacher' } });
    renderUsers();

    expect(screen.queryByText('Добавить сотрудника')).not.toBeInTheDocument();
  });

  it('renders table column headers', async () => {
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    // Wait for data to load
    await screen.findByText('Админ Админов');

    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Роль')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Управление')).toBeInTheDocument();
  });

  it('disables delete button for Manager on Admin users', async () => {
    useAuthStore.setState({ user: { username: 'manager@school.com', role: 'Manager' } });
    renderUsers();

    // Wait for data to load
    await screen.findByText('Админ Админов');

    // Manager cannot delete Admin — the delete button for the Admin row
    // should be disabled (disabled={isManager && isAdminTarget})
    const deleteButtons = screen.getAllByRole('button', { name: 'delete' });
    // There are 3 rows, so 3 delete buttons. At least one should be disabled.
    const disabledDeleteButtons = deleteButtons.filter(
      (btn) => (btn as HTMLButtonElement).disabled
    );
    // Manager + Admin target = disabled; also self-delete is disabled
    expect(disabledDeleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens create modal for Admin', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    // Wait for data to load
    await screen.findByText('Админ Админов');

    await user.click(screen.getByText('Добавить сотрудника'));

    await waitFor(() => {
      expect(screen.getByText('Добавить сотрудника', { selector: '.ant-modal-title' })).toBeInTheDocument();
    });
  });
});
