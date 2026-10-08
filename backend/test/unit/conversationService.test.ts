import { Binary, ObjectId } from 'mongodb';
import {
  MAX_AUDIO_BYTES,
  type InterviewMessageDocument,
} from '../../src/models/interviewMessage';
import type { AudioRecordingRepository } from '../../src/repositories/audioRecordingRepository';
import type { InterviewMessageRepository } from '../../src/repositories/interviewMessageRepository';
import type { InterviewSessionRepository } from '../../src/repositories/interviewSessionRepository';
import { createConversationService } from '../../src/services/conversationService';

const sessionId = new ObjectId();

function sessionDocument(status: 'consent_pending' | 'in_progress' | 'declined') {
  return {
    _id: sessionId,
    jobId: new ObjectId(),
    status,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function sessionRepository(status: 'consent_pending' | 'in_progress' | 'declined' | 'missing' = 'in_progress') {
  return {
    findResumableByJobId: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(status === 'missing' ? null : sessionDocument(status)),
    create: jest.fn(),
    recordConsent: jest.fn(),
  } satisfies InterviewSessionRepository;
}

function messageRepository(overrides: Partial<InterviewMessageRepository> = {}): InterviewMessageRepository {
  return {
    listBySessionId: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    nextSequence: jest.fn().mockResolvedValue(1),
    append: jest.fn().mockImplementation(async (message) => ({
      _id: new ObjectId(),
      ...message,
      sequence: 1,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
    seedOpeningIfEmpty: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function audioRepository(overrides: Partial<AudioRecordingRepository> = {}): AudioRecordingRepository {
  return {
    store: jest.fn().mockImplementation(async (input) => ({
      _id: new ObjectId(),
      sessionId: new ObjectId(input.sessionId),
      data: new Binary(input.data),
      contentType: input.contentType,
      durationMs: input.durationMs,
      byteLength: input.data.byteLength,
      createdAt: new Date(),
    })),
    findById: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('conversationService', () => {
  describe('getConversation', () => {
    it('returns messages mapped to views in order', async () => {
      const message: InterviewMessageDocument = {
        _id: new ObjectId(),
        sessionId,
        author: 'agent',
        kind: 'text',
        text: 'Hello',
        sequence: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      const service = createConversationService(
        sessionRepository(),
        messageRepository({ listBySessionId: jest.fn().mockResolvedValue([message]) }),
        audioRepository(),
      );

      const result = await service.getConversation(sessionId.toHexString());

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ author: 'agent', kind: 'text', text: 'Hello', sequence: 1 });
    });

    it('rejects an unknown session with 404', async () => {
      const service = createConversationService(
        sessionRepository('missing'),
        messageRepository(),
        audioRepository(),
      );

      await expect(service.getConversation(sessionId.toHexString())).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('seedOpening', () => {
    it('seeds the opening when the interview is in progress', async () => {
      const messages = messageRepository();
      const service = createConversationService(sessionRepository('in_progress'), messages, audioRepository());

      await service.seedOpening(sessionId.toHexString());

      expect(messages.seedOpeningIfEmpty).toHaveBeenCalledWith(sessionId.toHexString());
    });

    it('rejects seeding before consent with 409', async () => {
      const messages = messageRepository();
      const service = createConversationService(sessionRepository('consent_pending'), messages, audioRepository());

      await expect(service.seedOpening(sessionId.toHexString())).rejects.toMatchObject({ status: 409 });
      expect(messages.seedOpeningIfEmpty).not.toHaveBeenCalled();
    });
  });

  describe('addAudioReply', () => {
    const audio = Buffer.from([1, 2, 3, 4]);

    it('stores the recording and appends a candidate audio message', async () => {
      const messages = messageRepository();
      const audioRepo = audioRepository();
      const service = createConversationService(sessionRepository('in_progress'), messages, audioRepo);

      const view = await service.addAudioReply(sessionId.toHexString(), {
        data: audio,
        contentType: 'audio/webm;codecs=opus',
        durationMs: 1500,
      });

      expect(view.author).toBe('candidate');
      expect(view.kind).toBe('audio');
      expect(view.audio).toEqual({ contentType: 'audio/webm', durationMs: 1500, byteLength: 4 });
      expect(audioRepo.store).toHaveBeenCalledWith({
        sessionId: sessionId.toHexString(),
        data: audio,
        contentType: 'audio/webm',
        durationMs: 1500,
      });
      expect(messages.append).toHaveBeenCalledTimes(1);
    });

    it('rejects before consent with 409', async () => {
      const service = createConversationService(
        sessionRepository('consent_pending'),
        messageRepository(),
        audioRepository(),
      );

      await expect(
        service.addAudioReply(sessionId.toHexString(), { data: audio, contentType: 'audio/webm', durationMs: 1 }),
      ).rejects.toMatchObject({ status: 409 });
    });

    it('rejects an unsupported content type with 415', async () => {
      const service = createConversationService(sessionRepository(), messageRepository(), audioRepository());

      await expect(
        service.addAudioReply(sessionId.toHexString(), { data: audio, contentType: 'image/png', durationMs: 1 }),
      ).rejects.toMatchObject({ status: 415 });
    });

    it('rejects empty audio with 400', async () => {
      const service = createConversationService(sessionRepository(), messageRepository(), audioRepository());

      await expect(
        service.addAudioReply(sessionId.toHexString(), {
          data: Buffer.alloc(0),
          contentType: 'audio/webm',
          durationMs: 1,
        }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('rejects audio over the size limit with 413', async () => {
      const service = createConversationService(sessionRepository(), messageRepository(), audioRepository());

      await expect(
        service.addAudioReply(sessionId.toHexString(), {
          data: Buffer.alloc(MAX_AUDIO_BYTES + 1),
          contentType: 'audio/webm',
          durationMs: 1,
        }),
      ).rejects.toMatchObject({ status: 413 });
    });

    it('rejects an invalid duration with 400', async () => {
      const service = createConversationService(sessionRepository(), messageRepository(), audioRepository());

      await expect(
        service.addAudioReply(sessionId.toHexString(), {
          data: audio,
          contentType: 'audio/webm',
          durationMs: Number.NaN,
        }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('getAudio', () => {
    it('returns the stored bytes for an audio message', async () => {
      const message: InterviewMessageDocument = {
        _id: new ObjectId(),
        sessionId,
        author: 'candidate',
        kind: 'audio',
        audio: { recordingId: new ObjectId(), contentType: 'audio/webm', durationMs: 1, byteLength: 4 },
        sequence: 4,
        createdAt: new Date(),
      };
      const recording = {
        _id: message.audio!.recordingId,
        sessionId,
        data: new Binary(Buffer.from([9, 8, 7])),
        contentType: 'audio/webm',
        durationMs: 1,
        byteLength: 3,
        createdAt: new Date(),
      };
      const service = createConversationService(
        sessionRepository(),
        messageRepository({ findById: jest.fn().mockResolvedValue(message) }),
        audioRepository({ findById: jest.fn().mockResolvedValue(recording) }),
      );

      const result = await service.getAudio(sessionId.toHexString(), message._id.toHexString());

      expect(result.contentType).toBe('audio/webm');
      expect(Buffer.from(result.data)).toEqual(Buffer.from([9, 8, 7]));
    });

    it('rejects a missing recording with 404', async () => {
      const service = createConversationService(sessionRepository(), messageRepository(), audioRepository());

      await expect(
        service.getAudio(sessionId.toHexString(), new ObjectId().toHexString()),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
