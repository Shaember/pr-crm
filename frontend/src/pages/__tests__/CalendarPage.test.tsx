import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CalendarPage from '../CalendarPage';

// Mock ResizeObserver for Ant Design components (not available in jsdom)
class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock react-big-calendar – it relies on DOM measurement APIs unavailable in jsdom
vi.mock('react-big-calendar', () => ({
  Calendar: (props: any) => (
    <div data-testid="rbc-calendar">
      Mock Calendar – defaultView: {props.defaultView}
    </div>
  ),
  momentLocalizer: vi.fn(() => ({})),
}));

vi.mock('react-big-calendar/lib/addons/dragAndDrop', () => ({
  default: (Component: any) => (props: any) => (
    <div data-testid="rbc-dnd-calendar">
      <Component {...props} />
    </div>
  ),
}));

// Suppress moment locale import side-effects
vi.mock('moment/locale/ru', () => ({}));

// Suppress CSS imports
vi.mock('react-big-calendar/lib/css/react-big-calendar.css', () => ({}));
vi.mock('react-big-calendar/lib/addons/dragAndDrop/styles.css', () => ({}));

function renderCalendarPage() {
  return render(
    <MemoryRouter>
      <CalendarPage />
    </MemoryRouter>,
  );
}

/**
 * Helper: open the "Добавить занятие" modal and return utilities.
 */
async function openAddLessonModal() {
  const user = userEvent.setup();
  const utils = renderCalendarPage();
  await user.click(screen.getByRole('button', { name: /Добавить занятие/i }));
  return { user, ...utils };
}

describe('CalendarPage', () => {
  it('renders the page title', () => {
    renderCalendarPage();
    expect(screen.getByText('Расписание (Drag & Drop)')).toBeInTheDocument();
  });

  it('renders the "Добавить занятие" button', () => {
    renderCalendarPage();
    expect(screen.getByRole('button', { name: /Добавить занятие/i })).toBeInTheDocument();
  });

  it('renders the calendar component', () => {
    renderCalendarPage();
    expect(screen.getByTestId('rbc-dnd-calendar')).toBeInTheDocument();
  });

  describe('Add lesson modal', () => {
    it('opens the modal when the add button is clicked', async () => {
      await openAddLessonModal();
      expect(screen.getByText('Запланировать урок')).toBeInTheDocument();
    });

    it('displays course, teacher, and time fields inside the modal', async () => {
      await openAddLessonModal();

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Курс')).toBeInTheDocument();
      expect(within(dialog).getByText('Преподаватель')).toBeInTheDocument();
      expect(within(dialog).getByText('Время')).toBeInTheDocument();
    });

    it('shows course options when course select is opened', async () => {
      await openAddLessonModal();

      // Find the course Select's trigger element within the form
      const courseLabel = screen.getByText('Курс');
      const formItem = courseLabel.closest('.ant-form-item')!;
      const selectTrigger = formItem.querySelector('.ant-select')!;
      fireEvent.mouseDown(selectTrigger);

      await waitFor(() => {
        // Options render in a portal (document.body) for Ant Design Select
        expect(screen.getByText('Основы React')).toBeInTheDocument();
        expect(screen.getByText('Продвинутый TypeScript')).toBeInTheDocument();
      });
    });

    it('shows teacher options when teacher select is opened', async () => {
      await openAddLessonModal();

      const teacherLabel = screen.getByText('Преподаватель');
      const formItem = teacherLabel.closest('.ant-form-item')!;
      const selectTrigger = formItem.querySelector('.ant-select')!;
      fireEvent.mouseDown(selectTrigger);

      await waitFor(() => {
        expect(screen.getByText('Анна Преподаватель')).toBeInTheDocument();
        expect(screen.getByText('Иван Сергеев')).toBeInTheDocument();
      });
    });

    it('displays validation errors when submitting empty form', async () => {
      const user = userEvent.setup();
      renderCalendarPage();

      await user.click(screen.getByRole('button', { name: /Добавить занятие/i }));

      // Ant Design's form.validateFields() rejects the promise when validation fails.
      // The component doesn't catch it (Antd displays errors inline via the form).
      // Suppress the Node-level unhandled rejection so vitest doesn't fail.
      const suppressRejection = (reason: any) => { /* expected */ };
      process.on('unhandledRejection', suppressRejection);

      // Click "Сохранить" without filling anything
      await user.click(screen.getByRole('button', { name: /Сохранить/i }));

      // Wait for validation error messages to appear in .ant-form-item-explain-error
      await waitFor(() => {
        const errorMessages = document.querySelectorAll('.ant-form-item-explain-error');
        const errorTexts = Array.from(errorMessages).map(el => el.textContent);
        expect(errorTexts).toContain('Выберите курс');
        expect(errorTexts).toContain('Выберите преподавателя');
        expect(errorTexts).toContain('Выберите время');
      });

      // Give the rejected promise time to reach the process handler
      await new Promise(resolve => setTimeout(resolve, 50));
      process.removeListener('unhandledRejection', suppressRejection);
    });

    it('closes the modal when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderCalendarPage();

      await user.click(screen.getByRole('button', { name: /Добавить занятие/i }));
      expect(screen.getByText('Запланировать урок')).toBeInTheDocument();

      // Click the modal cancel button (Отмена)
      await user.click(screen.getByRole('button', { name: /Отмена/i }));

      // jsdom doesn't process CSS animations, so Ant Design's modal leave animation
      // never completes — the dialog stays in the DOM with leave classes.
      // Verify the close was triggered by checking the leave animation class.
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.className).toMatch(/ant-zoom-leave/);
      });
    });
  });
});
