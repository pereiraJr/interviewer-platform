import { getApiBaseUrl } from '../config';
import type { ConsentDecision, InterviewSession, InterviewStatus } from '../types/interview';

export class InterviewsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'InterviewsApiError';
  }
}

const STATUSES: readonly InterviewStatus[] = ['consent_pending', 'in_progress', 'declined'];

function isInterviewSession(value: unknown): value is InterviewSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const job = candidate.job as Record<string, unknown> | undefined;
  const notice = candidate.notice as Record<string, unknown> | undefined;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.status === 'string' &&
    STATUSES.includes(candidate.status as InterviewStatus) &&
    typeof job === 'object' &&
    job !== null &&
    typeof job.id === 'string' &&
    typeof job.title === 'string' &&
    typeof job.description === 'string' &&
    typeof notice === 'object' &&
    notice !== null &&
    typeof notice.text === 'string' &&
    typeof notice.version === 'string'
  );
}

async function toSession(response: Response): Promise<InterviewSession> {
  if (!response.ok) {
    throw new InterviewsApiError(response.status, `Interview request failed (${response.status})`);
  }

  const payload = (await response.json()) as unknown;
  if (!isInterviewSession(payload)) {
    throw new InterviewsApiError(response.status, 'Malformed interview response');
  }

  return payload;
}

export async function startOrResumeInterview(
  jobId: string,
  signal?: AbortSignal,
): Promise<InterviewSession> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/jobs/${encodeURIComponent(jobId)}/interview`,
    { method: 'POST', signal },
  );
  return toSession(response);
}

export async function getInterviewSession(
  id: string,
  signal?: AbortSignal,
): Promise<InterviewSession> {
  const response = await fetch(`${getApiBaseUrl()}/api/interviews/${encodeURIComponent(id)}`, {
    signal,
  });
  return toSession(response);
}

export async function recordConsent(
  id: string,
  decision: ConsentDecision,
): Promise<InterviewSession> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/interviews/${encodeURIComponent(id)}/consent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision }),
    },
  );
  return toSession(response);
}
