import type { Job } from '../types/job';
import { JobCard } from './JobCard';
import './JobsGrid.css';

export interface JobsGridProps {
  jobs: Job[];
  onSelect?: (job: Job) => void;
}

export function JobsGrid({ jobs, onSelect }: JobsGridProps) {
  return (
    <ul className="jobs-grid" aria-label="Available jobs">
      {jobs.map((job) => (
        <li key={job.id} className="jobs-grid__item">
          <JobCard job={job} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
