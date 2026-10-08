import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InterviewRoom } from '../../src/pages/InterviewRoom';
import * as interviewsApi from '../../src/services/interviewsApi';
import type { InterviewSession } from '../../src/types/interview';

jest.mock('../../src/services/interviewsApi', () => ({
  ...jest.requireActual('../../src/services/interviewsApi'),
  startOrResumeInterview: jest.fn(),
  recordConsent: jest.fn(),
}));

const mockedStart = interviewsApi.startOrResumeInterview as jest.MockedFunction<
  typeof interviewsApi.startOrResumeInterview
>;
const mockedConsent = interviewsApi.recordConsent as jest.MockedFunction<
  typeof interviewsApi.recordConsent
>;

const baseSession: InterviewSession = {
  id: 'session-1',
  status: 'consent_pending',
  job: { id: 'job-1', title: 'Backend Engineer', description: 'Build the interview APIs' },
  consent: null,
  notice: {
    text: 'Your audio will be recorded and used for internal purposes only.',
    version: '1',
  },
};

const acceptedSession: InterviewSession = {
  ...baseSession,
  status: 'in_progress',
  consent: { decision: 'accepted', decidedAt: '2026-01-02T00:00:00.000Z', noticeVersion: '1' },
};

const declinedSession: InterviewSession = {
  ...baseSession,
  status: 'declined',
  consent: { decision: 'declined', decidedAt: '2026-01-02T00:00:00.000Z', noticeVersion: '1' },
};

function renderRoom() {
  return render(
    <MemoryRouter initialEntries={['/jobs/job-1']}>
      <Routes>
        <Route path="/" element={<p>Dashboard home</p>} />
        <Route path="/jobs/:id" element={<InterviewRoom />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('InterviewRoom', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the role and a chat-like conversation region', async () => {
    mockedStart.mockResolvedValue(baseSession);
    renderRoom();

    expect(await screen.findByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: /interview conversation/i }),
    ).toBeInTheDocument();
  });

  it('shows the consent banner before the interview starts', async () => {
    mockedStart.mockResolvedValue(baseSession);
    renderRoom();

    expect(
      await screen.findByRole('region', { name: /recording consent/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
  });

  it('hides the banner and shows the interview in progress after accepting', async () => {
    mockedStart.mockResolvedValue(baseSession);
    mockedConsent.mockResolvedValue(acceptedSession);
    renderRoom();

    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: /recording consent/i })).not.toBeInTheDocument(),
    );
    expect(mockedConsent).toHaveBeenCalledWith('session-1', 'accepted');
    expect(screen.getByText(/interview in progress/i)).toBeInTheDocument();
  });

  it('does not show the banner for a session that is already in progress', async () => {
    mockedStart.mockResolvedValue(acceptedSession);
    renderRoom();

    expect(await screen.findByRole('heading', { name: 'Backend Engineer' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /recording consent/i })).not.toBeInTheDocument();
  });

  it('returns to the dashboard when the candidate declines', async () => {
    mockedStart.mockResolvedValue(baseSession);
    mockedConsent.mockResolvedValue(declinedSession);
    renderRoom();

    await userEvent.click(await screen.findByRole('button', { name: 'Decline' }));

    expect(mockedConsent).toHaveBeenCalledWith('session-1', 'declined');
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
  });

  it('guides back to the dashboard when the role is unknown', async () => {
    mockedStart.mockRejectedValue(new interviewsApi.InterviewsApiError(404, 'not found'));
    renderRoom();

    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
  });
});
