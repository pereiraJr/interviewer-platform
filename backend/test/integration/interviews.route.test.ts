import { execSync } from 'node:child_process';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { ObjectId } from 'mongodb';
import type { StartedTestContainer } from 'testcontainers';
import { createApp } from '../../src/app';
import { closeMongo, connectToMongo, type MongoConnection } from '../../src/db/mongo';
import type { JobDocument } from '../../src/models/job';
import { createInterviewSessionRepository } from '../../src/repositories/interviewSessionRepository';
import { createJobRepository } from '../../src/repositories/jobRepository';
import { createInterviewService } from '../../src/services/interviewService';
import { createJobService } from '../../src/services/jobService';
import { startMongo } from './mongoContainer';

type SessionBody = {
  id: string;
  status: string;
  job: { id: string; title: string; description: string };
  consent: { decision: string; decidedAt: string; noticeVersion: string } | null;
  notice: { text: string; version: string };
};

function isDockerAvailable(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const describeWithDocker = isDockerAvailable() ? describe : describe.skip;

describeWithDocker('Interview Room API (integration, testcontainers)', () => {
  let container: StartedTestContainer;
  let connection: MongoConnection;
  let server: Server;
  let baseUrl: string;
  const jobId = new ObjectId().toHexString();

  beforeAll(async () => {
    const harness = await startMongo();
    container = harness.container;
    connection = await connectToMongo(harness.url, 'afterquery_interview_test');

    const now = new Date();
    await connection.db.collection<JobDocument>('jobs').insertOne({
      _id: new ObjectId(jobId),
      title: 'Backend Engineer',
      description: 'Build the interview APIs',
      status: 'available',
      createdAt: now,
      updatedAt: now,
    });

    const jobRepository = createJobRepository(connection.db);
    const app = createApp({
      jobService: createJobService(jobRepository),
      interviewService: createInterviewService(
        jobRepository,
        createInterviewSessionRepository(connection.db),
      ),
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

  async function enterRoom(id = jobId): Promise<Response> {
    return fetch(`${baseUrl}/api/jobs/${id}/interview`, { method: 'POST' });
  }

  it('starts a pre-consent session with role context and the recording notice', async () => {
    const response = await enterRoom();
    expect(response.status).toBe(200);

    const body = (await response.json()) as SessionBody;
    expect(body.status).toBe('consent_pending');
    expect(body.job).toEqual({
      id: jobId,
      title: 'Backend Engineer',
      description: 'Build the interview APIs',
    });
    expect(body.consent).toBeNull();
    expect(body.notice.text).toMatch(/recorded/i);
  });

  it('resumes the same session when entering the room again', async () => {
    const first = (await (await enterRoom()).json()) as SessionBody;
    const second = (await (await enterRoom()).json()) as SessionBody;
    expect(second.id).toBe(first.id);
  });

  it('returns 404 when entering the room for an unknown job', async () => {
    const response = await enterRoom(new ObjectId().toHexString());
    expect(response.status).toBe(404);
  });

  it('retrieves a session by id and 404s for unknown sessions', async () => {
    const session = (await (await enterRoom()).json()) as SessionBody;

    const found = await fetch(`${baseUrl}/api/interviews/${session.id}`);
    expect(found.status).toBe(200);

    const missing = await fetch(`${baseUrl}/api/interviews/${new ObjectId().toHexString()}`);
    expect(missing.status).toBe(404);
  });

  it('moves to in_progress when consent is accepted and records the decision', async () => {
    const session = (await (await enterRoom()).json()) as SessionBody;

    const response = await fetch(`${baseUrl}/api/interviews/${session.id}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accepted' }),
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as SessionBody;
    expect(body.status).toBe('in_progress');
    expect(body.consent?.decision).toBe('accepted');
    expect(body.consent?.noticeVersion).toBe('1');
  });

  it('stays not-in-progress when consent is declined', async () => {
    const session = (await (await enterRoom()).json()) as SessionBody;

    const response = await fetch(`${baseUrl}/api/interviews/${session.id}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'declined' }),
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as SessionBody;
    expect(body.status).toBe('declined');
    expect(body.consent?.decision).toBe('declined');
  });

  it('rejects an invalid consent decision with 400', async () => {
    const session = (await (await enterRoom()).json()) as SessionBody;

    const response = await fetch(`${baseUrl}/api/interviews/${session.id}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'maybe' }),
    });
    expect(response.status).toBe(400);
  });

  it('rejects consent for an unknown session with 404', async () => {
    const response = await fetch(
      `${baseUrl}/api/interviews/${new ObjectId().toHexString()}/consent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'accepted' }),
      },
    );
    expect(response.status).toBe(404);
  });
});
