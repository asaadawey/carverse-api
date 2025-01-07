const config = {
  moduleDirectories: ["node_modules", "src", "<rootDir>"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
  },
  testRegex: '\\.(spec)\\.ts?$',
  moduleFileExtensions: ['js', 'ts'],
  modulePaths: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/src/helpers/testHelpers/unit-singeleton.ts'],
  clearMocks: true,
  forceExit: true,
};

export default config;