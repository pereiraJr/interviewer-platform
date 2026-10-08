import { execSync } from 'node:child_process';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { ObjectId } from 'mongodb';
import type { StartedTestContainer } from 'testcontainers';
import { createApp } from '../../src/app';
import { closeMongo, connectToMongo, type MongoConnection } from '../../src/db/mongo';
import type { JobDocument } from '../../src/models/job';
import { createJobRepository } from '../../src/repositories/jobRepository';
import { createJobService } from '../../src/services/jobService';
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

describeWithDocker('GET /api/jobs (integration, testcontainers)', () => {
  let container: StartedTestContainer;
  let connection: MongoConnection;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const harness = await startMongo();
    container = harness.container;
    connection = await connectToMongo(harness.url, 'afterquery_test');

    const now = new Date();
    await connection.db.collection<JobDocument>('jobs').insertMany([
      {
        _id: new ObjectId(),
        title: 'Senior Backend Engineer',
        description: 'Design and scale our interview APIs.',
        status: 'available',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(),
        title: 'Closed Role',
        description: 'No longer accepting applications.',
        status: 'closed',
        createdAt: now,
        updatedAt: now,
      },
    ]);

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

  it('returns only available jobs in the documented envelope', async () => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { jobs: Array<Record<string, unknown>> };
    expect(body.jobs).toHaveLength(1);
    expect(body.jobs[0]).toEqual({
      id: expect.any(String),
      title: 'Senior Backend Engineer',
      description: 'Design and scale our interview APIs.',
    });
  });

  it('returns an empty array when no available jobs exist', async () => {
    await connection.db
      .collection<JobDocument>('jobs')
      .updateMany({}, { $set: { status: 'closed' } });

    const response = await fetch(`${baseUrl}/api/jobs`);
    const body = (await response.json()) as { jobs: unknown[] };

    expect(response.status).toBe(200);
    expect(body.jobs).toEqual([]);
  });
});
