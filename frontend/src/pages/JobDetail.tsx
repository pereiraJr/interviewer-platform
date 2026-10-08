import { useParams } from 'react-router-dom';
import './JobDetail.css';

export function JobDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="job-detail">
      <h2>Job details</h2>
      <p>Job ID: {id}</p>
    </section>
  );
}
