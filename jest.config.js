const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS', // Use CommonJS for Jest
          target: 'ES2020',
          esModuleInterop: true,
          moduleResolution: 'node',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
  },
  testEnvironment: 'node',
  testRegex: '\\.(spec)\\.ts?$',
  moduleFileExtensions: ['js', 'ts'],
  modulePaths: ['<rootDir>/'],
  setupFilesAfterEnv: ['<rootDir>/src/helpers/testHelpers/unit-singeleton.ts'],
  clearMocks: true,
  forceExit: true,
};

export default config;
