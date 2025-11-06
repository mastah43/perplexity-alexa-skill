module.exports = {
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'lambda/**/*.js',
    '!lambda/node_modules/**',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 30000,
  verbose: true
};