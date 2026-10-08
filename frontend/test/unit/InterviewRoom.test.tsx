import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InterviewRoom } from '../../src/pages/InterviewRoom';
import * as interviewsApi from '../../src/services/interviewsApi';
import type { InterviewSession, Message } from '../../src/types/interview';

jest.mock('../../src/services/interviewsApi', () => ({
  ...jest.requireActual('../../src/services/interviewsApi'),
  startOrResumeInterview: jest.fn(),
  recordConsent: jest.fn(),
  getConversation: jest.fn(),
  sendAudioReply: jest.fn(),
}));

const mockedStart = interviewsApi.startOrResumeInterview as jest.MockedFunction<
  typeof interviewsApi.startOrResumeInterview
>;
const mockedConsent = interviewsApi.recordConsent as jest.MockedFunction<
  typeof interviewsApi.recordConsent
>;
const mockedConversation = interviewsApi.getConversation as jest.MockedFunction<
  typeof interviewsApi.getConversation
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

const openingMessages: Message[] = [
  {
    id: 'm1',
    author: 'agent',
    kind: 'text',
    text: "Hi, I'm AIfter Agent, your AI interviewer. Welcome to your interview.",
    sequence: 1,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'm2',
    author: 'agent',
    kind: 'text',
    text: 'Lets Get Started:',
    sequence: 2,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'm3',
    author: 'agent',
    kind: 'text',
    text: 'Could you give a brief intro about yourself?',
    sequence: 3,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

const audioReply: Message = {
  id: 'm4',
  author: 'candidate',
  kind: 'audio',
  audio: { contentType: 'audio/webm', durationMs: 1500, byteLength: 5 },
  sequence: 4,
  createdAt: '2026-01-02T00:00:01.000Z',
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
  beforeEach(() => {
    mockedConversation.mockResolvedValue([]);
  });

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

  it('shows the scripted opening in order after accepting consent', async () => {
    mockedStart.mockResolvedValue(baseSession);
    mockedConsent.mockResolvedValue(acceptedSession);
    mockedConversation.mockResolvedValue(openingMessages);
    renderRoom();

    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }));

    expect(await screen.findByText('Lets Get Started:')).toBeInTheDocument();
    expect(
      screen.getByText('Could you give a brief intro about yourself?'),
    ).toBeInTheDocument();
    expect(mockedConsent).toHaveBeenCalledWith('session-1', 'accepted');
    expect(mockedConversation).toHaveBeenCalledWith('session-1');
    expect(
      screen.queryByRole('region', { name: /recording consent/i }),
    ).not.toBeInTheDocument();
  });

  it('renders a restored conversation with the audio reply playable', async () => {
    mockedStart.mockResolvedValue(acceptedSession);
    mockedConversation.mockResolvedValue([...openingMessages, audioReply]);
    const { container } = renderRoom();

    expect(await screen.findByText('Lets Get Started:')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('audio')).not.toBeNull());
    expect(container.querySelector('audio')?.getAttribute('src')).toContain(
      '/api/interviews/session-1/messages/m4/audio',
    );
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
