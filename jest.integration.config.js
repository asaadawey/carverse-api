module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testRegex: '/.*\\.integration.test\\.ts$',
  testSequencer: '<rootDir>/src/helpers/testHelpers/jestSequencer.js',
  moduleFileExtensions: ['js', 'ts'],
  modulePaths: ['<rootDir>/src/'],
  setupFilesAfterEnv: ['<rootDir>/src/helpers/testHelpers/integration-singeleton.ts'],
  clearMocks: true,
  forceExit: true,
};
