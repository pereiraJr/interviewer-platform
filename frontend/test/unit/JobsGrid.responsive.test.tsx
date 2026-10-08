import { render } from '@testing-library/react';
import { JobsGrid } from '../../src/components/JobsGrid';
import type { Job } from '../../src/types/job';

const jobs: Job[] = [{ id: '1', title: 'Engineer', description: 'A' }];

describe('JobsGrid responsive contract', () => {
  it('applies the responsive grid class targeted by the media queries', () => {
    const { container } = render(<JobsGrid jobs={jobs} />);
    const grid = container.querySelector('.jobs-grid');

    expect(grid).not.toBeNull();
    expect(grid).toHaveClass('jobs-grid');
  });

  it('renders each job as a grid item so columns can reflow', () => {
    const { container } = render(<JobsGrid jobs={jobs} />);
    expect(container.querySelectorAll('.jobs-grid__item')).toHaveLength(1);
  });
});
