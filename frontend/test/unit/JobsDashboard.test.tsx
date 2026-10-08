import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { JobsDashboard } from '../../src/pages/JobsDashboard';
import * as jobsApi from '../../src/services/jobsApi';

jest.mock('../../src/services/jobsApi');

const mockedFetchJobs = jobsApi.fetchJobs as jest.MockedFunction<typeof jobsApi.fetchJobs>;

function renderDashboard() {
  return render(
    <MemoryRouter>
      <JobsDashboard />
    </MemoryRouter>,
  );
}

describe('JobsDashboard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a loading state first', () => {
    mockedFetchJobs.mockReturnValue(new Promise(() => undefined));
    renderDashboard();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders job cards on success', async () => {
    mockedFetchJobs.mockResolvedValue([{ id: '1', title: 'Engineer', description: 'A' }]);
    renderDashboard();
    expect(await screen.findByText('Engineer')).toBeInTheDocument();
  });

  it('shows an empty state when there are no jobs', async () => {
    mockedFetchJobs.mockResolvedValue([]);
    renderDashboard();
    expect(await screen.findByText(/no jobs are available/i)).toBeInTheDocument();
  });

  it('shows an error state and retries on demand', async () => {
    mockedFetchJobs.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([]);
    renderDashboard();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(mockedFetchJobs).toHaveBeenCalledTimes(2));
  });
});
