import type { Db } from 'mongodb';
import {
  DESCRIPTION_MAX_LENGTH,
  isValidTitle,
  type JobDocument,
  type JobStatus,
} from './models/job';

export type NewJob = Omit<JobDocument, '_id' | 'createdAt' | 'updatedAt'>;

export const sampleJobs: NewJob[] = [
  {
    title: 'Senior Backend Engineer',
    description: 'Design and scale the interview APIs that power the platform.',
    status: 'available',
  },
  {
    title: 'Frontend Engineer',
    description: 'Build clear, accessible candidate experiences in React.',
    status: 'available',
  },
  {
    title: 'Product Designer',
    description: 'Own the end-to-end candidate interview experience.',
    status: 'available',
  },
  {
    title: 'Data Scientist',
    description: 'Turn interview signals into structured, comparable evaluations.',
    status: 'available',
  },
  {
    title: 'Engineering Manager',
    description: 'Grow and support a small cross-functional product team.',
    status: 'available',
  },
  {
    title: 'Legacy Support Analyst',
    description: 'This role is no longer open.',
    status: 'closed',
  },
];

const VALID_STATUSES: readonly JobStatus[] = ['available', 'closed'];

function assertValidDataset(jobs: NewJob[]): void {
  jobs.forEach((job, index) => {
    if (!isValidTitle(job.title)) {
      throw new Error(`Seed job at index ${index} has an invalid title`);
    }
    if (job.description !== undefined && job.description.length > DESCRIPTION_MAX_LENGTH) {
      throw new Error(
        `Seed job at index ${index} has a description longer than ${DESCRIPTION_MAX_LENGTH} characters`,
      );
    }
    if (!VALID_STATUSES.includes(job.status)) {
      throw new Error(`Seed job at index ${index} has an invalid status`);
    }
  });
}

/**
 * Applies the baseline job catalogue to the `jobs` collection.
 *
 * Idempotency/recovery guarantee: the whole dataset is validated before anything is
 * mutated, so an invalid baseline can never clear or partially overwrite the catalogue.
 * A valid run clears the `jobs` collection and rewrites the baseline, so repeated or
 * interrupted runs always converge to exactly the baseline with no duplicates. Only the
 * `jobs` collection is touched; candidate/session data is never affected.
 */
export async function seedSampleJobs(db: Db, jobs: NewJob[] = sampleJobs): Promise<number> {
  assertValidDataset(jobs);

  const collection = db.collection<JobDocument>('jobs');
  const now = new Date();
  const documents = jobs.map((job) => ({ ...job, createdAt: now, updatedAt: now }));

  await collection.deleteMany({});
  if (documents.length > 0) {
    await collection.insertMany(documents as JobDocument[]);
  }

  return documents.length;
}
