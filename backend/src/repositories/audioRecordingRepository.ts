import { Binary, ObjectId, type Db } from 'mongodb';
import type { AudioRecordingDocument } from '../models/interviewMessage';

export interface StoreAudioInput {
  sessionId: string;
  data: Buffer;
  contentType: string;
  durationMs: number;
}

export interface AudioRecordingRepository {
  store(input: StoreAudioInput): Promise<AudioRecordingDocument>;
  findById(sessionId: string, recordingId: string): Promise<AudioRecordingDocument | null>;
}

export function createAudioRecordingRepository(db: Db): AudioRecordingRepository {
  const collection = db.collection<AudioRecordingDocument>('audioRecordings');

  return {
    async store(input: StoreAudioInput): Promise<AudioRecordingDocument> {
      const document: AudioRecordingDocument = {
        _id: new ObjectId(),
        sessionId: new ObjectId(input.sessionId),
        data: new Binary(input.data),
        contentType: input.contentType,
        durationMs: input.durationMs,
        byteLength: input.data.byteLength,
        createdAt: new Date(),
      };

      await collection.insertOne(document);
      return document;
    },

    async findById(sessionId: string, recordingId: string): Promise<AudioRecordingDocument | null> {
      if (!ObjectId.isValid(sessionId) || !ObjectId.isValid(recordingId)) {
        return null;
      }

      return collection.findOne({
        _id: new ObjectId(recordingId),
        sessionId: new ObjectId(sessionId),
      });
    },
  };
}
