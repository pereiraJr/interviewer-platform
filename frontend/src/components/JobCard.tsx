import type { Job } from '../types/job';
import './JobCard.css';

export interface JobCardProps {
  job: Job;
  onSelect?: (job: Job) => void;
}

export function JobCard({ job, onSelect }: JobCardProps) {
  return (
    <article className="job-card">
      <h3 className="job-card__title">{job.title}</h3>
      <p className="job-card__description">{job.description}</p>
      {onSelect ? (
        <button
          type="button"
          className="job-card__action"
          aria-label={`View ${job.title}`}
          onClick={() => onSelect(job)}
        >
          View job
        </button>
      ) : null}
    </article>
  );
}
