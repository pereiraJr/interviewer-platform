import { HttpError } from '../middleware/errorHandler';
import {
  isConsentDecision,
  RECORDING_NOTICE,
  toInterviewSessionView,
  type InterviewSessionDocument,
  type InterviewSessionView,
} from '../models/interviewSession';
import type { InterviewSessionRepository } from '../repositories/interviewSessionRepository';
import type { JobRepository } from '../repositories/jobRepository';

export interface InterviewService {
  startOrResume(jobId: string): Promise<InterviewSessionView>;
  getById(id: string): Promise<InterviewSessionView>;
  recordConsent(id: string, decision: unknown): Promise<InterviewSessionView>;
}

export function createInterviewService(
  jobRepository: JobRepository,
  sessionRepository: InterviewSessionRepository,
): InterviewService {
  async function withJobContext(
    session: InterviewSessionDocument,
  ): Promise<InterviewSessionView> {
    const job = await jobRepository.findAvailableJobById(session.jobId.toHexString());
    if (!job) {
      throw new HttpError(404, 'JOB_NOT_FOUND', 'Job not found');
    }
    return toInterviewSessionView(session, job);
  }

  return {
    async startOrResume(jobId: string): Promise<InterviewSessionView> {
      const job = await jobRepository.findAvailableJobById(jobId);
      if (!job) {
        throw new HttpError(404, 'JOB_NOT_FOUND', 'Job not found');
      }

      const existing = await sessionRepository.findResumableByJobId(jobId);
      const session = existing ?? (await sessionRepository.create(jobId));

      return toInterviewSessionView(session, job);
    },

    async getById(id: string): Promise<InterviewSessionView> {
      const session = await sessionRepository.findById(id);
      if (!session) {
        throw new HttpError(404, 'SESSION_NOT_FOUND', 'Interview session not found');
      }

      return withJobContext(session);
    },

    async recordConsent(id: string, decision: unknown): Promise<InterviewSessionView> {
      if (!isConsentDecision(decision)) {
        throw new HttpError(400, 'INVALID_DECISION', 'Invalid consent decision');
      }

      const session = await sessionRepository.recordConsent(
        id,
        decision,
        RECORDING_NOTICE.version,
      );
      if (!session) {
        throw new HttpError(404, 'SESSION_NOT_FOUND', 'Interview session not found');
      }

      return withJobContext(session);
    },
  };
}
