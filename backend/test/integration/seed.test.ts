import { execSync } from 'node:child_process';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { StartedTestContainer } from 'testcontainers';
import { createApp } from '../../src/app';
import { closeMongo, connectToMongo, type MongoConnection } from '../../src/db/mongo';
import { createJobRepository } from '../../src/repositories/jobRepository';
import { sampleJobs, seedSampleJobs } from '../../src/seedData';
import { createJobService } from '../../src/services/jobService';
import { startMongo } from './mongoContainer';

const availableCount = sampleJobs.filter((job) => job.status === 'available').length;

function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const describeWithDocker = isDockerAvailable() ? describe : describe.skip;

describeWithDocker('deployment seeding -> GET /api/jobs (integration, testcontainers)', () => {
  let container: StartedTestContainer;
  let connection: MongoConnection;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const harness = await startMongo();
    container = harness.container;
    connection = await connectToMongo(harness.url, 'afterquery_seed_test');

    const app = createApp({
      jobService: createJobService(createJobRepository(connection.db)),
      corsOrigin: '*',
    });
    server = app.listen(0);
    await once(server, 'listening');
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Failed to resolve server address');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  }, 180000);

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (connection) {
      await closeMongo(connection);
    }
    if (container) {
      await container.stop();
    }
  });

  it('populates an empty database and exposes the seeded available jobs', async () => {
    await connection.db.collection('jobs').deleteMany({});

    const inserted = await seedSampleJobs(connection.db);
    expect(inserted).toBe(sampleJobs.length);

    const jobsResponse = await fetch(`${baseUrl}/api/jobs`);
    expect(jobsResponse.status).toBe(200);
    const body = (await jobsResponse.json()) as {
      jobs: Array<{ id: string; title: string; description: string }>;
    };

    expect(body.jobs).toHaveLength(availableCount);
    expect(body.jobs.map((job) => job.title)).not.toContain('Legacy Support Analyst');
    for (const job of body.jobs) {
      expect(typeof job.id).toBe('string');
      expect(job.title.length).toBeGreaterThan(0);
      expect(typeof job.description).toBe('string');
    }
  });

  it('does not expose a public seeding endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/seed`, { method: 'POST' });
    expect(response.status).toBe(404);
  });
});
