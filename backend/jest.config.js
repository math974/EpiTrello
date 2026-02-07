module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/**/*.module.ts',
    '!<rootDir>/src/**/*.model.ts',
    '!<rootDir>/src/**/*.input.ts',
    '!<rootDir>/src/**/*.enum.ts',
    '!<rootDir>/src/**/models/**',
    '!<rootDir>/src/**/dto/**',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
};

