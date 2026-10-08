import { closeMongo, connectToMongo } from './db/mongo';
import { loadConfig } from './config';
import type { JobDocument } from './models/job';

type NewJob = Omit<JobDocument, '_id' | 'createdAt' | 'updatedAt'>;

const sampleJobs: NewJob[] = [
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

async function main(): Promise<void> {
  const config = loadConfig();
  const connection = await connectToMongo(config.mongoUrl, config.mongoDb);
  const collection = connection.db.collection<JobDocument>('jobs');

  await collection.deleteMany({});
  const now = new Date();
  const documents = sampleJobs.map((job) => ({ ...job, createdAt: now, updatedAt: now }));
  await collection.insertMany(documents as JobDocument[]);

  console.log(`[seed] inserted ${documents.length} jobs into ${config.mongoDb}`);
  await closeMongo(connection);
}

void main().catch((error) => {
  console.error('[seed] failed', error);
  process.exit(1);
});
