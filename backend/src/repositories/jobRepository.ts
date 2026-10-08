import type { Db } from 'mongodb';
import { toJobSummary, type JobDocument, type JobSummary } from '../models/job';

export interface JobRepository {
  findAvailableJobs(): Promise<JobSummary[]>;
}

export function createJobRepository(db: Db): JobRepository {
  const collection = db.collection<JobDocument>('jobs');

  return {
    async findAvailableJobs(): Promise<JobSummary[]> {
      const documents = await collection
        .find({ status: 'available' })
        .sort({ createdAt: -1 })
        .toArray();

      return documents.map((document) => toJobSummary(document));
    },
  };
}
