import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PaymentsPage from '../PaymentsPage';

function renderPayments() {
  return render(
    <MemoryRouter>
      <PaymentsPage />
    </MemoryRouter>
  );
}

describe('PaymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress antd message
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders the payments table with initial data', () => {
    renderPayments();

    expect(screen.getByText('Платежи')).toBeInTheDocument();
    expect(screen.getByText('TXN-1001')).toBeInTheDocument();
    expect(screen.getByText('TXN-1002')).toBeInTheDocument();
    expect(screen.getByText('TXN-1003')).toBeInTheDocument();
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Алексей Смирнов')).toBeInTheDocument();
    expect(screen.getByText('Мария Петрова')).toBeInTheDocument();
  });

  it('renders table column headers', () => {
    renderPayments();

    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Студент')).toBeInTheDocument();
    expect(screen.getByText('Сумма')).toBeInTheDocument();
    expect(screen.getByText('Дата')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Статус' })).toBeInTheDocument();
    expect(screen.getByText('Действия')).toBeInTheDocument();
  });

  it('opens create modal when clicking "Создать счет"', async () => {
    const user = userEvent.setup();
    renderPayments();

    await user.click(screen.getByText('Создать счет'));

    await waitFor(() => {
      expect(screen.getByText('Создание счета')).toBeInTheDocument();
    });
  });

  it('delete button removes a payment from the table', async () => {
    const user = userEvent.setup();
    renderPayments();

    // All 3 payments should be visible initially
    expect(screen.getByText('TXN-1001')).toBeInTheDocument();
    expect(screen.getByText('TXN-1002')).toBeInTheDocument();
    expect(screen.getByText('TXN-1003')).toBeInTheDocument();

    // Find and click the delete button for the first row (TXN-1001)
    // The delete buttons are danger text buttons with DeleteOutlined icon
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    // Click the first delete button (in the first row)
    const firstRowDeleteBtn = rows[0].querySelector('button.ant-btn-dangerous');
    expect(firstRowDeleteBtn).toBeTruthy();
    await user.click(firstRowDeleteBtn!);

    // TXN-1001 should be removed
    await waitFor(() => {
      expect(screen.queryByText('TXN-1001')).not.toBeInTheDocument();
    });

    // Remaining payments should still be visible
    expect(screen.getByText('TXN-1002')).toBeInTheDocument();
    expect(screen.getByText('TXN-1003')).toBeInTheDocument();
  });

  it('search input filters payments by student name', async () => {
    const user = userEvent.setup();
    renderPayments();

    const searchInput = screen.getByPlaceholderText('Поиск по студенту или ID...');
    await user.type(searchInput, 'Мария');

    // Only Мария Петрова (TXN-1003) should be visible
    await waitFor(() => {
      expect(screen.getByText('TXN-1003')).toBeInTheDocument();
    });

    // Other payments should be filtered out
    expect(screen.queryByText('TXN-1001')).not.toBeInTheDocument();
    expect(screen.queryByText('TXN-1002')).not.toBeInTheDocument();
  });

  it('search input filters payments by ID', async () => {
    const user = userEvent.setup();
    renderPayments();

    const searchInput = screen.getByPlaceholderText('Поиск по студенту или ID...');
    await user.type(searchInput, 'TXN-1002');

    await waitFor(() => {
      expect(screen.getByText('TXN-1002')).toBeInTheDocument();
    });

    expect(screen.queryByText('TXN-1001')).not.toBeInTheDocument();
    expect(screen.queryByText('TXN-1003')).not.toBeInTheDocument();
  });

  it('displays payment amounts formatted with currency', () => {
    renderPayments();

    // Amounts should be rendered with ₽ suffix
    // Note: two payments have 15000 (TXN-1001 and TXN-1003)
    const amounts15k = screen.getAllByText((content) => content.includes('15') && content.includes('000') && content.includes('₽'));
    expect(amounts15k.length).toBe(2);
    const amounts40k = screen.getAllByText((content) => content.includes('40') && content.includes('000') && content.includes('₽'));
    expect(amounts40k.length).toBe(1);
  });

  it('displays payment status tags with correct labels', () => {
    renderPayments();

    expect(screen.getByText('Оплачен')).toBeInTheDocument();
    expect(screen.getByText('Просрочен')).toBeInTheDocument();
    expect(screen.getByText('В ожидании')).toBeInTheDocument();
  });
});
