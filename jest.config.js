module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testRegex: '\\.(spec|test)\\.ts?$',
  moduleFileExtensions: ['js', 'ts'],
  modulePaths: ['<rootDir>/src/'],
  setupFilesAfterEnv: ['<rootDir>/src/helpers/testHelpers/singeleton.ts'],
  clearMocks: true,
  forceExit: true,
};
