const config = {
  "preset": "ts-jest/presets/default-esm",
  "extensionsToTreatAsEsm": [".ts"],
  "testEnvironment": "node",
  "globals": {
    "ts-jest": {
      "useESM": true
    }
  },
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: 'NodeNext',  // Ensure Jest handles ESM correctly
          target: 'ESNext',
          esModuleInterop: true,
          moduleResolution: 'node',
        },
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@assets/(.*)$": "<rootDir>/assets/$1",
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