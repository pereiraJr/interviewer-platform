import { ObjectId, type Db } from 'mongodb';
import { toJobSummary, type JobDocument, type JobSummary } from '../models/job';

export interface JobRepository {
  findAvailableJobs(): Promise<JobSummary[]>;
  findAvailableJobById(id: string): Promise<JobSummary | null>;
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

    async findAvailableJobById(id: string): Promise<JobSummary | null> {
      if (!ObjectId.isValid(id)) {
        return null;
      }

      const document = await collection.findOne({
        _id: new ObjectId(id),
        status: 'available',
      });

      return document ? toJobSummary(document) : null;
    },
  };
}
