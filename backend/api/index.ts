import { createApp } from '../src/app';
import { loadConfig } from '../src/config';
import { connectToMongo, type MongoConnection } from '../src/db/mongo';
import { createJobRepository } from '../src/repositories/jobRepository';
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

const { corsOrigin } = loadConfig();
const app = createApp({ jobService, corsOrigin });

export default app;
