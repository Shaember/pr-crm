import { render, screen } from '@testing-library/react';
import StudentStatusBadge from '../StudentStatusBadge';

describe('StudentStatusBadge', () => {
  it('renders green tag for Активен status', () => {
    render(<StudentStatusBadge status="Активен" />);
    const tag = screen.getByText('АКТИВЕН');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-green');
  });

  it('renders volcano tag for Отстранен status', () => {
    render(<StudentStatusBadge status="Отстранен" />);
    const tag = screen.getByText('ОТСТРАНЕН');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-volcano');
  });

  it('renders gold tag for Выпущен status', () => {
    render(<StudentStatusBadge status="Выпущен" />);
    const tag = screen.getByText('ВЫПУЩЕН');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-gold');
  });

  it('renders default tag for Отчислен status', () => {
    render(<StudentStatusBadge status="Отчислен" />);
    const tag = screen.getByText('ОТЧИСЛЕН');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-default');
  });

  it('displays status text in uppercase', () => {
    render(<StudentStatusBadge status="Активен" />);
    expect(screen.getByText('АКТИВЕН')).toBeInTheDocument();
  });
});
