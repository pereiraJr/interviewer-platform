import type { JobSummary } from '../models/job';
import type { JobRepository } from '../repositories/jobRepository';

export interface JobService {
  listAvailableJobs(): Promise<JobSummary[]>;
}

export function createJobService(repository: JobRepository): JobService {
  return {
    listAvailableJobs: (): Promise<JobSummary[]> => repository.findAvailableJobs(),
  };
}
