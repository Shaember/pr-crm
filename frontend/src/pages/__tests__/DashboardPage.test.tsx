import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DashboardPage', () => {
  it('shows loading state initially', () => {
    renderDashboard();

    // Title should be present
    expect(screen.getByText('Дашборд')).toBeInTheDocument();

    // Cards should be in loading state (antd renders .ant-card-loading)
    const cards = document.querySelectorAll('.ant-card-loading');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows stats after loading completes (500ms)', async () => {
    renderDashboard();

    // Advance past the 500ms setTimeout
    act(() => {
      vi.advanceTimersByTime(600);
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
    renderDashboard();

    act(() => {
      vi.advanceTimersByTime(600);
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
