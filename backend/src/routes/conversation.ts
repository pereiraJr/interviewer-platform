import express, { Router, type RequestHandler } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { MAX_AUDIO_BYTES } from '../models/interviewMessage';
import type { ConversationService } from '../services/conversationService';

const rawAudio = express.raw({ type: () => true, limit: MAX_AUDIO_BYTES });

const parseAudioBody: RequestHandler = (req, res, next) => {
  rawAudio(req, res, (error: unknown) => {
    if (error) {
      next(new HttpError(413, 'AUDIO_TOO_LARGE', 'Audio exceeds the maximum allowed size'));
      return;
    }
    next();
  });
};

export function createConversationRouter(service: ConversationService): Router {
  const router = Router();

  router.get('/interviews/:id/messages', async (req, res, next) => {
    try {
      res.json({ messages: await service.getConversation(req.params.id) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/interviews/:id/messages', parseAudioBody, async (req, res, next) => {
    try {
      if (!Buffer.isBuffer(req.body)) {
        throw new HttpError(400, 'INVALID_AUDIO', 'Audio payload required');
      }

      const rawDuration = req.header('x-audio-duration-ms');
      const durationMs = rawDuration === undefined ? 0 : Number.parseInt(rawDuration, 10);

      const message = await service.addAudioReply(String(req.params.id), {
        data: req.body,
        contentType: req.header('content-type'),
        durationMs,
      });

      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });

  router.get('/interviews/:id/messages/:messageId/audio', async (req, res, next) => {
    try {
      const { data, contentType } = await service.getAudio(req.params.id, req.params.messageId);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(data);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
