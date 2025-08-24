const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          target: 'ES2020',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: 'node',
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(nanoid|@socket\\.io|socket\\.io-client|@noble|@isaacs)/)'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^nanoid$': '<rootDir>/src/__mocks__/nanoid.js',
    '^nanoid/(.*)$': '<rootDir>/src/__mocks__/nanoid.js',
  },
  testRegex: '\\.(spec)\\.ts?$',
  moduleFileExtensions: ['js', 'ts'],
  modulePaths: ['<rootDir>/'],
  setupFilesAfterEnv: ['<rootDir>/src/helpers/testHelpers/unit-singeleton.ts'],
  clearMocks: true,
  forceExit: true,
};

export default config;
