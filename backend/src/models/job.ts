import { ObjectId } from 'mongodb';

export type JobStatus = 'available' | 'closed';

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 500;

export interface JobDocument {
  _id: ObjectId;
  title: string;
  description?: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSummary {
  id: string;
  title: string;
  description: string;
}

export function isValidTitle(title: unknown): title is string {
  if (typeof title !== 'string') {
    return false;
  }
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= TITLE_MAX_LENGTH;
}

export function normalizeDescription(description: unknown): string {
  if (typeof description !== 'string') {
    return '';
  }
  return description.trim().slice(0, DESCRIPTION_MAX_LENGTH);
}

export function toJobSummary(document: JobDocument): JobSummary {
  if (!isValidTitle(document.title)) {
    throw new Error(`Job ${document._id.toHexString()} has an invalid title`);
  }
  return {
    id: document._id.toHexString(),
    title: document.title.trim(),
    description: normalizeDescription(document.description),
  };
}
