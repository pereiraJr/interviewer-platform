import type { JobSummary } from '../../src/models/job';
import type { JobRepository } from '../../src/repositories/jobRepository';
import { createJobService } from '../../src/services/jobService';

describe('jobService.listAvailableJobs', () => {
  it('delegates to the repository and returns its result', async () => {
    const jobs: JobSummary[] = [{ id: '1', title: 'Engineer', description: 'Build things' }];
    const repository: JobRepository = {
      findAvailableJobs: jest.fn().mockResolvedValue(jobs),
    };

    const service = createJobService(repository);

    await expect(service.listAvailableJobs()).resolves.toEqual(jobs);
    expect(repository.findAvailableJobs).toHaveBeenCalledTimes(1);
  });

  it('propagates repository errors', async () => {
    const repository: JobRepository = {
      findAvailableJobs: jest.fn().mockRejectedValue(new Error('db down')),
    };

    const service = createJobService(repository);

    await expect(service.listAvailableJobs()).rejects.toThrow('db down');
  });
});
