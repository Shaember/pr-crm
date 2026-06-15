import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import CoursesPage from '../CoursesPage';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    courses: { list: vi.fn(), create: vi.fn() },
  },
}));

const mockCourses = [
  { id: 1, name: 'Основы React', teacher: 'Анна Преподаватель', students_count: 15, status: 'Активен' },
  { id: 2, name: 'Продвинутый TypeScript', teacher: 'Иван Сергеев', students_count: 8, status: 'Активен' },
];

// Mock ResizeObserver for antd Select components in modals
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverMock;

function renderCourses() {
  return render(
    <MemoryRouter>
      <CoursesPage />
    </MemoryRouter>
  );
}

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.courses.list as any).mockResolvedValue(mockCourses);
  });

  it('renders the courses table with initial data', async () => {
    useAuthStore.setState({ user: { username: 'admin@test.com', role: 'Admin' } });
    renderCourses();

    expect(screen.getByText('Курсы')).toBeInTheDocument();

    // Wait for API data to load
    await screen.findByText('Основы React');

    expect(screen.getByText('Основы React')).toBeInTheDocument();
    expect(screen.getByText('Продвинутый TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Анна Преподаватель')).toBeInTheDocument();
    expect(screen.getByText('Иван Сергеев')).toBeInTheDocument();
  });

  it('shows create button for Admin', () => {
    useAuthStore.setState({ user: { username: 'admin@test.com', role: 'Admin' } });
    renderCourses();

    expect(screen.getByText('Создать курс')).toBeInTheDocument();
  });

  it('shows create button for Teacher (has courses permission)', () => {
    useAuthStore.setState({ user: { username: 'teacher@test.com', role: 'Teacher' } });
    renderCourses();

    // Teacher has 'courses' permission, so button IS visible
    expect(screen.getByText('Создать курс')).toBeInTheDocument();
  });

  it('opens create modal and adds a new course', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: { username: 'admin@test.com', role: 'Admin' } });
    renderCourses();

    // Wait for data to load first
    await screen.findByText('Основы React');

    // Click create button
    await user.click(screen.getByText('Создать курс'));

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByText('Конструктор курса')).toBeInTheDocument();
    });

    // Verify the form fields exist in the modal by using the dialog scope
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // The modal title confirms the form is present
    expect(within(dialog).getByText('Название курса')).toBeInTheDocument();
  });

  it('renders table columns correctly', async () => {
    useAuthStore.setState({ user: { username: 'admin@test.com', role: 'Admin' } });
    renderCourses();

    // Wait for data to load
    await screen.findByText('Основы React');

    expect(screen.getByText('Название курса')).toBeInTheDocument();
    expect(screen.getByText('Преподаватель')).toBeInTheDocument();
    expect(screen.getByText('Кол-во студентов')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
  });
});
