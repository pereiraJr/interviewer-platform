export interface AppConfig {
  port: number;
  mongoUrl: string;
  mongoDb: string | undefined;
  corsOrigin: string;
}

const DEFAULT_PORT = 4000;
const DEFAULT_MONGO_URL = 'mongodb://localhost:27017';
const DEFAULT_MONGO_DB = 'afterquery';
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PORT;
  }
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: "${raw}"`);
  }
  return port;
}

function resolveMongo(env: NodeJS.ProcessEnv): { mongoUrl: string; mongoDb: string | undefined } {
  const configuredUrl = env.MONGO_URL?.trim() || env.MONGODB_URI?.trim();
  const explicitDb = env.MONGO_DB?.trim();

  if (!configuredUrl || configuredUrl === DEFAULT_MONGO_URL) {
    return {
      mongoUrl: configuredUrl || DEFAULT_MONGO_URL,
      mongoDb: explicitDb || DEFAULT_MONGO_DB,
    };
  }

  return {
    mongoUrl: configuredUrl,
    mongoDb: explicitDb || undefined,
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const { mongoUrl, mongoDb } = resolveMongo(env);
  return {
    port: parsePort(env.PORT),
    mongoUrl,
    mongoDb,
    corsOrigin: env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN,
  };
}
