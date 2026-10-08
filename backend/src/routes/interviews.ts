import { Router } from 'express';
import type { ConversationService } from '../services/conversationService';
import type { InterviewService } from '../services/interviewService';

export function createInterviewsRouter(
  service: InterviewService,
  conversationService?: ConversationService,
): Router {
  const router = Router();

  router.post('/jobs/:jobId/interview', async (req, res, next) => {
    try {
      res.json(await service.startOrResume(req.params.jobId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/interviews/:id', async (req, res, next) => {
    try {
      res.json(await service.getById(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  router.post('/interviews/:id/consent', async (req, res, next) => {
    try {
      const decision = (req.body as { decision?: unknown } | undefined)?.decision;
      const session = await service.recordConsent(req.params.id, decision);

      if (session.status === 'in_progress' && conversationService) {
        await conversationService.seedOpening(session.id);
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
