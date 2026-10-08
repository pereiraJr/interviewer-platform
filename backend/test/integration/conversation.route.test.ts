import { execSync } from 'node:child_process';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { ObjectId } from 'mongodb';
import type { StartedTestContainer } from 'testcontainers';
import { createApp } from '../../src/app';
import { closeMongo, connectToMongo, type MongoConnection } from '../../src/db/mongo';
import { MAX_AUDIO_BYTES } from '../../src/models/interviewMessage';
import type { JobDocument } from '../../src/models/job';
import { createAudioRecordingRepository } from '../../src/repositories/audioRecordingRepository';
import { createInterviewMessageRepository } from '../../src/repositories/interviewMessageRepository';
import { createInterviewSessionRepository } from '../../src/repositories/interviewSessionRepository';
import { createJobRepository } from '../../src/repositories/jobRepository';
import { createConversationService } from '../../src/services/conversationService';
import { createInterviewService } from '../../src/services/interviewService';
import { createJobService } from '../../src/services/jobService';
import { startMongo } from './mongoContainer';

type SessionBody = { id: string; status: string };
type MessageBody = {
  id: string;
  author: string;
  kind: string;
  text?: string;
  audio?: { contentType: string; durationMs: number; byteLength: number };
  sequence: number;
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

describeWithDocker('Interview Conversation API (integration, testcontainers)', () => {
  let container: StartedTestContainer;
  let connection: MongoConnection;
  let server: Server;
  let baseUrl: string;
  const jobId = new ObjectId().toHexString();
  const secondJobId = new ObjectId().toHexString();

  beforeAll(async () => {
    const harness = await startMongo();
    container = harness.container;
    connection = await connectToMongo(harness.url, 'afterquery_conversation_test');

    const now = new Date();
    await connection.db.collection<JobDocument>('jobs').insertMany([
      {
        _id: new ObjectId(jobId),
        title: 'Backend Engineer',
        description: 'Build the interview APIs',
        status: 'available',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: new ObjectId(secondJobId),
        title: 'Designer',
        description: 'Design the experience',
        status: 'available',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const jobRepository = createJobRepository(connection.db);
    const app = createApp({
      jobService: createJobService(jobRepository),
      interviewService: createInterviewService(
        jobRepository,
        createInterviewSessionRepository(connection.db),
      ),
      conversationService: createConversationService(
        createInterviewSessionRepository(connection.db),
        createInterviewMessageRepository(connection.db),
        createAudioRecordingRepository(connection.db),
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

  async function enterRoom(job = jobId): Promise<SessionBody> {
    const response = await fetch(`${baseUrl}/api/jobs/${job}/interview`, { method: 'POST' });
    return (await response.json()) as SessionBody;
  }

  async function acceptConsent(sessionId: string): Promise<SessionBody> {
    const response = await fetch(`${baseUrl}/api/interviews/${sessionId}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'accepted' }),
    });
    return (await response.json()) as SessionBody;
  }

  async function listMessages(sessionId: string): Promise<MessageBody[]> {
    const response = await fetch(`${baseUrl}/api/interviews/${sessionId}/messages`);
    const body = (await response.json()) as { messages: MessageBody[] };
    return body.messages;
  }

  it('has no messages before consent and rejects recording with 409', async () => {
    const session = await enterRoom();

    expect(await listMessages(session.id)).toEqual([]);

    const response = await fetch(`${baseUrl}/api/interviews/${session.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/webm', 'x-audio-duration-ms': '1000' },
      body: Buffer.from([1, 2, 3]),
    });
    expect(response.status).toBe(409);
  });

  it('seeds the scripted opening in order after consent', async () => {
    const session = await enterRoom();
    await acceptConsent(session.id);

    const messages = await listMessages(session.id);

    expect(messages.map((message) => message.author)).toEqual(['agent', 'agent', 'agent']);
    expect(messages.map((message) => message.sequence)).toEqual([1, 2, 3]);
    expect(messages[0].text).toMatch(/AIfter Agent/);
    expect(messages[1].text).toBe('Lets Get Started:');
    expect(messages[2].text).toBe('Could you give a brief intro about yourself?');
  });

  it('stores a candidate audio reply and streams it back', async () => {
    const session = await enterRoom();
    await acceptConsent(session.id);
    const audio = Buffer.from([10, 20, 30, 40, 50]);

    const upload = await fetch(`${baseUrl}/api/interviews/${session.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/webm', 'x-audio-duration-ms': '1500' },
      body: audio,
    });
    expect(upload.status).toBe(201);

    const message = (await upload.json()) as MessageBody;
    expect(message.author).toBe('candidate');
    expect(message.kind).toBe('audio');
    expect(message.audio).toEqual({ contentType: 'audio/webm', durationMs: 1500, byteLength: audio.length });

    const messages = await listMessages(session.id);
    expect(messages).toHaveLength(4);
    expect(messages[3].id).toBe(message.id);

    const playback = await fetch(
      `${baseUrl}/api/interviews/${session.id}/messages/${message.id}/audio`,
    );
    expect(playback.status).toBe(200);
    expect(playback.headers.get('content-type')).toContain('audio/webm');
    const bytes = Buffer.from(await playback.arrayBuffer());
    expect(bytes).toEqual(audio);
  });

  it('rejects unsupported/empty/oversize audio', async () => {
    const session = await enterRoom();
    await acceptConsent(session.id);

    const unsupported = await fetch(`${baseUrl}/api/interviews/${session.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from([1, 2, 3]),
    });
    expect(unsupported.status).toBe(415);

    const empty = await fetch(`${baseUrl}/api/interviews/${session.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/webm' },
      body: Buffer.alloc(0),
    });
    expect(empty.status).toBe(400);

    const oversize = await fetch(`${baseUrl}/api/interviews/${session.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/webm' },
      body: Buffer.alloc(MAX_AUDIO_BYTES + 1),
    });
    expect(oversize.status).toBe(413);
  });

  it('returns 404 for unknown sessions and messages', async () => {
    const unknown = new ObjectId().toHexString();
    expect((await fetch(`${baseUrl}/api/interviews/${unknown}/messages`)).status).toBe(404);
    expect(
      (
        await fetch(`${baseUrl}/api/interviews/${unknown}/messages/${unknown}/audio`)
      ).status,
    ).toBe(404);
  });
});
