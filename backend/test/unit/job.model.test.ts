import { ObjectId } from 'mongodb';
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  isValidTitle,
  normalizeDescription,
  toJobSummary,
  type JobDocument,
} from '../../src/models/job';

describe('job model', () => {
  describe('isValidTitle', () => {
    it('accepts a non-empty title', () => {
      expect(isValidTitle('Backend Engineer')).toBe(true);
    });

    it('rejects empty or whitespace-only titles', () => {
      expect(isValidTitle('')).toBe(false);
      expect(isValidTitle('   ')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isValidTitle(undefined)).toBe(false);
      expect(isValidTitle(42)).toBe(false);
    });

    it('rejects titles longer than the maximum length', () => {
      expect(isValidTitle('a'.repeat(TITLE_MAX_LENGTH + 1))).toBe(false);
    });
  });

  describe('normalizeDescription', () => {
    it('returns an empty string for non-string input', () => {
      expect(normalizeDescription(undefined)).toBe('');
      expect(normalizeDescription(null)).toBe('');
    });

    it('trims and truncates descriptions', () => {
      expect(normalizeDescription('  hello  ')).toBe('hello');
      expect(normalizeDescription('a'.repeat(DESCRIPTION_MAX_LENGTH + 10))).toHaveLength(
        DESCRIPTION_MAX_LENGTH,
      );
    });
  });

  describe('toJobSummary', () => {
    const baseDocument: JobDocument = {
      _id: new ObjectId(),
      title: '  Product Designer  ',
      description: 'Own the candidate experience',
      status: 'available',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('maps a document to the public summary shape', () => {
      expect(toJobSummary(baseDocument)).toEqual({
        id: baseDocument._id.toHexString(),
        title: 'Product Designer',
        description: 'Own the candidate experience',
      });
    });

    it('normalizes a missing description to an empty string', () => {
      expect(toJobSummary({ ...baseDocument, description: undefined }).description).toBe('');
    });

    it('throws when the title is invalid', () => {
      expect(() => toJobSummary({ ...baseDocument, title: '   ' })).toThrow();
    });
  });
});
