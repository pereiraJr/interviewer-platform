import { ObjectId, type Db } from 'mongodb';
import type {
  ConsentDecision,
  InterviewSessionDocument,
  InterviewStatus,
} from '../models/interviewSession';

const RESUMABLE_STATUSES: readonly InterviewStatus[] = ['consent_pending', 'in_progress'];

export interface InterviewSessionRepository {
  findResumableByJobId(jobId: string): Promise<InterviewSessionDocument | null>;
  findById(id: string): Promise<InterviewSessionDocument | null>;
  create(jobId: string): Promise<InterviewSessionDocument>;
  recordConsent(
    id: string,
    decision: ConsentDecision,
    noticeVersion: string,
  ): Promise<InterviewSessionDocument | null>;
}

export function createInterviewSessionRepository(db: Db): InterviewSessionRepository {
  const collection = db.collection<InterviewSessionDocument>('interviewSessions');

  return {
    async findResumableByJobId(jobId: string): Promise<InterviewSessionDocument | null> {
      if (!ObjectId.isValid(jobId)) {
        return null;
      }

      return collection.findOne(
        { jobId: new ObjectId(jobId), status: { $in: [...RESUMABLE_STATUSES] } },
        { sort: { createdAt: -1 } },
      );
    },

    async findById(id: string): Promise<InterviewSessionDocument | null> {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      return collection.findOne({ _id: new ObjectId(id) });
    },

    async create(jobId: string): Promise<InterviewSessionDocument> {
      const now = new Date();
      const document: InterviewSessionDocument = {
        _id: new ObjectId(),
        jobId: new ObjectId(jobId),
        status: 'consent_pending',
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(document);
      return document;
    },

    async recordConsent(
      id: string,
      decision: ConsentDecision,
      noticeVersion: string,
    ): Promise<InterviewSessionDocument | null> {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const now = new Date();
      const status: InterviewStatus = decision === 'accepted' ? 'in_progress' : 'declined';

      return collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            consent: { decision, decidedAt: now, noticeVersion },
            updatedAt: now,
          },
        },
        { returnDocument: 'after' },
      );
    },
  };
}
