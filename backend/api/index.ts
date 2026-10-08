import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { connectToMongo, type MongoConnection } from '../src/db/mongo';
import { createAudioRecordingRepository } from '../src/repositories/audioRecordingRepository';
import { createInterviewMessageRepository } from '../src/repositories/interviewMessageRepository';
import { createInterviewSessionRepository } from '../src/repositories/interviewSessionRepository';
import { createJobRepository } from '../src/repositories/jobRepository';
import {
  createConversationService,
  type AddAudioReplyInput,
  type ConversationService,
} from '../src/services/conversationService';
import { createInterviewService, type InterviewService } from '../src/services/interviewService';
import { createJobService, type JobService } from '../src/services/jobService';

let connectionPromise: Promise<MongoConnection> | undefined;

function getConnection(): Promise<MongoConnection> {
  if (!connectionPromise) {
    const { mongoUrl, mongoDb } = loadConfig();
    connectionPromise = connectToMongo(mongoUrl, mongoDb);
  }
  return connectionPromise;
}

const jobService: JobService = {
  async listAvailableJobs() {
    const connection = await getConnection();
    return createJobService(createJobRepository(connection.db)).listAvailableJobs();
  },
};

const interviewService: InterviewService = {
  async startOrResume(jobId: string) {
    const connection = await getConnection();
    return createInterviewService(
      createJobRepository(connection.db),
      createInterviewSessionRepository(connection.db),
    ).startOrResume(jobId);
  },
  async getById(id: string) {
    const connection = await getConnection();
    return createInterviewService(
      createJobRepository(connection.db),
      createInterviewSessionRepository(connection.db),
    ).getById(id);
  },
  async recordConsent(id: string, decision: unknown) {
    const connection = await getConnection();
    return createInterviewService(
      createJobRepository(connection.db),
      createInterviewSessionRepository(connection.db),
    ).recordConsent(id, decision);
  },
};

const conversationService: ConversationService = {
  async getConversation(sessionId: string) {
    const connection = await getConnection();
    return createConversationService(
      createInterviewSessionRepository(connection.db),
      createInterviewMessageRepository(connection.db),
      createAudioRecordingRepository(connection.db),
    ).getConversation(sessionId);
  },
  async seedOpening(sessionId: string) {
    const connection = await getConnection();
    await createConversationService(
      createInterviewSessionRepository(connection.db),
      createInterviewMessageRepository(connection.db),
      createAudioRecordingRepository(connection.db),
    ).seedOpening(sessionId);
  },
  async addAudioReply(sessionId: string, input: AddAudioReplyInput) {
    const connection = await getConnection();
    return createConversationService(
      createInterviewSessionRepository(connection.db),
      createInterviewMessageRepository(connection.db),
      createAudioRecordingRepository(connection.db),
    ).addAudioReply(sessionId, input);
  },
  async getAudio(sessionId: string, messageId: string) {
    const connection = await getConnection();
    return createConversationService(
      createInterviewSessionRepository(connection.db),
      createInterviewMessageRepository(connection.db),
      createAudioRecordingRepository(connection.db),
    ).getAudio(sessionId, messageId);
  },
};

const { corsOrigin } = loadConfig();
const app = createApp({ jobService, interviewService, conversationService, corsOrigin });

export default app;
