import { ObjectId, type Db } from 'mongodb';
import {
  OPENING_MESSAGES,
  type InterviewMessageDocument,
} from '../models/interviewMessage';

export interface NewMessage {
  sessionId: ObjectId;
  author: InterviewMessageDocument['author'];
  kind: InterviewMessageDocument['kind'];
  text?: string;
  audio?: InterviewMessageDocument['audio'];
}

export interface InterviewMessageRepository {
  listBySessionId(sessionId: string): Promise<InterviewMessageDocument[]>;
  findById(sessionId: string, messageId: string): Promise<InterviewMessageDocument | null>;
  nextSequence(sessionId: string): Promise<number>;
  append(message: NewMessage): Promise<InterviewMessageDocument>;
  seedOpeningIfEmpty(sessionId: string): Promise<void>;
}

export function createInterviewMessageRepository(db: Db): InterviewMessageRepository {
  const collection = db.collection<InterviewMessageDocument>('interviewMessages');

  return {
    async listBySessionId(sessionId: string): Promise<InterviewMessageDocument[]> {
      if (!ObjectId.isValid(sessionId)) {
        return [];
      }

      return collection
        .find({ sessionId: new ObjectId(sessionId) })
        .sort({ sequence: 1 })
        .toArray();
    },

    async findById(sessionId: string, messageId: string): Promise<InterviewMessageDocument | null> {
      if (!ObjectId.isValid(sessionId) || !ObjectId.isValid(messageId)) {
        return null;
      }

      return collection.findOne({
        _id: new ObjectId(messageId),
        sessionId: new ObjectId(sessionId),
      });
    },

    async nextSequence(sessionId: string): Promise<number> {
      const count = await collection.countDocuments({ sessionId: new ObjectId(sessionId) });
      return count + 1;
    },

    async append(message: NewMessage): Promise<InterviewMessageDocument> {
      const now = new Date();
      const sequence = await this.nextSequence(message.sessionId.toHexString());
      const document: InterviewMessageDocument = {
        _id: new ObjectId(),
        ...message,
        sequence,
        createdAt: now,
      };

      await collection.insertOne(document);
      return document;
    },

    async seedOpeningIfEmpty(sessionId: string): Promise<void> {
      if (!ObjectId.isValid(sessionId)) {
        return;
      }

      const sessionObjectId = new ObjectId(sessionId);
      const existing = await collection.countDocuments({ sessionId: sessionObjectId });
      if (existing > 0) {
        return;
      }

      const now = new Date();
      const documents: InterviewMessageDocument[] = OPENING_MESSAGES.map((text, index) => ({
        _id: new ObjectId(),
        sessionId: sessionObjectId,
        author: 'agent',
        kind: 'text',
        text,
        sequence: index + 1,
        createdAt: now,
      }));

      await collection.insertMany(documents);
    },
  };
}
