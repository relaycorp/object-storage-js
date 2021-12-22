const mainJestConfig = require('./jest.config');

module.exports = {
  preset: mainJestConfig.preset,
  roots: ['build/main/integration_tests'],
  testEnvironment: mainJestConfig.testEnvironment,
  setupFilesAfterEnv: mainJestConfig.setupFilesAfterEnv
};
