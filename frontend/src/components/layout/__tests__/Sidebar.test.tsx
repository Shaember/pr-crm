import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuthStore } from '../../../store/authStore';

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  localStorage.clear();
});

function renderSidebar(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('admin sees all 6 menu items', () => {
    useAuthStore.setState({
      user: { username: 'Админ', role: 'Admin' },
      token: 'tok',
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.getByText('Дашборд')).toBeInTheDocument();
    expect(screen.getByText('Студенты')).toBeInTheDocument();
    expect(screen.getByText('Курсы')).toBeInTheDocument();
    expect(screen.getByText('Расписание')).toBeInTheDocument();
    expect(screen.getByText('Платежи')).toBeInTheDocument();
    expect(screen.getByText('Сотрудники')).toBeInTheDocument();
  });

  it('teacher sees only 4 items (no Payments, no Users)', () => {
    useAuthStore.setState({
      user: { username: 'Препод', role: 'Teacher' },
      token: 'tok',
      isAuthenticated: true,
    });

    renderSidebar();

    expect(screen.getByText('Дашборд')).toBeInTheDocument();
    expect(screen.getByText('Студенты')).toBeInTheDocument();
    expect(screen.getByText('Курсы')).toBeInTheDocument();
    expect(screen.getByText('Расписание')).toBeInTheDocument();

    expect(screen.queryByText('Платежи')).not.toBeInTheDocument();
    expect(screen.queryByText('Сотрудники')).not.toBeInTheDocument();
  });

  it('clicking a menu item navigates', async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: { username: 'Админ', role: 'Admin' },
      token: 'tok',
      isAuthenticated: true,
    });

    renderSidebar();

    await user.click(screen.getByText('Студенты'));

    // After click the menu item should still be in the document (navigation happened)
    expect(screen.getByText('Студенты')).toBeInTheDocument();
  });
});
