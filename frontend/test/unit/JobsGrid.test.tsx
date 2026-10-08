import { render, screen } from '@testing-library/react';
import { JobsGrid } from '../../src/components/JobsGrid';
import type { Job } from '../../src/types/job';

const jobs: Job[] = [
  { id: '1', title: 'Engineer', description: 'A' },
  { id: '2', title: 'Designer', description: 'B' },
  { id: '3', title: 'Product Manager', description: 'C' },
];

describe('JobsGrid', () => {
  it('renders one card per job', () => {
    render(<JobsGrid jobs={jobs} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders the grid container used for the three-column layout', () => {
    const { container } = render(<JobsGrid jobs={jobs} />);
    expect(container.querySelector('.jobs-grid')).not.toBeNull();
  });
});
