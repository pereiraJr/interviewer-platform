import type { Job } from './job';

export type InterviewStatus = 'consent_pending' | 'in_progress' | 'declined';
export type ConsentDecision = 'accepted' | 'declined';

export type MessageAuthor = 'agent' | 'candidate';
export type MessageKind = 'text' | 'audio';

export interface RecordingNotice {
  text: string;
  version: string;
}

export interface ConsentRecord {
  decision: ConsentDecision;
  decidedAt: string;
  noticeVersion: string;
}

export interface AudioMetadata {
  contentType: string;
  durationMs: number;
  byteLength: number;
}

export interface Message {
  id: string;
  author: MessageAuthor;
  kind: MessageKind;
  text?: string;
  audio?: AudioMetadata;
  sequence: number;
  createdAt: string;
}

export interface InterviewSession {
  id: string;
  status: InterviewStatus;
  job: Job;
  consent: ConsentRecord | null;
  notice: RecordingNotice;
}
