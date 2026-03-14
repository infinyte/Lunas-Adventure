module.exports = {
  testEnvironment: 'node',
  rootDir: '..',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testPathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['<rootDir>/server/**/__tests__/**/*.test.js'],
};
