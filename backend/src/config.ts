export interface AppConfig {
  port: number;
  mongoUrl: string;
  mongoDb: string;
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

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePort(env.PORT),
    mongoUrl: env.MONGO_URL?.trim() || DEFAULT_MONGO_URL,
    mongoDb: env.MONGO_DB?.trim() || DEFAULT_MONGO_DB,
    corsOrigin: env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN,
  };
}
