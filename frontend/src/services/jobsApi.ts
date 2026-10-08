import { getApiBaseUrl } from '../config';
import type { Job } from '../types/job';

interface JobsResponse {
  jobs: Job[];
}

function isJob(value: unknown): value is Job {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string'
  );
}

export async function fetchJobs(signal?: AbortSignal): Promise<Job[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/jobs`, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load jobs (status ${response.status})`);
  }

  const payload = (await response.json()) as Partial<JobsResponse>;

  if (!payload || !Array.isArray(payload.jobs) || !payload.jobs.every(isJob)) {
    throw new Error('Malformed jobs response');
  }

  return payload.jobs;
}
