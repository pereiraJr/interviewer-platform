import { getApiBaseUrl } from '../config';
import type {
  ConsentDecision,
  InterviewSession,
  InterviewStatus,
  Message,
} from '../types/interview';

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

function isAudioMetadata(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.contentType === 'string' &&
    typeof candidate.durationMs === 'number' &&
    typeof candidate.byteLength === 'number'
  );
}

function isMessage(value: unknown): value is Message {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const author = candidate.author;
  const kind = candidate.kind;

  return (
    typeof candidate.id === 'string' &&
    (author === 'agent' || author === 'candidate') &&
    (kind === 'text' || kind === 'audio') &&
    typeof candidate.sequence === 'number' &&
    typeof candidate.createdAt === 'string' &&
    (candidate.text === undefined || typeof candidate.text === 'string') &&
    (candidate.audio === undefined || isAudioMetadata(candidate.audio))
  );
}

function toMessage(response: Response, payload: unknown): Message {
  if (!isMessage(payload)) {
    throw new InterviewsApiError(response.status, 'Malformed message response');
  }
  return payload;
}

export async function getConversation(
  sessionId: string,
  signal?: AbortSignal,
): Promise<Message[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/interviews/${encodeURIComponent(sessionId)}/messages`,
    { signal },
  );

  if (!response.ok) {
    throw new InterviewsApiError(response.status, `Conversation request failed (${response.status})`);
  }

  const payload = (await response.json()) as { messages?: unknown };
  if (!payload || !Array.isArray(payload.messages) || !payload.messages.every(isMessage)) {
    throw new InterviewsApiError(response.status, 'Malformed conversation response');
  }

  return payload.messages;
}

export function audioUrl(sessionId: string, messageId: string): string {
  return `${getApiBaseUrl()}/api/interviews/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(
    messageId,
  )}/audio`;
}

export async function sendAudioReply(
  sessionId: string,
  blob: Blob,
  durationMs: number,
): Promise<Message> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/interviews/${encodeURIComponent(sessionId)}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'audio/webm',
        'x-audio-duration-ms': String(Math.max(0, Math.round(durationMs))),
      },
      body: blob,
    },
  );

  if (!response.ok) {
    throw new InterviewsApiError(response.status, `Could not save the recording (${response.status})`);
  }

  return toMessage(response, await response.json());
}
