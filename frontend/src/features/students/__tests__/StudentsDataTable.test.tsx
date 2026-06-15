import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentsDataTable from '../StudentsDataTable';

describe('StudentsDataTable', () => {
  it('renders the data table with student rows', () => {
    render(<StudentsDataTable />);
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Алексей Смирнов')).toBeInTheDocument();
    expect(screen.getByText('Мария Петрова')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<StudentsDataTable />);
    expect(screen.getByPlaceholderText('Поиск по имени или email...')).toBeInTheDocument();
  });

  it('renders status and debt filter selects', () => {
    render(<StudentsDataTable />);
    expect(screen.getByText('Фильтр по статусу')).toBeInTheDocument();
    expect(screen.getByText('Фильтр по долгу')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<StudentsDataTable />);
    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Курс')).toBeInTheDocument();
    expect(screen.getByText('Долг')).toBeInTheDocument();
    expect(screen.getByText('Действия')).toBeInTheDocument();
  });

  it('displays student status badges', () => {
    render(<StudentsDataTable />);
    expect(screen.getAllByText('АКТИВЕН').length).toBe(2);
    expect(screen.getByText('ОТСТРАНЕН')).toBeInTheDocument();
  });

  it('displays debt amounts', () => {
    render(<StudentsDataTable />);
    expect(screen.getByText('15 000 ₽')).toBeInTheDocument();
    expect(screen.getByText('40 000 ₽')).toBeInTheDocument();
    expect(screen.getByText('0 ₽')).toBeInTheDocument();
  });

  it('shows StudentCard when profile button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    const profileButtons = screen.getAllByText('Профиль');
    await user.click(profileButtons[0]);

    expect(screen.getByText('Профиль студента')).toBeInTheDocument();
    expect(screen.getByText('Вернуться к списку')).toBeInTheDocument();
  });

  it('returns to table when back button is clicked in StudentCard', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    // Click profile to open StudentCard
    const profileButtons = screen.getAllByText('Профиль');
    await user.click(profileButtons[0]);
    expect(screen.getByText('Профиль студента')).toBeInTheDocument();

    // Click back button
    await user.click(screen.getByText('Вернуться к списку'));

    // Table should be visible again
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Алексей Смирнов')).toBeInTheDocument();
    expect(screen.getByText('Мария Петрова')).toBeInTheDocument();
  });

  it('filters students by search text', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    const searchInput = screen.getByPlaceholderText('Поиск по имени или email...');
    await user.type(searchInput, 'Иван');

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.queryByText('Алексей Смирнов')).not.toBeInTheDocument();
    expect(screen.queryByText('Мария Петрова')).not.toBeInTheDocument();
  });

  it('shows empty message when search has no matches', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    const searchInput = screen.getByPlaceholderText('Поиск по имени или email...');
    await user.type(searchInput, 'НесуществующийСтудент');

    expect(screen.getByText('Нет студентов')).toBeInTheDocument();
  });
});
