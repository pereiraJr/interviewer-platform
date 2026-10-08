import { once } from 'node:events';
import type { Server } from 'node:http';
import { createApp } from '../../src/app';
import type { JobService } from '../../src/services/jobService';

async function startApp(jobService: JobService): Promise<{ server: Server; baseUrl: string }> {
  const app = createApp({ jobService, corsOrigin: '*' });
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Failed to resolve server address');
  }
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe('error handling', () => {
  it('returns a 404 error envelope for unknown routes', async () => {
    const { server, baseUrl } = await startApp({ listAvailableJobs: async () => [] });
    try {
      const response = await fetch(`${baseUrl}/api/unknown`);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    } finally {
      server.close();
    }
  });

  it('returns a 500 error envelope when the service fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const failingService: JobService = {
      listAvailableJobs: async () => {
        throw new Error('database exploded');
      },
    };

    const { server, baseUrl } = await startApp(failingService);
    try {
      const response = await fetch(`${baseUrl}/api/jobs`);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      });
    } finally {
      server.close();
      errorSpy.mockRestore();
    }
  });
});
