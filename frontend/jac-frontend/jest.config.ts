import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.test.json",
      },
    ],
  },
  moduleNameMapper: {
    // Silence CSS / image imports
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    "\\.(gif|png|jpg|jpeg|svg)$": "<rootDir>/__mocks__/fileMock.js",
    // Path alias from tsconfig
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  collectCoverageFrom: [
    "src/features/**/*.{ts,tsx}",
    "src/shared/**/*.{ts,tsx}",
    "src/widgets/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/*.d.ts",
  ],
};

export default config;
