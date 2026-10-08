import { ObjectId } from 'mongodb';
import type { InterviewSessionDocument } from '../../src/models/interviewSession';
import type { InterviewSessionRepository } from '../../src/repositories/interviewSessionRepository';
import type { JobRepository } from '../../src/repositories/jobRepository';
import { createInterviewService } from '../../src/services/interviewService';

const jobId = new ObjectId();
const jobSummary = { id: jobId.toHexString(), title: 'Backend Engineer', description: 'Build APIs' };

function sessionDocument(overrides: Partial<InterviewSessionDocument> = {}): InterviewSessionDocument {
  return {
    _id: new ObjectId(),
    jobId,
    status: 'consent_pending',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function jobRepository(found: typeof jobSummary | null = jobSummary): JobRepository {
  return {
    findAvailableJobs: jest.fn().mockResolvedValue([]),
    findAvailableJobById: jest.fn().mockResolvedValue(found),
  };
}

function sessionRepository(
  overrides: Partial<InterviewSessionRepository> = {},
): InterviewSessionRepository {
  return {
    findResumableByJobId: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(sessionDocument()),
    recordConsent: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('interviewService', () => {
  describe('startOrResume', () => {
    it('creates a pre-consent session with role context and the recording notice', async () => {
      const created = sessionDocument();
      const sessions = sessionRepository({ create: jest.fn().mockResolvedValue(created) });
      const service = createInterviewService(jobRepository(), sessions);

      const view = await service.startOrResume(jobId.toHexString());

      expect(view.id).toBe(created._id.toHexString());
      expect(view.status).toBe('consent_pending');
      expect(view.job).toEqual(jobSummary);
      expect(view.consent).toBeNull();
      expect(view.notice.text).toMatch(/recorded/i);
      expect(sessions.create).toHaveBeenCalledWith(jobId.toHexString());
    });

    it('resumes an existing resumable session instead of creating a new one', async () => {
      const existing = sessionDocument({ status: 'in_progress' });
      const sessions = sessionRepository({
        findResumableByJobId: jest.fn().mockResolvedValue(existing),
      });
      const service = createInterviewService(jobRepository(), sessions);

      const view = await service.startOrResume(jobId.toHexString());

      expect(view.id).toBe(existing._id.toHexString());
      expect(view.status).toBe('in_progress');
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown or unavailable job with 404', async () => {
      const service = createInterviewService(jobRepository(null), sessionRepository());

      await expect(service.startOrResume(jobId.toHexString())).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('getById', () => {
    it('returns the session with its role context', async () => {
      const existing = sessionDocument();
      const service = createInterviewService(
        jobRepository(),
        sessionRepository({ findById: jest.fn().mockResolvedValue(existing) }),
      );

      const view = await service.getById(existing._id.toHexString());

      expect(view.id).toBe(existing._id.toHexString());
      expect(view.job).toEqual(jobSummary);
    });

    it('rejects an unknown session with 404', async () => {
      const service = createInterviewService(jobRepository(), sessionRepository());

      await expect(service.getById(new ObjectId().toHexString())).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe('recordConsent', () => {
    it('moves an accepted session to in_progress and records the decision', async () => {
      const decidedAt = new Date('2026-01-02T00:00:00.000Z');
      const accepted = sessionDocument({
        status: 'in_progress',
        consent: { decision: 'accepted', decidedAt, noticeVersion: '1' },
      });
      const sessions = sessionRepository({
        recordConsent: jest.fn().mockResolvedValue(accepted),
      });
      const service = createInterviewService(jobRepository(), sessions);

      const view = await service.recordConsent(accepted._id.toHexString(), 'accepted');

      expect(view.status).toBe('in_progress');
      expect(view.consent).toEqual({
        decision: 'accepted',
        decidedAt: decidedAt.toISOString(),
        noticeVersion: '1',
      });
    });

    it('leaves a declined session not in progress', async () => {
      const declined = sessionDocument({
        status: 'declined',
        consent: { decision: 'declined', decidedAt: new Date(), noticeVersion: '1' },
      });
      const service = createInterviewService(
        jobRepository(),
        sessionRepository({ recordConsent: jest.fn().mockResolvedValue(declined) }),
      );

      const view = await service.recordConsent(declined._id.toHexString(), 'declined');

      expect(view.status).toBe('declined');
      expect(view.consent?.decision).toBe('declined');
    });

    it('rejects an invalid decision with 400 before touching the repository', async () => {
      const sessions = sessionRepository();
      const service = createInterviewService(jobRepository(), sessions);

      await expect(
        service.recordConsent(new ObjectId().toHexString(), 'maybe'),
      ).rejects.toMatchObject({ status: 400 });
      expect(sessions.recordConsent).not.toHaveBeenCalled();
    });

    it('rejects an unknown session with 404', async () => {
      const service = createInterviewService(jobRepository(), sessionRepository());

      await expect(
        service.recordConsent(new ObjectId().toHexString(), 'accepted'),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
