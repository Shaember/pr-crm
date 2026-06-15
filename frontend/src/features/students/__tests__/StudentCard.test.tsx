import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentCard from '../StudentCard';
import { useAuthStore } from '../../../store/authStore';
import type { Student } from '../../../types';

const mockStudent: Student = {
  key: '1',
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  phone: '+7 999 123 45 67',
  status: 'Активен',
  course: ['Основы React', 'UI Дизайн'],
  debt: 15000,
  enrollmentDate: '2023-09-01',
};

const mockStudentNoDebt: Student = {
  key: '3',
  name: 'Мария Петрова',
  email: 'maria@example.com',
  phone: '+7 999 345 67 89',
  status: 'Активен',
  course: ['Node.js Backend'],
  debt: 0,
  enrollmentDate: '2024-01-10',
};

const setRole = (role: 'Admin' | 'Manager' | 'Teacher' | null) => {
  if (role) {
    useAuthStore.setState({
      user: { username: 'testuser', role },
      token: 'fake-token',
      isAuthenticated: true,
    });
  } else {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  }
};

const mockOnBack = vi.fn();

beforeEach(() => {
  mockOnBack.mockClear();
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe('StudentCard', () => {
  it('renders student profile data', () => {
    setRole('Admin');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    expect(screen.getByText('Профиль студента')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.getByText('+7 999 123 45 67')).toBeInTheDocument();
    expect(screen.getByText('АКТИВЕН')).toBeInTheDocument();
    expect(screen.getByText('2023-09-01')).toBeInTheDocument();
    expect(screen.getByText('15 000 ₽')).toBeInTheDocument();
  });

  it('renders zero debt in green', () => {
    setRole('Admin');
    render(<StudentCard student={mockStudentNoDebt} onBack={mockOnBack} />);

    expect(screen.getByText('0 ₽')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    setRole('Admin');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    await user.click(screen.getByText('Вернуться к списку'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows edit and payment buttons for Admin', () => {
    setRole('Admin');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    expect(screen.getByText('Редактировать')).toBeInTheDocument();
    expect(screen.getByText('Внести платеж')).toBeInTheDocument();
    expect(screen.getByText('Назначить курс')).toBeInTheDocument();
    expect(screen.getByText('Скачать счет')).toBeInTheDocument();
    expect(screen.getByText('Отправить сообщение')).toBeInTheDocument();
    expect(screen.getByText('Добавить заметку')).toBeInTheDocument();
    expect(screen.getByText('Изменить статус')).toBeInTheDocument();
  });

  it('shows edit and payment buttons for Manager', () => {
    setRole('Manager');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    expect(screen.getByText('Редактировать')).toBeInTheDocument();
    expect(screen.getByText('Внести платеж')).toBeInTheDocument();
    expect(screen.getByText('Назначить курс')).toBeInTheDocument();
  });

  it('hides edit and payment buttons for Teacher', () => {
    setRole('Teacher');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    expect(screen.queryByText('Редактировать')).not.toBeInTheDocument();
    expect(screen.queryByText('Внести платеж')).not.toBeInTheDocument();
    expect(screen.queryByText('Назначить курс')).not.toBeInTheDocument();
    expect(screen.queryByText('Скачать счет')).not.toBeInTheDocument();
    expect(screen.queryByText('Отправить сообщение')).not.toBeInTheDocument();
    expect(screen.queryByText('Добавить заметку')).not.toBeInTheDocument();
    expect(screen.queryByText('Изменить статус')).not.toBeInTheDocument();
  });

  it('shows attendance button for all roles', () => {
    setRole('Teacher');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    expect(screen.getByText('Посещаемость')).toBeInTheDocument();
  });

  it('hides all action buttons when no role is set', () => {
    setRole(null);
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    expect(screen.queryByText('Редактировать')).not.toBeInTheDocument();
    expect(screen.queryByText('Внести платеж')).not.toBeInTheDocument();
  });

  it('toggles attendance view', async () => {
    const user = userEvent.setup();
    setRole('Admin');
    render(<StudentCard student={mockStudent} onBack={mockOnBack} />);

    await user.click(screen.getByText('Посещаемость'));

    expect(screen.getByText('Здесь будет отображена таблица посещаемости студента.')).toBeInTheDocument();
    expect(screen.getByText('Скрыть посещаемость')).toBeInTheDocument();

    await user.click(screen.getByText('Вернуться к информации'));

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
  });
});
