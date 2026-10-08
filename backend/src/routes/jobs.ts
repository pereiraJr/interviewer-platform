import { Router } from 'express';
import type { JobService } from '../services/jobService';

export function createJobsRouter(service: JobService): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      const jobs = await service.listAvailableJobs();
      res.json({ jobs });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
