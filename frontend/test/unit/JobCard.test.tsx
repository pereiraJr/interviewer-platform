import { render, screen } from '@testing-library/react';
import { JobCard } from '../../src/components/JobCard';

const job = { id: 'job-1', title: 'Backend Engineer', description: 'Build APIs' };

describe('JobCard', () => {
  it('renders the job title and description', () => {
    render(<JobCard job={job} />);
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Build APIs')).toBeInTheDocument();
  });

  it('renders an empty description without crashing', () => {
    render(<JobCard job={{ ...job, description: '' }} />);
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
  });
});
