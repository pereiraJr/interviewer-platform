import { execSync } from 'node:child_process';
import { ObjectId } from 'mongodb';
import type { StartedTestContainer } from 'testcontainers';
import { closeMongo, connectToMongo, type MongoConnection } from '../../src/db/mongo';
import type { JobDocument } from '../../src/models/job';
import { sampleJobs, seedSampleJobs } from '../../src/seedData';
import { startMongo } from './mongoContainer';

function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const describeWithDocker = isDockerAvailable() ? describe : describe.skip;

describeWithDocker('seed idempotency (integration, testcontainers)', () => {
  let container: StartedTestContainer;
  let connection: MongoConnection;

  beforeAll(async () => {
    const harness = await startMongo();
    container = harness.container;
    connection = await connectToMongo(harness.url, 'afterquery_seed_idempotency_test');
  }, 180000);

  afterAll(async () => {
    if (connection) {
      await closeMongo(connection);
    }
    if (container) {
      await container.stop();
    }
  });

  it('converges to the same catalogue with no duplicates after repeated runs', async () => {
    const collection = connection.db.collection<JobDocument>('jobs');

    await seedSampleJobs(connection.db);
    const first = await collection.find({}).sort({ title: 1 }).toArray();

    await seedSampleJobs(connection.db);
    const second = await collection.find({}).sort({ title: 1 }).toArray();

    expect(second).toHaveLength(first.length);
    expect(second).toHaveLength(sampleJobs.length);

    const titles = second.map((document) => document.title);
    expect(new Set(titles).size).toBe(titles.length);
    expect([...titles].sort()).toEqual([...sampleJobs.map((job) => job.title)].sort());
  });

  it('recovers from a partial/interrupted run on the next run', async () => {
    const collection = connection.db.collection<JobDocument>('jobs');
    const now = new Date();

    await collection.deleteMany({});
    await collection.insertMany([
      {
        _id: new ObjectId(),
        title: 'Partial Role',
        description: 'Left behind by an interrupted run.',
        status: 'available',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await seedSampleJobs(connection.db);

    expect(await collection.countDocuments()).toBe(sampleJobs.length);
    expect(await collection.countDocuments({ title: 'Partial Role' })).toBe(0);
  });
});
