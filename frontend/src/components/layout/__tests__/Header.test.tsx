import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
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

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe('Header', () => {
  it('shows username from store', () => {
    useAuthStore.setState({
      user: { username: 'Иван', role: 'Admin' },
      token: 'tok',
      isAuthenticated: true,
    });

    renderHeader();

    expect(screen.getByText('Иван')).toBeInTheDocument();
  });

  it('shows role tag with correct color and label', () => {
    useAuthStore.setState({
      user: { username: 'Иван', role: 'Teacher' },
      token: 'tok',
      isAuthenticated: true,
    });

    renderHeader();

    const tag = screen.getByText('Преподаватель');
    expect(tag).toBeInTheDocument();
    // Ant Design Tag with color="purple" applies a class like ant-tag-purple
    const tagEl = tag.closest('.ant-tag');
    expect(tagEl).toBeInTheDocument();
    expect(tagEl!.className).toContain('purple');
  });

  it('logout button clears the store', async () => {
    const user = userEvent.setup();

    useAuthStore.setState({
      user: { username: 'Иван', role: 'Admin' },
      token: 'tok',
      isAuthenticated: true,
    });

    renderHeader();

    await user.click(screen.getByRole('button', { name: /выйти/i }));

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
