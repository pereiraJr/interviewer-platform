const DEFAULT_API_BASE_URL = 'http://localhost:4000';

interface RuntimeConfig {
  __API_BASE_URL__?: string;
}

export function getApiBaseUrl(): string {
  const injected = (globalThis as RuntimeConfig).__API_BASE_URL__;
  if (injected && injected.startsWith('http')) {
    return injected;
  }
  return DEFAULT_API_BASE_URL;
}
