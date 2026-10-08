import { render, screen } from '@testing-library/react';
import { StatusMessage } from '../../src/components/StatusMessage';

describe('StatusMessage', () => {
  it('announces the loading state via role="status"', () => {
    render(<StatusMessage variant="loading">Loading available jobs…</StatusMessage>);

    const status = screen.getByRole('status');

    expect(status).toHaveTextContent(/loading available jobs/i);
  });

  it('announces the error state via role="alert"', () => {
    render(
      <StatusMessage variant="error">
        <p>Something went wrong</p>
      </StatusMessage>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('renders the empty state message', () => {
    render(<StatusMessage variant="empty">No jobs are available right now.</StatusMessage>);

    expect(screen.getByText(/no jobs are available/i)).toBeInTheDocument();
  });
});
