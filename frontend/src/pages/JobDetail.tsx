import { useParams } from 'react-router-dom';

export function JobDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <section className="job-detail">
      <h1>Job details</h1>
      <p>Job ID: {id}</p>
    </section>
  );
}
