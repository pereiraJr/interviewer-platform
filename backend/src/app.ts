import express, { type Express, type RequestHandler } from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createJobsRouter } from './routes/jobs';
import type { JobService } from './services/jobService';

export interface AppDependencies {
  jobService: JobService;
  corsOrigin: string;
}

function createCorsMiddleware(origin: string): RequestHandler {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
}

export function createApp({ jobService, corsOrigin }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(createCorsMiddleware(corsOrigin));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/jobs', createJobsRouter(jobService));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
