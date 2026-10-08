import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobCard } from '../../src/components/JobCard';
import type { Job } from '../../src/types/job';

const job: Job = { id: 'job-1', title: 'Backend Engineer', description: 'Build APIs' };

describe('JobCard activation', () => {
  it('calls onSelect with the job when the action is clicked', async () => {
    const onSelect = jest.fn();
    render(<JobCard job={job} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'View Backend Engineer' }));

    expect(onSelect).toHaveBeenCalledWith(job);
  });

  it('calls onSelect when activated via the keyboard', async () => {
    const onSelect = jest.fn();
    render(<JobCard job={job} onSelect={onSelect} />);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'View Backend Engineer' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(job);
  });
});
