import type { Binary, ObjectId } from 'mongodb';

export type MessageAuthor = 'agent' | 'candidate';
export type MessageKind = 'text' | 'audio';

export const MAX_DURATION_MS = 120_000;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export const ALLOWED_AUDIO_TYPES: readonly string[] = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
];

export interface AudioMetadata {
  recordingId: ObjectId;
  contentType: string;
  durationMs: number;
  byteLength: number;
}

export interface InterviewMessageDocument {
  _id: ObjectId;
  sessionId: ObjectId;
  author: MessageAuthor;
  kind: MessageKind;
  text?: string;
  audio?: AudioMetadata;
  sequence: number;
  createdAt: Date;
}

export interface AudioRecordingDocument {
  _id: ObjectId;
  sessionId: ObjectId;
  data: Binary;
  contentType: string;
  durationMs: number;
  byteLength: number;
  createdAt: Date;
}

export interface AudioMetadataView {
  contentType: string;
  durationMs: number;
  byteLength: number;
}

export interface MessageView {
  id: string;
  author: MessageAuthor;
  kind: MessageKind;
  text?: string;
  audio?: AudioMetadataView;
  sequence: number;
  createdAt: string;
}

/**
 * Fixed, server-owned opening for every interview. Seeded when consent is accepted.
 * Order matters: greeting (introducing AIfter Agent) -> "Lets Get Started:" -> intro question.
 */
export const OPENING_MESSAGES: readonly string[] = [
  "Hi, I'm AIfter Agent, your AI interviewer. Welcome to your interview.",
  'Lets Get Started:',
  'Could you give a brief intro about yourself?',
];

export function normalizeContentType(contentType: string | undefined): string {
  return (contentType ?? '').split(';')[0].trim().toLowerCase();
}

export function isAllowedAudioType(contentType: string | undefined): boolean {
  const normalized = normalizeContentType(contentType);
  return normalized.length > 0 && ALLOWED_AUDIO_TYPES.includes(normalized);
}

export function isValidDuration(durationMs: number): boolean {
  return Number.isInteger(durationMs) && durationMs >= 0 && durationMs <= MAX_DURATION_MS;
}

export function toMessageView(document: InterviewMessageDocument): MessageView {
  return {
    id: document._id.toHexString(),
    author: document.author,
    kind: document.kind,
    ...(document.text !== undefined ? { text: document.text } : {}),
    ...(document.audio
      ? {
          audio: {
            contentType: document.audio.contentType,
            durationMs: document.audio.durationMs,
            byteLength: document.audio.byteLength,
          },
        }
      : {}),
    sequence: document.sequence,
    createdAt: document.createdAt.toISOString(),
  };
}
