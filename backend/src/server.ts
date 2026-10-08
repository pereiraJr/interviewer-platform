import { createApp } from './app';
import { loadConfig } from './config';
import { closeMongo, connectToMongo } from './db/mongo';
import { createJobRepository } from './repositories/jobRepository';
import { createJobService } from './services/jobService';

async function main(): Promise<void> {
  const config = loadConfig();
  const connection = await connectToMongo(config.mongoUrl, config.mongoDb);
  const jobService = createJobService(createJobRepository(connection.db));
  const app = createApp({ jobService, corsOrigin: config.corsOrigin });

  const server = app.listen(config.port, () => {
    console.log(`[server] listening on http://localhost:${config.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[server] received ${signal}, shutting down`);
    server.close();
    await closeMongo(connection);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
