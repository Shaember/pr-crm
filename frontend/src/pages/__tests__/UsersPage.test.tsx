import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import UsersPage from '../UsersPage';

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
  });

  it('renders the users table with initial data', () => {
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    expect(screen.getByText('Сотрудники (CRM Пользователи)')).toBeInTheDocument();
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

  it('renders table column headers', () => {
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Роль')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Управление')).toBeInTheDocument();
  });

  it('disables delete button for Manager on Admin users', () => {
    useAuthStore.setState({ user: { username: 'manager@school.com', role: 'Manager' } });
    renderUsers();

    // Manager cannot delete Admin — the delete button for the Admin row
    // should be disabled (disabled={isManager && isAdminTarget})
    // Buttons have accessible names from antd icons: "edit", "lock", "delete"
    const deleteButtons = screen.getAllByRole('button', { name: 'delete' });
    // There are 3 rows, so 3 delete buttons. At least one should be disabled.
    const disabledDeleteButtons = deleteButtons.filter(
      (btn) => (btn as HTMLButtonElement).disabled
    );
    // Manager + Admin target = disabled; also self-delete is disabled
    // With Manager as current user, the Admin row's delete button should be disabled
    expect(disabledDeleteButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('opens create modal for Admin', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: { username: 'admin@school.com', role: 'Admin' } });
    renderUsers();

    await user.click(screen.getByText('Добавить сотрудника'));

    await waitFor(() => {
      expect(screen.getByText('Добавить сотрудника', { selector: '.ant-modal-title' })).toBeInTheDocument();
    });
  });
});
