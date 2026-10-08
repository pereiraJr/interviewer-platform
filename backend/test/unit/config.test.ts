import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('applies defaults when the environment is empty', () => {
    const config = loadConfig({});

    expect(config).toEqual({
      port: 4000,
      mongoUrl: 'mongodb://localhost:27017',
      mongoDb: 'afterquery',
      corsOrigin: 'http://localhost:5173',
    });
  });

  it('prefers MONGO_URL over MONGODB_URI', () => {
    const config = loadConfig({
      MONGO_URL: 'mongodb://primary:27017',
      MONGODB_URI: 'mongodb+srv://secondary/other',
      MONGO_DB: 'explicit',
    });

    expect(config.mongoUrl).toBe('mongodb://primary:27017');
    expect(config.mongoDb).toBe('explicit');
  });

  it('accepts MONGODB_URI and derives the database from the URI', () => {
    const config = loadConfig({
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/atlasdb?retryWrites=true',
    });

    expect(config.mongoUrl).toBe(
      'mongodb+srv://user:pass@cluster.example.net/atlasdb?retryWrites=true',
    );
    expect(config.mongoDb).toBeUndefined();
  });

  it('honours an explicit MONGO_DB alongside MONGODB_URI', () => {
    const config = loadConfig({
      MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/atlasdb',
      MONGO_DB: 'afterquery',
    });

    expect(config.mongoDb).toBe('afterquery');
  });

  it('rejects an out-of-range port', () => {
    expect(() => loadConfig({ PORT: '70000' })).toThrow('Invalid PORT value');
  });
});
