module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testRegex: '\\.(spec)\\.ts?$',
  moduleFileExtensions: ['js', 'ts'],
  modulePaths: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/src/helpers/testHelpers/unit-singeleton.ts'],
  clearMocks: true,
  forceExit: true,
};
