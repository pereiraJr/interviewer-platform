import { MongoClient, type Db } from 'mongodb';

export interface MongoConnection {
  client: MongoClient;
  db: Db;
}

export async function connectToMongo(url: string, dbName?: string): Promise<MongoConnection> {
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  return { client, db: dbName ? client.db(dbName) : client.db() };
}

export async function closeMongo(connection: MongoConnection): Promise<void> {
  await connection.client.close();
}
