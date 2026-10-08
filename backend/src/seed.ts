import { closeMongo, connectToMongo } from './db/mongo';
import { loadConfig } from './config';
import { seedSampleJobs } from './seedData';

async function main(): Promise<void> {
  const config = loadConfig();
  const connection = await connectToMongo(config.mongoUrl, config.mongoDb);
  const inserted = await seedSampleJobs(connection.db);

  console.log(`[seed] inserted ${inserted} jobs into ${config.mongoDb ?? connection.db.databaseName}`);
  await closeMongo(connection);
}

void main().catch((error) => {
  console.error('[seed] failed', error);
  process.exit(1);
});
