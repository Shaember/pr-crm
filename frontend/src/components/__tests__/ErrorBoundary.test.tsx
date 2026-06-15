import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';
import { vi } from 'vitest';

// Suppress console.error from React error boundary in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

afterAll(() => {
  consoleSpy.mockRestore();
});

function ThrowingChild(): JSX.Element {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('shows default subtitle when error has no message', () => {
    const NoMessageError = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <NoMessageError />
      </ErrorBoundary>
    );
    expect(screen.getByText('Произошла непредвиденная ошибка')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Что-то пошло не так')).not.toBeInTheDocument();
  });

  it('retry button resets error state and re-renders children', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();

    // Click retry to reset error state
    fireEvent.click(screen.getByText('Попробовать снова'));

    // After reset, the boundary re-renders children — but ThrowingChild will throw again.
    // So the error UI should appear again with the error message.
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
  });

  it('retry button resets state so non-throwing children can render', () => {
    // We need a component that can toggle between throwing and not throwing.
    // Since ErrorBoundary resets hasError, we simulate by wrapping differently.
    let shouldThrow = true;
    function ToggleChild() {
      if (shouldThrow) throw new Error('Toggle error');
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <ToggleChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Toggle error')).toBeInTheDocument();

    // Change the flag, then click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Попробовать снова'));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('home button is present in error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('На главную')).toBeInTheDocument();
  });
});
