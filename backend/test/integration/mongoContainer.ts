import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';

export interface MongoHarness {
  container: StartedTestContainer;
  url: string;
}

export async function startMongo(): Promise<MongoHarness> {
  const container = await new GenericContainer('mongo:7')
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forLogMessage(/Waiting for connections/))
    .start();

  const url = `mongodb://${container.getHost()}:${container.getMappedPort(27017)}`;

  return { container, url };
}
