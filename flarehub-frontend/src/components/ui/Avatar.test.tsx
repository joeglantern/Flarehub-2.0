import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials when no image src provided', () => {
    render(<Avatar firstName="John" lastName="Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders ? when no name provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders single initial when only first name', () => {
    render(<Avatar firstName="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('uppercases initials', () => {
    render(<Avatar firstName="alice" lastName="baker" />);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('applies size class for sm', () => {
    const { container } = render(<Avatar firstName="A" size="sm" />);
    expect(container.firstChild).toHaveClass('w-7');
  });

  it('applies size class for lg', () => {
    const { container } = render(<Avatar firstName="A" size="lg" />);
    expect(container.firstChild).toHaveClass('w-11');
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar firstName="A" className="border-2" />);
    expect(container.firstChild).toHaveClass('border-2');
  });
});
