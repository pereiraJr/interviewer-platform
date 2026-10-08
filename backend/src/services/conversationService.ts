import { HttpError } from '../middleware/errorHandler';
import {
  isAllowedAudioType,
  isValidDuration,
  MAX_AUDIO_BYTES,
  normalizeContentType,
  toMessageView,
  type MessageView,
} from '../models/interviewMessage';
import type { AudioRecordingRepository } from '../repositories/audioRecordingRepository';
import type { InterviewMessageRepository } from '../repositories/interviewMessageRepository';
import type { InterviewSessionRepository } from '../repositories/interviewSessionRepository';

export interface AddAudioReplyInput {
  data: Buffer;
  contentType: string | undefined;
  durationMs: number;
}

export interface AudioPayload {
  data: Buffer;
  contentType: string;
}

export interface ConversationService {
  getConversation(sessionId: string): Promise<MessageView[]>;
  seedOpening(sessionId: string): Promise<void>;
  addAudioReply(sessionId: string, input: AddAudioReplyInput): Promise<MessageView>;
  getAudio(sessionId: string, messageId: string): Promise<AudioPayload>;
}

const CONSENT_REQUIRED = new HttpError(
  409,
  'CONSENT_REQUIRED',
  'Consent must be accepted before the interview begins',
);

export function createConversationService(
  sessionRepository: InterviewSessionRepository,
  messageRepository: InterviewMessageRepository,
  audioRepository: AudioRecordingRepository,
): ConversationService {
  async function requireSession(sessionId: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) {
      throw new HttpError(404, 'SESSION_NOT_FOUND', 'Interview session not found');
    }
    return session;
  }

  async function requireInProgress(sessionId: string) {
    const session = await requireSession(sessionId);
    if (session.status !== 'in_progress') {
      throw CONSENT_REQUIRED;
    }
    return session;
  }

  return {
    async getConversation(sessionId: string): Promise<MessageView[]> {
      await requireSession(sessionId);
      const messages = await messageRepository.listBySessionId(sessionId);
      return messages.map(toMessageView);
    },

    async seedOpening(sessionId: string): Promise<void> {
      await requireInProgress(sessionId);
      await messageRepository.seedOpeningIfEmpty(sessionId);
    },

    async addAudioReply(sessionId: string, input: AddAudioReplyInput): Promise<MessageView> {
      const session = await requireInProgress(sessionId);

      if (!isAllowedAudioType(input.contentType)) {
        throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported audio content type');
      }
      if (!input.data || input.data.byteLength === 0) {
        throw new HttpError(400, 'INVALID_AUDIO', 'Audio payload is empty');
      }
      if (input.data.byteLength > MAX_AUDIO_BYTES) {
        throw new HttpError(413, 'AUDIO_TOO_LARGE', 'Audio exceeds the maximum allowed size');
      }
      if (!isValidDuration(input.durationMs)) {
        throw new HttpError(400, 'INVALID_AUDIO', 'Invalid audio duration');
      }

      const contentType = normalizeContentType(input.contentType);
      const recording = await audioRepository.store({
        sessionId,
        data: input.data,
        contentType,
        durationMs: input.durationMs,
      });

      const message = await messageRepository.append({
        sessionId: session._id,
        author: 'candidate',
        kind: 'audio',
        audio: {
          recordingId: recording._id,
          contentType,
          durationMs: input.durationMs,
          byteLength: recording.byteLength,
        },
      });

      return toMessageView(message);
    },

    async getAudio(sessionId: string, messageId: string): Promise<AudioPayload> {
      await requireInProgress(sessionId);

      const message = await messageRepository.findById(sessionId, messageId);
      if (!message || !message.audio) {
        throw new HttpError(404, 'AUDIO_NOT_FOUND', 'Audio not found');
      }

      const recording = await audioRepository.findById(
        sessionId,
        message.audio.recordingId.toHexString(),
      );
      if (!recording) {
        throw new HttpError(404, 'AUDIO_NOT_FOUND', 'Audio not found');
      }

      return {
        data: Buffer.from(recording.data.buffer),
        contentType: recording.contentType,
      };
    },
  };
}
