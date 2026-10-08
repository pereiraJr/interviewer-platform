import type { Job } from './job';

export type InterviewStatus = 'consent_pending' | 'in_progress' | 'declined';
export type ConsentDecision = 'accepted' | 'declined';

export interface RecordingNotice {
  text: string;
  version: string;
}

export interface ConsentRecord {
  decision: ConsentDecision;
  decidedAt: string;
  noticeVersion: string;
}

export interface InterviewSession {
  id: string;
  status: InterviewStatus;
  job: Job;
  consent: ConsentRecord | null;
  notice: RecordingNotice;
}
