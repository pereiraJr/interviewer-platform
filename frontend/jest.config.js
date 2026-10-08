/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          target: 'ES2022',
          esModuleInterop: true,
          types: ['jest', '@testing-library/jest-dom'],
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/styleMock.js',
  },
};
