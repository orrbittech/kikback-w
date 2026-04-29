import type { ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DashboardError from '@/app/dashboard/error';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('DashboardError', () => {
  it('invokes reset when Try again is clicked', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<DashboardError error={new Error('test')} reset={reset} />);

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders links to home and referrals', () => {
    render(<DashboardError error={new Error('test')} reset={vi.fn()} />);

    expect(screen.getByRole('link', { name: /home/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /referrals/i }).getAttribute('href')).toBe(
      '/dashboard/referrals',
    );
  });
});
