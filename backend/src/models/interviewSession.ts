import type { ObjectId } from 'mongodb';
import type { JobSummary } from './job';

export type InterviewStatus = 'consent_pending' | 'in_progress' | 'declined';
export type ConsentDecision = 'accepted' | 'declined';

export interface ConsentRecord {
  decision: ConsentDecision;
  decidedAt: Date;
  noticeVersion: string;
}

export interface InterviewSessionDocument {
  _id: ObjectId;
  jobId: ObjectId;
  candidateId?: string;
  status: InterviewStatus;
  consent?: ConsentRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecordingNotice {
  text: string;
  version: string;
}

export interface ConsentView {
  decision: ConsentDecision;
  decidedAt: string;
  noticeVersion: string;
}

export interface InterviewSessionView {
  id: string;
  status: InterviewStatus;
  job: JobSummary;
  consent: ConsentView | null;
  notice: RecordingNotice;
}

export const RECORDING_NOTICE: RecordingNotice = {
  version: '1',
  text:
    'Your audio will be recorded and used for internal purposes only. ' +
    'Accept to begin the interview; decline to return to the dashboard.',
};

export const CONSENT_DECISIONS: readonly ConsentDecision[] = ['accepted', 'declined'];

export function isConsentDecision(value: unknown): value is ConsentDecision {
  return typeof value === 'string' && (CONSENT_DECISIONS as readonly string[]).includes(value);
}

export function toConsentView(record: ConsentRecord): ConsentView {
  return {
    decision: record.decision,
    decidedAt: record.decidedAt.toISOString(),
    noticeVersion: record.noticeVersion,
  };
}

export function toInterviewSessionView(
  document: InterviewSessionDocument,
  job: JobSummary,
): InterviewSessionView {
  return {
    id: document._id.toHexString(),
    status: document.status,
    job,
    consent: document.consent ? toConsentView(document.consent) : null,
    notice: RECORDING_NOTICE,
  };
}
