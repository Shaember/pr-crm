import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from '../../../services/api';
import StudentsDataTable from '../StudentsDataTable';

// Mock the api module
vi.mock('../../../services/api', () => ({
  api: {
    students: { list: vi.fn(), assignCourse: vi.fn(), removeCourse: vi.fn() },
    courses: { list: vi.fn() },
  },
}));

const mockStudents = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@test.com', phone: '+7 999 111 2233', status: 'Активен', monthly_fee: 15000, debt: 15000, enrollment_date: '2024-01-10' },
  { id: 2, name: 'Алексей Смирнов', email: 'alex@test.com', phone: '+7 999 222 3344', status: 'Активен', monthly_fee: 20000, debt: 40000, enrollment_date: '2024-02-15' },
  { id: 3, name: 'Мария Петрова', email: 'maria@test.com', phone: '+7 999 333 4455', status: 'Отстранен', monthly_fee: 15000, debt: 0, enrollment_date: '2024-03-01' },
];

const mockCourses = [
  { id: 1, name: 'Основы React', teacher: 'Анна', price_per_month: 15000, status: 'Активен' },
  { id: 2, name: 'TypeScript', teacher: 'Иван', price_per_month: 20000, status: 'Активен' },
];

describe('StudentsDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.students.list as any).mockResolvedValue(mockStudents);
    (api.courses.list as any).mockResolvedValue(mockCourses);
  });

  it('renders the data table with student rows', async () => {
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Алексей Смирнов')).toBeInTheDocument();
    expect(screen.getByText('Мария Петрова')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    expect(screen.getByPlaceholderText('Поиск по имени или email...')).toBeInTheDocument();
  });

  it('renders status and debt filter selects', async () => {
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    expect(screen.getByText('Фильтр по статусу')).toBeInTheDocument();
    expect(screen.getByText('Фильтр по долгу')).toBeInTheDocument();
  });

  it('renders column headers', async () => {
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Курс')).toBeInTheDocument();
    expect(screen.getByText('Долг')).toBeInTheDocument();
    expect(screen.getByText('Действия')).toBeInTheDocument();
  });

  it('displays student status badges', async () => {
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    expect(screen.getAllByText('АКТИВЕН').length).toBe(2);
    expect(screen.getByText('ОТСТРАНЕН')).toBeInTheDocument();
  });

  it('displays debt amounts', async () => {
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    // Use flexible matchers since toLocaleString formatting may vary
    // Note: "15 000 ₽" appears in both debt and monthly_fee columns
    const debtElements = screen.getAllByText((content) => content.includes('15') && content.includes('000') && content.includes('₽'));
    expect(debtElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText((content) => content.includes('40') && content.includes('000') && content.includes('₽')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('0 ₽').length).toBeGreaterThanOrEqual(1);
  });

  it('shows StudentCard when profile button is clicked', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    const profileButtons = screen.getAllByText('Профиль');
    await user.click(profileButtons[0]);

    expect(screen.getByText('Профиль студента')).toBeInTheDocument();
    expect(screen.getByText('Вернуться к списку')).toBeInTheDocument();
  });

  it('returns to table when back button is clicked in StudentCard', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

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

    await screen.findByText('Иван Иванов');

    const searchInput = screen.getByPlaceholderText('Поиск по имени или email...');
    await user.type(searchInput, 'Иван');

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.queryByText('Алексей Смирнов')).not.toBeInTheDocument();
    expect(screen.queryByText('Мария Петрова')).not.toBeInTheDocument();
  });

  it('shows empty message when search has no matches', async () => {
    const user = userEvent.setup();
    render(<StudentsDataTable />);

    await screen.findByText('Иван Иванов');

    const searchInput = screen.getByPlaceholderText('Поиск по имени или email...');
    await user.type(searchInput, 'НесуществующийСтудент');

    expect(screen.getByText('Нет студентов')).toBeInTheDocument();
  });
});
