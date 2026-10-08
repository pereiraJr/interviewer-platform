import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JobsDashboard } from '../../src/pages/JobsDashboard';
import * as jobsApi from '../../src/services/jobsApi';

jest.mock('../../src/services/jobsApi');

const mockedFetchJobs = jobsApi.fetchJobs as jest.MockedFunction<typeof jobsApi.fetchJobs>;

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<JobsDashboard />} />
        <Route path="/jobs/:id" element={<p>Job detail</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('JobsDashboard navigation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('navigates to the job detail route when a card is activated', async () => {
    mockedFetchJobs.mockResolvedValue([{ id: 'abc', title: 'Engineer', description: 'A' }]);
    renderWithRoutes();

    await userEvent.click(await screen.findByRole('button', { name: 'View Engineer' }));

    expect(await screen.findByText('Job detail')).toBeInTheDocument();
  });
});
