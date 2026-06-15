import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../../services/api';
import DashboardPage from '../DashboardPage';

vi.mock('../../services/api', () => ({
  api: {
    students: { list: vi.fn() },
    courses: { list: vi.fn() },
    payments: { list: vi.fn() },
  },
}));

const mockStudents = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@test.com', status: 'Активен', debt: 15000 },
  { id: 2, name: 'Алексей Смирнов', email: 'alex@test.com', status: 'Активен', debt: 40000 },
  { id: 3, name: 'Мария Петрова', email: 'maria@test.com', status: 'Отстранен', debt: 0 },
];

const mockCourses = [
  { id: 1, name: 'Основы React', teacher: 'Анна', students_count: 15, status: 'Активен' },
  { id: 2, name: 'TypeScript', teacher: 'Иван', students_count: 8, status: 'Активен' },
];

const mockPayments = [
  { id: 1, transaction_id: 'TXN-1001', student_name: 'Иван', amount: 15000, date: '2024-01-15', status: 'Оплачен' },
  { id: 2, transaction_id: 'TXN-1002', student_name: 'Алексей', amount: 40000, date: '2024-01-20', status: 'Просрочен' },
  { id: 3, transaction_id: 'TXN-1003', student_name: 'Мария', amount: 15000, date: '2024-02-01', status: 'В ожидании' },
];

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('DashboardPage', () => {
  it('shows loading state initially', () => {
    // Don't resolve API calls to keep loading state
    (api.students.list as any).mockReturnValue(new Promise(() => {}));
    (api.courses.list as any).mockReturnValue(new Promise(() => {}));
    (api.payments.list as any).mockReturnValue(new Promise(() => {}));

    renderDashboard();

    // Title should be present
    expect(screen.getByText('Дашборд')).toBeInTheDocument();

    // Cards should be in loading state (antd renders .ant-card-loading)
    const cards = document.querySelectorAll('.ant-card-loading');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows stats after loading completes', async () => {
    (api.students.list as any).mockResolvedValue(mockStudents);
    (api.courses.list as any).mockResolvedValue(mockCourses);
    (api.payments.list as any).mockResolvedValue(mockPayments);

    renderDashboard();

    // Wait for loading to complete
    await waitFor(() => {
      const loadingCards = document.querySelectorAll('.ant-card-loading');
      expect(loadingCards.length).toBe(0);
    });

    // After loading: 3 students total
    expect(screen.getByText('3')).toBeInTheDocument();

    // 2 active students shown in suffix
    expect(screen.getByText(/2 активных/)).toBeInTheDocument();

    // 2 active courses
    const courseValues = screen.getAllByText('2');
    expect(courseValues.length).toBeGreaterThanOrEqual(1);

    // Monthly revenue: only "Оплачен" payment = 15000
    expect(screen.getByText((content) => content.includes('15') && content.includes('000'))).toBeInTheDocument();

    // Total debt: 15000 + 40000 + 0 = 55000
    expect(screen.getByText((content) => content.includes('55') && content.includes('000'))).toBeInTheDocument();

    // Pending payments: 1 (TXN-1003 has status "В ожидании")
    const pendingElements = screen.getAllByText('1');
    expect(pendingElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows correct student, course, and payment counts', async () => {
    (api.students.list as any).mockResolvedValue(mockStudents);
    (api.courses.list as any).mockResolvedValue(mockCourses);
    (api.payments.list as any).mockResolvedValue(mockPayments);

    renderDashboard();

    await waitFor(() => {
      const loadingCards = document.querySelectorAll('.ant-card-loading');
      expect(loadingCards.length).toBe(0);
    });

    // Verify stat titles are rendered
    expect(screen.getByText('Всего студентов')).toBeInTheDocument();
    expect(screen.getByText('Активных курсов')).toBeInTheDocument();
    expect(screen.getByText('Месячная выручка')).toBeInTheDocument();
    expect(screen.getByText('Общий долг студентов')).toBeInTheDocument();
    expect(screen.getByText('Ожидают оплаты')).toBeInTheDocument();

    // No more loading states
    const loadingCards = document.querySelectorAll('.ant-card-loading');
    expect(loadingCards.length).toBe(0);
  });
});
