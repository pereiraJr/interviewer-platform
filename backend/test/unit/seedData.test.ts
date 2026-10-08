import type { Db } from 'mongodb';
import { DESCRIPTION_MAX_LENGTH } from '../../src/models/job';
import { sampleJobs, seedSampleJobs, type NewJob } from '../../src/seedData';

function createDb() {
  const insertMany = jest.fn().mockResolvedValue({ insertedCount: sampleJobs.length });
  const deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  const collection = jest.fn().mockReturnValue({ deleteMany, insertMany });
  const db = { collection } as unknown as Db;
  return { db, collection, deleteMany, insertMany };
}

describe('seedSampleJobs', () => {
  it('replaces the jobs collection with the baseline and returns the count', async () => {
    const { db, collection, deleteMany, insertMany } = createDb();

    await expect(seedSampleJobs(db)).resolves.toBe(sampleJobs.length);

    expect(collection).toHaveBeenCalledWith('jobs');
    expect(deleteMany).toHaveBeenCalledWith({});
    expect(insertMany).toHaveBeenCalledTimes(1);

    const [documents] = insertMany.mock.calls[0] as [Array<Record<string, unknown>>];
    expect(documents).toHaveLength(sampleJobs.length);
    expect(documents[0]).toMatchObject({
      title: 'Senior Backend Engineer',
      status: 'available',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  it('is idempotent: every run clears then rewrites the baseline', async () => {
    const { db, deleteMany, insertMany } = createDb();

    await seedSampleJobs(db);
    await seedSampleJobs(db);

    expect(deleteMany).toHaveBeenCalledTimes(2);
    expect(insertMany).toHaveBeenCalledTimes(2);
  });

  it('inserts nothing when the dataset is empty', async () => {
    const { db, deleteMany, insertMany } = createDb();

    await expect(seedSampleJobs(db, [])).resolves.toBe(0);

    expect(deleteMany).toHaveBeenCalledWith({});
    expect(insertMany).not.toHaveBeenCalled();
  });

  it('validates the dataset before writing anything when a title is invalid', async () => {
    const { db, deleteMany, insertMany } = createDb();
    const invalid: NewJob[] = [{ title: '   ', description: 'Missing title', status: 'available' }];

    await expect(seedSampleJobs(db, invalid)).rejects.toThrow(/invalid title/);

    expect(deleteMany).not.toHaveBeenCalled();
    expect(insertMany).not.toHaveBeenCalled();
  });

  it('rejects an invalid status before writing anything', async () => {
    const { db, deleteMany, insertMany } = createDb();
    const invalid = [
      { title: 'Mystery Role', description: '', status: 'draft' as unknown as NewJob['status'] },
    ];

    await expect(seedSampleJobs(db, invalid)).rejects.toThrow(/invalid status/);

    expect(deleteMany).not.toHaveBeenCalled();
    expect(insertMany).not.toHaveBeenCalled();
  });

  it('rejects an over-long description before writing anything', async () => {
    const { db, deleteMany, insertMany } = createDb();
    const invalid: NewJob[] = [
      {
        title: 'Verbose Role',
        description: 'x'.repeat(DESCRIPTION_MAX_LENGTH + 1),
        status: 'available',
      },
    ];

    await expect(seedSampleJobs(db, invalid)).rejects.toThrow(/description longer than/);

    expect(deleteMany).not.toHaveBeenCalled();
    expect(insertMany).not.toHaveBeenCalled();
  });
});
