import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobsGrid } from '../components/JobsGrid';
import { fetchJobs } from '../services/jobsApi';
import type { Job } from '../types/job';
import './JobsDashboard.css';

type Status = 'loading' | 'success' | 'error';

export function JobsDashboard() {
  const [status, setStatus] = useState<Status>('loading');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [attempt, setAttempt] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setStatus('loading');

    fetchJobs()
      .then((result) => {
        if (!active) {
          return;
        }
        setJobs(result);
        setStatus('success');
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const handleSelect = useCallback(
    (job: Job) => {
      navigate(`/jobs/${job.id}`);
    },
    [navigate],
  );

  if (status === 'loading') {
    return <p role="status">Loading jobs…</p>;
  }

  if (status === 'error') {
    return (
      <div role="alert" className="jobs-dashboard__error">
        <p>We couldn&apos;t load the jobs right now.</p>
        <button type="button" onClick={retry}>
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <p className="jobs-dashboard__empty">No jobs are available right now.</p>;
  }

  return (
    <section className="jobs-dashboard">
      <h1 className="jobs-dashboard__title">Available jobs</h1>
      <JobsGrid jobs={jobs} onSelect={handleSelect} />
    </section>
  );
}
